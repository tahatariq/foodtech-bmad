import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import {
  webhookSubscriptions,
  webhookDeadLetters,
} from '../../database/schema/webhooks.schema';

@Injectable()
export class WebhookService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createSubscription(tenantId: string, url: string, events: string[]) {
    const secret = randomBytes(32).toString('hex');

    const [record] = await this.db
      .insert(webhookSubscriptions)
      .values({
        tenant_id: tenantId,
        url,
        events,
        secret,
      })
      .returning();

    return {
      id: record.id,
      url: record.url,
      events: record.events,
      secret, // returned once to the caller
      is_active: record.is_active,
      created_at: record.created_at,
    };
  }

  async listSubscriptions(tenantId: string) {
    const subs = await this.db
      .select({
        id: webhookSubscriptions.id,
        url: webhookSubscriptions.url,
        events: webhookSubscriptions.events,
        is_active: webhookSubscriptions.is_active,
        delivery_count: webhookSubscriptions.delivery_count,
        success_count: webhookSubscriptions.success_count,
        last_delivery_at: webhookSubscriptions.last_delivery_at,
        created_at: webhookSubscriptions.created_at,
      })
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.tenant_id, tenantId),
          eq(webhookSubscriptions.is_active, true),
        ),
      );

    return subs.map((s) => ({
      ...s,
      success_rate:
        s.delivery_count > 0
          ? Math.round((s.success_count / s.delivery_count) * 10000) / 100
          : 0,
    }));
  }

  async deactivateSubscription(id: string) {
    const [updated] = await this.db
      .update(webhookSubscriptions)
      .set({ is_active: false })
      .where(
        and(
          eq(webhookSubscriptions.id, id),
          eq(webhookSubscriptions.is_active, true),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Webhook Not Found',
        status: 404,
        detail: `Webhook subscription ${id} not found or already deactivated.`,
      });
    }

    return { id: updated.id, deactivated: true };
  }

  async updateSubscription(
    id: string,
    data: { url?: string; events?: string[] },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.url !== undefined) updateData['url'] = data.url;
    if (data.events !== undefined) updateData['events'] = data.events;

    const [updated] = await this.db
      .update(webhookSubscriptions)
      .set(updateData)
      .where(
        and(
          eq(webhookSubscriptions.id, id),
          eq(webhookSubscriptions.is_active, true),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Webhook Not Found',
        status: 404,
        detail: `Webhook subscription ${id} not found or deactivated.`,
      });
    }

    return {
      id: updated.id,
      url: updated.url,
      events: updated.events,
      is_active: updated.is_active,
    };
  }

  async getDeadLetters(tenantId: string) {
    // Join dead letters with subscriptions to filter by tenant
    const results = await this.db
      .select({
        id: webhookDeadLetters.id,
        subscription_id: webhookDeadLetters.subscription_id,
        event_type: webhookDeadLetters.event_type,
        payload: webhookDeadLetters.payload,
        error: webhookDeadLetters.error,
        attempts: webhookDeadLetters.attempts,
        created_at: webhookDeadLetters.created_at,
      })
      .from(webhookDeadLetters)
      .innerJoin(
        webhookSubscriptions,
        eq(webhookDeadLetters.subscription_id, webhookSubscriptions.id),
      )
      .where(eq(webhookSubscriptions.tenant_id, tenantId));

    return results;
  }

  async getDeadLetterById(id: string) {
    const [dl] = await this.db
      .select()
      .from(webhookDeadLetters)
      .where(eq(webhookDeadLetters.id, id));

    if (!dl) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Dead Letter Not Found',
        status: 404,
        detail: `Dead letter entry ${id} not found.`,
      });
    }

    return dl;
  }

  async deleteDeadLetter(id: string) {
    await this.db
      .delete(webhookDeadLetters)
      .where(eq(webhookDeadLetters.id, id));
  }
}
