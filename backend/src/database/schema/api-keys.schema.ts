import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../utils/schema-helpers';
import { locations } from './locations.schema';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: primaryId(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    key_prefix: text('key_prefix').notNull(),
    key_hash: text('key_hash').notNull(),
    secret_hash: text('secret_hash').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('idx_api_keys_key_hash').on(table.key_hash),
    index('idx_api_keys_tenant_id').on(table.tenant_id),
  ],
);
