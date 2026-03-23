import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { primaryId } from '../utils/schema-helpers';
import { users } from './users.schema';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: primaryId(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    token_hash: text('token_hash').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    is_revoked: boolean('is_revoked').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.user_id),
    index('idx_refresh_tokens_token_hash').on(table.token_hash),
  ],
);
