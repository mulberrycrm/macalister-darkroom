import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text({ enum: ["admin", "user", "photographer", "design_consultant", "editor", "customer_service"] }).notNull().default("user"),
  themePreference: text("theme_preference", { enum: ["dark", "light"] }).notNull().default("dark"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("users_tenant_id_idx").on(table.tenantId),
]);

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);
