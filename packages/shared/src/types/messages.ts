export type MessageChannel =
  | "sms"
  | "email"
  | "instagram"
  | "phone"
  | "webchat"
  | "facebook"
  | "system";

export type MessageDirection = "inbound" | "outbound";

export type DeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "spam"
  | "rejected"
  | "unsubscribed"
  | "resubscribed"
  | "failed";

export interface Message {
  id: string;
  contactId: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string | null;
  bodyHtml: string | null;
  subject: string | null;
  deliveryStatus: DeliveryStatus;
  externalId: string | null;
  threadId: string | null;
  messageIdHeader: string | null;
  sentAt: Date | null;
  createdAt: Date;
  isRead: boolean;
  senderId: string | null;
  senderName: string | null;
  source: string | null;
  errorText: string | null;
  cc: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  inReplyTo: string | null;
  referencesHeader: string | null;
  fullBody: string | null;
  fullHtmlBody: string | null;
}
