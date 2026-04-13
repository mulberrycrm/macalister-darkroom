import { pgTable, uuid, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./core";
import { contacts } from "./contacts";
import { messages } from "./messages";

export const campaigns = pgTable("campaigns", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text().notNull(),
  subject: text().notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  segmentFilter: jsonb("segment_filter").notNull().default({}),
  status: text({
    enum: ["draft", "scheduled", "sending", "sent", "cancelled"],
  }).notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentCount: integer("sent_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("campaigns_tenant_id_idx").on(table.tenantId),
  index("campaigns_status_idx").on(table.status),
]);

export const campaignSends = pgTable("campaign_sends", {
  id: uuid().defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  status: text({
    enum: ["queued", "sent", "failed", "opened", "clicked", "bounced", "unsubscribed"],
  }).notNull().default("queued"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
}, (table) => [
  index("campaign_sends_campaign_id_idx").on(table.campaignId),
  index("campaign_sends_contact_id_idx").on(table.contactId),
  index("campaign_sends_status_idx").on(table.status),
  unique("campaign_sends_campaign_contact_unique").on(table.campaignId, table.contactId),
]);
