CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"period_start" date,
	"period_end" date,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"period" varchar(10) DEFAULT 'monthly' NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "budgets_user_id_category_id_period_unique" UNIQUE("user_id","category_id","period"),
	CONSTRAINT "budget_amount_check" CHECK ("budgets"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" varchar(10) NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_user_id_name_type_unique" UNIQUE("user_id","name","type")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category_id" integer,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(10) NOT NULL,
	"description" varchar(255),
	"notes" text,
	"transaction_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "amount_check" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_insights_user_created" ON "ai_insights" USING btree ("user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_txn_user_date" ON "transactions" USING btree ("user_id","transaction_date" DESC);--> statement-breakpoint
CREATE INDEX "idx_txn_category" ON "transactions" USING btree ("category_id");