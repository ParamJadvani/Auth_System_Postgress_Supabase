import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const UserRole = ["admin", "user"] as const;

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: text("role", { enum: UserRole }).notNull().default("user"),
    emailVerified: boolean("emailVerified").default(false),
    password: text("password").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

// export const products = pgTable("products", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     userId: uuid("userId")
//         .notNull()
//         .references(() => users.id),
//     name: text("name").notNull(),
//     description: text("description").notNull(),
//     price: integer("price").notNull(),
//     image: text("image").notNull(),
//     createdAt: timestamp("createdAt").defaultNow(),
//     updatedAt: timestamp("updatedAt").defaultNow(),
// });

// export const cart = pgTable("cart", {
//     id: uuid("id").defaultRandom().primaryKey(),
//     userId: uuid("userId")
//         .notNull()
//         .references(() => users.id),
//     productId: uuid("productId")
//         .notNull()
//         .references(() => products.id),
//     quantity: integer("quantity").notNull(),
//     createdAt: timestamp("createdAt").defaultNow(),
//     updatedAt: timestamp("updatedAt").defaultNow(),
// });

export type User = InferSelectModel<typeof users>;
// export type Product = InferSelectModel<typeof products>;
// export type Cart = InferSelectModel<typeof cart>;
