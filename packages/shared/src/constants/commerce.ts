export const PRODUCT_TYPES = [
  "print",
  "digital",
  "album",
  "wall_art",
  "package",
  "service",
  "single",
  "other",
] as const;

export const ORDER_STATUSES = [
  "draft",
  "pending",
  "partially_paid",
  "paid",
  "cancelled",
  "refunded",
] as const;

export const FULFILMENT_STAGES = [
  "not_started",
  "retouching",
  "client_review",
  "revisions",
  "approved",
  "lab_ordered",
  "in_production",
  "shipped",
  "delivered",
] as const;

export const PAYMENT_PLAN_TEMPLATES = [
  "portrait_50_50",
  "portrait_quarterly",
  "wedding_standard",
  "custom",
] as const;

export const PAYMENT_PLAN_STATUSES = [
  "active",
  "completed",
  "cancelled",
  "paused",
] as const;

export const INSTALMENT_STATUSES = [
  "scheduled",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "skipped",
] as const;
