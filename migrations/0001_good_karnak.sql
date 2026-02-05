CREATE TABLE "portfolio_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"metal" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" real NOT NULL,
	"price" real NOT NULL,
	"rate" real NOT NULL,
	"date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_transaction" ADD CONSTRAINT "portfolio_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_transaction_userId_idx" ON "portfolio_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "portfolio_transaction_date_idx" ON "portfolio_transaction" USING btree ("date");