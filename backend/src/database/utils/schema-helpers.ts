import { text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { locations } from '../schema/locations.schema';

export function primaryId() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

export function tenantId() {
  return text('tenant_id')
    .notNull()
    .references(() => locations.id);
}

export function timestamps() {
  return {
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  };
}

export function isActiveColumn() {
  return boolean('is_active').notNull().default(true);
}
