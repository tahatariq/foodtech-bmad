import {
  pgTable,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../utils/schema-helpers';
import { locations } from './locations.schema';

export const webhookSubscriptions = pgTable(
  'webhook_subscriptions',
  {
    id: primaryId(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => locations.id),
    url: text('url').notNull(),
    events: jsonb('events').notNull().$type<string[]>(),
    secret: text('secret').notNull(), // raw signing secret for HMAC
    is_active: boolean('is_active').notNull().default(true),
    delivery_count: integer('delivery_count').notNull().default(0),
    success_count: integer('success_count').notNull().default(0),
    last_delivery_at: timestamp('last_delivery_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [index('idx_webhook_subs_tenant_id').on(table.tenant_id)],
);

export const webhookDeadLetters = pgTable(
  'webhook_dead_letters',
  {
    id: primaryId(),
    subscription_id: text('subscription_id')
      .notNull()
      .references(() => webhookSubscriptions.id),
    event_type: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    error: text('error'),
    attempts: integer('attempts').notNull().default(3),
    ...timestamps(),
  },
  (table) => [
    index('idx_webhook_dl_subscription_id').on(table.subscription_id),
  ],
);
