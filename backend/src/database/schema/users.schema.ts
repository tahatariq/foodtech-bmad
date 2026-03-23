import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, isActiveColumn } from '../utils/schema-helpers';

export const users = pgTable(
  'users',
  {
    id: primaryId(),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash').notNull(),
    display_name: text('display_name').notNull(),
    is_active: isActiveColumn(),
    ...timestamps(),
  },
  (table) => [index('idx_users_email').on(table.email)],
);
