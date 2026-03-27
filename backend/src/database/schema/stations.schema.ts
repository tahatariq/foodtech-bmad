import { pgTable, text, integer, index, unique } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, isActiveColumn } from '../utils/schema-helpers';
import { locations } from './locations.schema';

export const stations = pgTable(
  'stations',
  {
    id: primaryId(),
    name: text('name').notNull(),
    emoji: text('emoji'),
    display_order: integer('display_order').notNull().default(0),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    is_active: isActiveColumn(),
    ...timestamps(),
  },
  (table) => [
    index('idx_stations_tenant_id').on(table.tenant_id),
    unique('stations_tenant_name_unique').on(table.tenant_id, table.name),
  ],
);
