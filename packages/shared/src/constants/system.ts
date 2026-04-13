export const JOB_QUEUE_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export const QUEUE_JOB_TYPES = [
  "send_sms",
  "send_email",
  "send_push_notification",
  "charge_instalment",
  "run_automation_step",
] as const;

export const NOTIFICATION_TYPES = [
  "payment_received",
  "payment_failed",
  "new_lead",
  "new_message",
  "follow_up_reminder",
  "delivery_failure",
  "system_alert",
  "editing_job_available",
] as const;

export const EDITOR_JOB_TYPES = [
  "initial_edit",
  "final_retouch",
  "sneak_peek_selection",
  "sneak_peek_edit",
  "culling",
  "full_edit",
] as const;

export const EDITOR_JOB_STATUSES = [
  "pending",
  "sent",
  "received",
  "processing",
  "completed",
] as const;

/** Wedding editing pipeline in order. Completing one auto-creates the next. */
export const WEDDING_EDITING_PIPELINE = [
  "sneak_peek_selection",
  "sneak_peek_edit",
  "culling",
  "full_edit",
] as const;

/** Human-readable labels for editor job types */
export const EDITOR_JOB_TYPE_LABELS: Record<string, string> = {
  initial_edit: "Initial Edit",
  final_retouch: "Final Retouch",
  sneak_peek_selection: "Sneak Peek Selection",
  sneak_peek_edit: "Sneak Peek Edit",
  culling: "Culling",
  full_edit: "Full Edit",
};
