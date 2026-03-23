import { pgTable, text } from 'drizzle-orm/pg-core';
import { primaryId, timestamps, isActiveColumn } from '../utils/schema-helpers';
import { subscriptionTierEnum } from './enums';

export const organizations = pgTable('organizations', {
  id: primaryId(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  subscription_tier: subscriptionTierEnum('subscription_tier')
    .notNull()
    .default('indie'),
  is_active: isActiveColumn(),
  ...timestamps(),
});
