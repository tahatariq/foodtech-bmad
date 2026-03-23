import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations.schema';

export const locations = pgTable(
  'locations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organization_id: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    address: text('address'),
    timezone: text('timezone').notNull().default('UTC'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index('idx_locations_organization_id').on(table.organization_id)],
);
