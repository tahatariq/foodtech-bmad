import {
  pgTable,
  text,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { locations } from './locations.schema';

export const staff = pgTable(
  'staff',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    role: text('role').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_staff_tenant_id').on(table.tenant_id),
    index('idx_staff_user_id').on(table.user_id),
    unique('staff_user_tenant_unique').on(table.user_id, table.tenant_id),
  ],
);
