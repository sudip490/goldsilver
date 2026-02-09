import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, real, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

// Portfolio Transaction Table
export const portfolioTransaction = pgTable(
    "portfolio_transaction",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // 'buy' or 'sell'
        metal: text("metal").notNull(), // 'gold' or 'silver'
        unit: text("unit").notNull(), // 'tola' or 'gram'
        quantity: real("quantity").notNull(),
        price: real("price").notNull(), // Total price
        rate: real("rate").notNull(), // Rate per unit
        date: timestamp("date").notNull(),
        notes: text("notes"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [
        index("portfolio_transaction_userId_idx").on(table.userId),
        index("portfolio_transaction_date_idx").on(table.date),
    ],
);

export const portfolioTransactionRelations = relations(portfolioTransaction, ({ one }) => ({
    user: one(user, {
        fields: [portfolioTransaction.userId],
        references: [user.id],
    }),
}));

export const userPortfolioRelations = relations(user, ({ many }) => ({
    portfolioTransactions: many(portfolioTransaction),
}));

// Khata Party (Customers, Suppliers, Staff, Personal contacts)
export const khataParty = pgTable(
    "khata_party",
    {
        id: text("id").primaryKey(),
        userId: text("user_id").notNull(),
        name: text("name").notNull(),
        phone: text("phone"),
        email: text("email"),
        type: text("type").notNull(), // 'customer', 'supplier', 'staff', 'personal'
        notes: text("notes"),
        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        userIdIdx: index("idx_khata_party_user").on(table.userId),
        typeIdx: index("idx_khata_party_type").on(table.type),
    })
);

// Khata Transactions (You Gave / You Got)
export const khataTransaction = pgTable(
    "khata_transaction",
    {
        id: text("id").primaryKey(),
        userId: text("user_id").notNull(),
        partyId: text("party_id").notNull(),
        type: text("type").notNull(), // 'gave' (debit), 'got' (credit)
        amount: real("amount").notNull(),
        date: timestamp("date").notNull(),
        description: text("description").notNull(),
        notes: text("notes"),
        attachmentUrl: text("attachment_url"),
        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        userIdIdx: index("idx_khata_transaction_user").on(table.userId),
        partyIdIdx: index("idx_khata_transaction_party").on(table.partyId),
        dateIdx: index("idx_khata_transaction_date").on(table.date),
    })
);

