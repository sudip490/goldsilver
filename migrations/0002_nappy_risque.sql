CREATE TABLE "khata_party" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"type" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "khata_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"party_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" real NOT NULL,
	"date" timestamp NOT NULL,
	"description" text NOT NULL,
	"notes" text,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_khata_party_user" ON "khata_party" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_khata_party_type" ON "khata_party" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_khata_transaction_user" ON "khata_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_khata_transaction_party" ON "khata_transaction" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "idx_khata_transaction_date" ON "khata_transaction" USING btree ("date");