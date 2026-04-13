import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { contacts } from "./contacts";
import { projects } from "./projects";

export const products = pgTable("products", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  canonicalId: text("canonical_id").notNull(),
  name: text().notNull(),
  category: text().notNull(),
  productType: text("product_type", {
    enum: ["print", "digital", "album", "wall_art", "package", "service", "single", "other"],
  }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  materials: text("materials"),
  sizeRange: text("size_range"),
  includes: text("includes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("products_tenant_canonical_idx").on(table.tenantId, table.canonicalId),
  index("products_tenant_id_idx").on(table.tenantId),
]);

export const priceLists = pgTable("price_lists", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text().notNull(),
  year: integer().notNull(),
  urlHash: text("url_hash").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("price_lists_url_hash_idx").on(table.urlHash),
]);

export const priceListItems = pgTable("price_list_items", {
  id: uuid().defaultRandom().primaryKey(),
  priceListId: uuid("price_list_id").notNull().references(() => priceLists.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  sizeLabel: text("size_label"),
  priceCents: integer("price_cents").notNull(),
}, (table) => [
  index("price_list_items_price_list_id_idx").on(table.priceListId),
]);

export const orders = pgTable("orders", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  projectId: uuid("project_id").references(() => projects.id),
  status: text({
    enum: ["draft", "pending", "partially_paid", "paid", "cancelled", "refunded"],
  }).notNull().default("draft"),
  totalCents: integer("total_cents").notNull().default(0),
  notes: text(),
  subtotalCents: integer("subtotal_cents"),
  gstCents: integer("gst_cents"),
  createdBy: text("created_by"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("orders_tenant_id_idx").on(table.tenantId),
  index("orders_contact_id_idx").on(table.contactId),
  index("orders_project_id_idx").on(table.projectId),
]);

export const orderItems = pgTable("order_items", {
  id: uuid().defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  priceListItemId: uuid("price_list_item_id").references(() => priceListItems.id),
  description: text().notNull(),
  quantity: integer().notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  fulfilmentStage: text("fulfilment_stage", {
    enum: ["not_started", "retouching", "client_review", "revisions", "approved", "lab_ordered", "in_production", "shipped", "delivered"],
  }).notNull().default("not_started"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  itemType: text("item_type"),
  taxCents: integer("tax_cents"),
  images: text("images").array(),
  fulfilmentNotes: text("fulfilment_notes"),
  extendedPriceCents: integer("extended_price_cents"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
]);

export const fulfilmentHistory = pgTable("fulfilment_history", {
  id: uuid().defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  fromStage: text("from_stage", {
    enum: ["not_started", "retouching", "client_review", "revisions", "approved", "lab_ordered", "in_production", "shipped", "delivered"],
  }).notNull(),
  toStage: text("to_stage", {
    enum: ["not_started", "retouching", "client_review", "revisions", "approved", "lab_ordered", "in_production", "shipped", "delivered"],
  }).notNull(),
  performedBy: uuid("performed_by").references(() => users.id),
  note: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("fulfilment_history_item_id_idx").on(table.itemId),
]);

export const paymentPlans = pgTable("payment_plans", {
  id: uuid().defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  templateType: text("template_type", {
    enum: ["portrait_50_50", "portrait_quarterly", "wedding_standard", "custom"],
  }).notNull(),
  status: text({
    enum: ["active", "completed", "cancelled", "paused"],
  }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payment_plans_order_id_idx").on(table.orderId),
]);

export const paymentInstalments = pgTable("payment_instalments", {
  id: uuid().defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => paymentPlans.id, { onDelete: "cascade" }),
  label: text().notNull(),
  amountCents: integer("amount_cents").notNull(),
  amountPaidCents: integer("amount_paid_cents").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }).notNull(),
  status: text({
    enum: ["scheduled", "processing", "paid", "failed", "cancelled", "skipped"],
  }).notNull().default("scheduled"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  attempts: integer().notNull().default(0),
  note: text("note"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
}, (table) => [
  index("payment_instalments_plan_id_idx").on(table.planId),
  index("payment_instalments_due_date_status_idx").on(table.dueDate, table.status),
  index("payment_instalments_amount_paid_idx").on(table.planId, table.amountPaidCents),
  index("payment_instalments_reminder_sent_idx").on(table.reminderSent, table.dueDate),
]);
