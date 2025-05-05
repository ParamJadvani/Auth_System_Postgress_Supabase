import { pgTable, text, timestamp, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// Define enums
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const tokenTypeEnum = pgEnum("token_type", [
    "access",
    "refresh",
    "verification",
    "password_reset",
]);

// Users table
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: userRoleEnum("role").notNull().default("user"),
    emailVerified: boolean("emailVerified").default(false),
    password: text("password").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

// Tokens table - for managing auth tokens, verification tokens, and password reset tokens
export const tokens = pgTable("tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: tokenTypeEnum("type").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    createdByIp: text("createdByIp"),
    revokedAt: timestamp("revokedAt"),
    revokedByIp: text("revokedByIp"),
    replacedByToken: text("replacedByToken"),
    userAgent: text("userAgent"),
});

// Type definitions for easy use in the application
export type User = InferSelectModel<typeof users>;
export type Token = InferSelectModel<typeof tokens>;
