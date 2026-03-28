import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { eq, and, or, gt } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { apiKeys } from '../../database/schema/api-keys.schema';

@Injectable()
export class IntegrationsApiKeysService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async generateKeyPair(tenantId: string) {
    const key = `ft_key_${randomBytes(16).toString('hex')}`;
    const secret = randomBytes(32).toString('hex');
    const keyPrefix = key.slice(0, 12);

    const [record] = await this.db
      .insert(apiKeys)
      .values({
        tenant_id: tenantId,
        key_prefix: keyPrefix,
        key_hash: this.hash(key),
        secret_hash: this.hash(secret),
      })
      .returning();

    return {
      id: record.id,
      key,
      secret,
      keyPrefix,
      created_at: record.created_at,
    };
  }

  async listKeys(tenantId: string) {
    const keys = await this.db
      .select({
        id: apiKeys.id,
        key_prefix: apiKeys.key_prefix,
        is_active: apiKeys.is_active,
        grace_period_until: apiKeys.grace_period_until,
        created_at: apiKeys.created_at,
        revoked_at: apiKeys.revoked_at,
      })
      .from(apiKeys)
      .where(eq(apiKeys.tenant_id, tenantId));

    return keys;
  }

  async revokeKey(keyId: string) {
    const [updated] = await this.db
      .update(apiKeys)
      .set({
        is_active: false,
        revoked_at: new Date(),
      })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.is_active, true)))
      .returning();

    if (!updated) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'API Key Not Found',
        status: 404,
        detail: `API key ${keyId} not found or already revoked.`,
      });
    }

    return { id: updated.id, revoked: true };
  }

  async rotateKey(keyId: string, tenantId: string) {
    // Find the existing key
    const [existing] = await this.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.is_active, true)));

    if (!existing) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'API Key Not Found',
        status: 404,
        detail: `API key ${keyId} not found or already revoked.`,
      });
    }

    // Set 24h grace period on old key
    const gracePeriodUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db
      .update(apiKeys)
      .set({
        is_active: false,
        revoked_at: new Date(),
        grace_period_until: gracePeriodUntil,
      })
      .where(eq(apiKeys.id, keyId));

    // Generate new key pair
    return this.generateKeyPair(tenantId);
  }

  async validateApiKey(keyHash: string) {
    const now = new Date();

    const [key] = await this.db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key_hash, keyHash),
          or(eq(apiKeys.is_active, true), gt(apiKeys.grace_period_until, now)),
        ),
      );

    return key ?? null;
  }
}
