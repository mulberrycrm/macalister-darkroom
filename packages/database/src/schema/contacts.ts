import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./core";

export const contacts = pgTable("contacts", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  knownAs: text("known_as").notNull(),
  contactType: text("contact_type", {
    enum: ["individual", "couple", "family", "corporate", "candidate"],
  }).notNull().default("individual"),
  leadSource: text("lead_source"),
  tags: text().array().notNull().default([]),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  notes: text("notes"),
  mailingList: boolean("mailing_list").notNull().default(false),
  mailingListSegment: text("mailing_list_segment").array(),
  galleryLink: text("gallery_link"),
  organisation: text("organisation"),
  region: text("region"),
  suburb: text("suburb"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("contacts_tenant_id_idx").on(table.tenantId),
  index("contacts_contact_type_idx").on(table.tenantId, table.contactType),
]);

export const contactPeople = pgTable("contact_people", {
  id: uuid().defaultRandom().primaryKey(),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  role: text({ enum: ["primary", "partner", "child", "pet", "staff_member", "mum", "dad", "parent"] }).notNull().default("primary"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text(),
  phone: text(),
  birthDate: timestamp("birth_date", { mode: "date" }),
  sortOrder: integer("sort_order").notNull().default(0),
  metadata: jsonb(),
}, (table) => [
  index("contact_people_contact_id_idx").on(table.contactId),
  index("contact_people_email_idx").on(table.email),
  index("contact_people_phone_idx").on(table.phone),
]);
