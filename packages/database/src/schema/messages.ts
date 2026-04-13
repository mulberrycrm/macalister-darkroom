import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";

export const messages = pgTable("messages", {
  id: uuid().defaultRandom().primaryKey(),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  direction: text({ enum: ["inbound", "outbound"] }).notNull(),
  channel: text({ enum: ["sms", "email", "instagram", "phone", "webchat", "facebook", "system"] }).notNull(),
  body: text(),
  bodyHtml: text("body_html"),
  subject: text(),
  deliveryStatus: text("delivery_status", {
    enum: [
      "queued", "processing", "sent", "delivered", "opened", "clicked",
      "bounced", "spam", "rejected", "unsubscribed", "resubscribed", "failed",
    ],
  }).notNull().default("queued"),
  externalId: text("external_id"),
  threadId: text("thread_id"),
  messageIdHeader: text("message_id_header"),
  isRead: boolean("is_read").notNull().default(false),
  senderId: text("sender_id"),
  senderName: text("sender_name"),
  source: text("source"),
  errorText: text("error_text"),
  cc: text("cc"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  inReplyTo: text("in_reply_to"),
  referencesHeader: text("references_header"),
  fullBody: text("full_body"),
  fullHtmlBody: text("full_html_body"),
  callMetadata: jsonb("call_metadata"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("messages_contact_id_idx").on(table.contactId),
  index("messages_contact_id_created_at_idx").on(table.contactId, table.createdAt),
  index("messages_thread_id_idx").on(table.threadId),
  index("messages_external_id_idx").on(table.externalId),
  index("messages_message_id_header_idx").on(table.messageIdHeader),
  index("messages_is_read_idx").on(table.contactId, table.isRead),
]);
