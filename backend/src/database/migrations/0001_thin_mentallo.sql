CREATE TYPE "public"."order_status" AS ENUM('received', 'preparing', 'plating', 'served', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"item_name" text NOT NULL,
	"station_id" text NOT NULL,
	"stage" "order_status" DEFAULT 'received' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sequence" integer NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_stages_tenant_sequence_unique" UNIQUE("tenant_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"status" "order_status" DEFAULT 'received' NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"tenant_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stations_tenant_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_stages" ADD CONSTRAINT "order_stages_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_station_id" ON "order_items" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_tenant_id" ON "order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_stages_tenant_id" ON "order_stages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_id" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_id_status" ON "orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_stations_tenant_id" ON "stations" USING btree ("tenant_id");