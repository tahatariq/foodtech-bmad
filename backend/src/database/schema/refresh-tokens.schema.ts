import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  token_hash: text('token_hash').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  is_revoked: boolean('is_revoked').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
