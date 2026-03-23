import { pgEnum } from 'drizzle-orm/pg-core';

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'indie',
  'growth',
  'enterprise',
]);

export const staffRoleEnum = pgEnum('staff_role', [
  'line_cook',
  'head_chef',
  'location_manager',
  'org_owner',
  'customer',
  'delivery_partner',
  'supplier',
  'supplier_api',
  'system_admin',
]);
