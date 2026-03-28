import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import {
  webhookSubscriptions,
  webhookDeadLetters,
} from '../../database/schema/webhooks.schema';

const DELIVERY_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1_000;

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  computeHmac(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  async deliverEvent(
    tenantId: string,
    eventType: string,
    payload: unknown,
  ): Promise<void> {
    const subs = await this.db
      .select()
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.tenant_id, tenantId),
          eq(webhookSubscriptions.is_active, true),
        ),
      );

    const matchingSubs = subs.filter((s) => {
      const events = s.events;
      return events.includes(eventType) || events.includes('*');
    });

    for (const sub of matchingSubs) {
      void this.deliverToSubscription(sub, eventType, payload, 0);
    }
  }

  private async deliverToSubscription(
    sub: typeof webhookSubscriptions.$inferSelect,
    eventType: string,
    payload: unknown,
    attempt: number,
  ): Promise<void> {
    const body = JSON.stringify({
      event: eventType,
      payload,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    const signature = this.computeHmac(body, sub.secret);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

      const response = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FoodTech-Signature': signature,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        await this.recordSuccess(sub.id);
        return;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Webhook delivery failed for sub ${sub.id}, attempt ${attempt + 1}: ${errorMsg}`,
      );

      await this.recordDelivery(sub.id);

      if (attempt + 1 < MAX_RETRIES) {
        const delayMs = BACKOFF_BASE_MS * Math.pow(4, attempt);
        setTimeout(() => {
          void this.deliverToSubscription(sub, eventType, payload, attempt + 1);
        }, delayMs);
      } else {
        await this.moveToDeadLetter(sub.id, eventType, payload, errorMsg);
      }
    }
  }

  private async recordSuccess(subscriptionId: string): Promise<void> {
    await this.db
      .update(webhookSubscriptions)
      .set({
        delivery_count: sql`${webhookSubscriptions.delivery_count} + 1`,
        success_count: sql`${webhookSubscriptions.success_count} + 1`,
        last_delivery_at: new Date(),
      })
      .where(eq(webhookSubscriptions.id, subscriptionId));
  }

  private async recordDelivery(subscriptionId: string): Promise<void> {
    await this.db
      .update(webhookSubscriptions)
      .set({
        delivery_count: sql`${webhookSubscriptions.delivery_count} + 1`,
        last_delivery_at: new Date(),
      })
      .where(eq(webhookSubscriptions.id, subscriptionId));
  }

  private async moveToDeadLetter(
    subscriptionId: string,
    eventType: string,
    payload: unknown,
    error: string,
  ): Promise<void> {
    await this.db.insert(webhookDeadLetters).values({
      subscription_id: subscriptionId,
      event_type: eventType,
      payload,
      error,
      attempts: MAX_RETRIES,
    });

    this.logger.error(
      `Webhook delivery exhausted for sub ${subscriptionId}, event ${eventType}. Moved to dead-letter queue.`,
    );
  }

  async retryDeadLetter(deadLetterId: string): Promise<void> {
    const [dl] = await this.db
      .select()
      .from(webhookDeadLetters)
      .where(eq(webhookDeadLetters.id, deadLetterId));

    if (!dl) {
      return;
    }

    const [sub] = await this.db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, dl.subscription_id));

    if (!sub || !sub.is_active) {
      return;
    }

    // Remove from dead-letter queue and re-deliver
    await this.db
      .delete(webhookDeadLetters)
      .where(eq(webhookDeadLetters.id, deadLetterId));

    void this.deliverToSubscription(sub, dl.event_type, dl.payload, 0);
  }
}
