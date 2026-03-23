import { pgTable, text, index, unique } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, isActiveColumn } from '../utils/schema-helpers';
import { staffRoleEnum } from './enums';
import { users } from './users.schema';
import { locations } from './locations.schema';

export const staff = pgTable(
  'staff',
  {
    id: primaryId(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    role: staffRoleEnum('role').notNull(),
    is_active: isActiveColumn(),
    ...timestamps(),
  },
  (table) => [
    index('idx_staff_tenant_id').on(table.tenant_id),
    index('idx_staff_user_id').on(table.user_id),
    unique('staff_user_tenant_unique').on(table.user_id, table.tenant_id),
  ],
);
