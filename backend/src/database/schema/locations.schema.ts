import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, isActiveColumn } from '../utils/schema-helpers';
import { organizations } from './organizations.schema';

export const locations = pgTable(
  'locations',
  {
    id: primaryId(),
    organization_id: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    address: text('address'),
    timezone: text('timezone').notNull().default('UTC'),
    api_key: text('api_key'),
    is_active: isActiveColumn(),
    ...timestamps(),
  },
  (table) => [index('idx_locations_organization_id').on(table.organization_id)],
);
