export const MESSAGE_CHANNELS = [
  "sms",
  "email",
  "instagram",
  "phone",
  "webchat",
  "facebook",
  "system",
] as const;

export const DELIVERY_STATUSES = [
  "queued",
  "processing",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam",
  "rejected",
  "unsubscribed",
  "resubscribed",
  "failed",
] as const;
