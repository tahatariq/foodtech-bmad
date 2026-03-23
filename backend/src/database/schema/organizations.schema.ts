import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  subscription_tier: text('subscription_tier').notNull().default('indie'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
