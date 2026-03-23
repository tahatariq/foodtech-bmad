import { text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export function primaryId() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

export function timestamps() {
  return {
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdateFn(() => new Date()),
  };
}

export function isActiveColumn() {
  return boolean('is_active').notNull().default(true);
}
