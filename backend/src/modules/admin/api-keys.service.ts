import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { apiKeys } from '../../database/schema/api-keys.schema';

@Injectable()
export class ApiKeysService {
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
      webhookUrl: `/api/webhooks/${tenantId}`,
    };
  }

  async listKeys(tenantId: string) {
    const keys = await this.db
      .select({
        id: apiKeys.id,
        key_prefix: apiKeys.key_prefix,
        is_active: apiKeys.is_active,
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
}
