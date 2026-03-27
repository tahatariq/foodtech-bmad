ALTER TABLE "order_items" ADD COLUMN "stage_entered_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "order_stages" ADD COLUMN "warning_threshold_minutes" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_stages" ADD COLUMN "critical_threshold_minutes" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_token_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_orders_tracking_token" ON "orders" USING btree ("tracking_token");