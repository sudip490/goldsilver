CREATE TABLE "nepal_rates_history" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"price" real NOT NULL,
	"change" real,
	"change_percent" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"gold_price" real,
	"silver_price" real,
	"gold_change" real,
	"silver_change" real,
	"gold_change_percent" real,
	"silver_change_percent" real,
	"users_notified" integer DEFAULT 0,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"metal_type" text NOT NULL,
	"price_type" text NOT NULL,
	"price" real NOT NULL,
	"change" real,
	"change_percent" real,
	"unit" text,
	"currency" text DEFAULT 'NPR',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "khata_party" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "khata_party" ADD COLUMN "share_token_created_at" timestamp;--> statement-breakpoint
CREATE INDEX "nepal_rates_history_date_idx" ON "nepal_rates_history" USING btree ("date");--> statement-breakpoint
CREATE INDEX "nepal_rates_history_name_idx" ON "nepal_rates_history" USING btree ("name");--> statement-breakpoint
CREATE INDEX "notification_log_date_idx" ON "notification_log" USING btree ("date");--> statement-breakpoint
CREATE INDEX "price_history_date_idx" ON "price_history" USING btree ("date");--> statement-breakpoint
CREATE INDEX "price_history_metal_type_idx" ON "price_history" USING btree ("metal_type");--> statement-breakpoint
CREATE INDEX "price_history_price_type_idx" ON "price_history" USING btree ("price_type");--> statement-breakpoint
CREATE INDEX "idx_khata_party_share_token" ON "khata_party" USING btree ("share_token");