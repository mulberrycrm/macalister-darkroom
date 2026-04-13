import { z } from "zod";
import { MESSAGE_CHANNELS, DELIVERY_STATUSES } from "../constants/messages";

export const messageInsertSchema = z.object({
  contactId: z.string().uuid(),
  direction: z.enum(["inbound", "outbound"]),
  channel: z.enum(MESSAGE_CHANNELS),
  body: z.string().nullable().optional(),
  bodyHtml: z.string().nullable().optional(),
  subject: z.string().max(500).nullable().optional(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
  externalId: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  messageIdHeader: z.string().nullable().optional(),
  sentAt: z.coerce.date().nullable().optional(),
  isRead: z.boolean().optional(),
  senderId: z.string().nullable().optional(),
  senderName: z.string().max(200).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  errorText: z.string().nullable().optional(),
  cc: z.string().nullable().optional(),
  fromAddress: z.string().nullable().optional(),
  toAddress: z.string().nullable().optional(),
  inReplyTo: z.string().nullable().optional(),
  referencesHeader: z.string().nullable().optional(),
  fullBody: z.string().nullable().optional(),
  fullHtmlBody: z.string().nullable().optional(),
});

export const enqueueMessageSchema = z.object({
  contactId: z.string().uuid(),
  channel: z.enum(MESSAGE_CHANNELS),
  body: z.string().min(1),
  bodyHtml: z.string().nullable().optional(),
  subject: z.string().max(500).nullable().optional(),
  threadId: z.string().nullable().optional(),
  inReplyTo: z.string().nullable().optional(),
  references: z.string().nullable().optional(),
  cc: z.array(z.string().email()).optional(),
  scheduledFor: z.coerce.date().optional(),
  overrideQuietHours: z.boolean().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const messageUpdateSchema = messageInsertSchema.partial().omit({ contactId: true });

export type MessageInsert = z.infer<typeof messageInsertSchema>;
export type MessageUpdate = z.infer<typeof messageUpdateSchema>;
export type EnqueueMessage = z.infer<typeof enqueueMessageSchema>;
