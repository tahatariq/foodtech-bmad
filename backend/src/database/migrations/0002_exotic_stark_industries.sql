CREATE TABLE "checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"checklist_id" text NOT NULL,
	"description" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"item_name" text NOT NULL,
	"current_quantity" integer DEFAULT 0 NOT NULL,
	"reorder_threshold" integer DEFAULT 0 NOT NULL,
	"is_86d" boolean DEFAULT false NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_name_tenant_unique" UNIQUE("item_name","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "prep_checklists" (
	"id" text PRIMARY KEY NOT NULL,
	"station_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prep_checklists_station_tenant_unique" UNIQUE("station_id","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_prep_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."prep_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prep_checklists" ADD CONSTRAINT "prep_checklists_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prep_checklists" ADD CONSTRAINT "prep_checklists_tenant_id_locations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checklist_items_checklist_id" ON "checklist_items" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_tenant_id" ON "inventory_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_is_86d" ON "inventory_items" USING btree ("is_86d");