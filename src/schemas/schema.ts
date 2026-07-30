import { pgTable, varchar, timestamp, integer, boolean, unique, numeric, text, date, index, check, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { ulid } from "ulidx";

export const users = pgTable("users", {
    id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("IDR"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    currentChallenge: text("current_challenge"),
    twoFactorSecret: text("two_factor_secret"),
    isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
    twoFactorBackupCodes: jsonb("two_factor_backup_codes"),
});

export const categories = pgTable(
    "categories",
    {
        id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
        userId: varchar("user_id", { length: 26 }).notNull().references(() => users.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 50 }).notNull(),
        type: varchar("type", { length: 10 }).$type<"income" | "expense" | "transfer">().notNull(),
        icon: varchar("icon", { length: 50 }),
        color: varchar("color", { length: 7 }),
        isDefault: boolean("is_default").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique().on(table.userId, table.name, table.type)
    ]
);

export const transactions = pgTable(
    "transactions",
    {
        id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
        userId: varchar("user_id", { length: 26 }).notNull().references(() => users.id, { onDelete: "cascade" }),
        categoryId: varchar("category_id", { length: 26 }).references(() => categories.id, {
            onDelete: "set null",
        }),
        amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
        type: varchar("type", { length: 10 }).$type<"income" | "expense" | "transfer">().notNull(),
        description: varchar("description", { length: 255 }),
        notes: text("notes"),
        transactionDate: date("transaction_date").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        check("amount_check", sql`${table.amount} > 0`),
        index("idx_txn_user_date").on(table.userId, sql`${table.transactionDate} DESC`),
        index("idx_txn_category").on(table.categoryId)
    ]
);

export const budgets = pgTable(
    "budgets",
    {
        id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
        userId: varchar("user_id", { length: 26 }).notNull().references(() => users.id, { onDelete: "cascade" }),
        categoryId: varchar("category_id", { length: 26 }).notNull().references(() => categories.id, { onDelete: "cascade" }),
        amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
        period: varchar("period", { length: 10 }).$type<"monthly" | "weekly">().default("monthly").notNull(),
        startDate: date("start_date").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        check("budget_amount_check", sql`${table.amount} > 0`),
        unique().on(table.userId, table.categoryId, table.period)
    ]
);

export const ai_insights = pgTable(
    "ai_insights",
    {
        id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
        userId: varchar("user_id", { length: 26 }).notNull().references(() => users.id, { onDelete: "cascade" }),
        insightType: varchar("insight_type", { length: 50 }).notNull(),
        periodStart: date("period_start"),
        periodEnd: date("period_end"),
        contentJson: jsonb("content_json").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        unique().on(table.userId, table.insightType),
        index("idx_insights_user_created").on(
            table.userId,
            sql`${table.createdAt} DESC`
        ),
    ]
);

export const passwordResets = pgTable(
    "password_resets",
    {
        userId: varchar("user_id", { length: 26 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
        otp: varchar("otp", { length: 6 }).notNull(),
        token: varchar("token", { length: 255 }),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    }
);

export const passkeys = pgTable("passkeys", {
    id: varchar("id", { length: 26 }).primaryKey().$defaultFn(() => ulid()),
    userId: varchar("user_id", { length: 26 }).references(() => users.id).notNull().unique(),
    credentialID: text("credential_id").notNull(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
});