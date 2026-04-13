import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, real, varchar } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { contacts } from "./contacts";
import { messages } from "./messages";
import { projects } from "./projects";
import { orders } from "./commerce";

export const jobQueue = pgTable("job_queue", {
  id: uuid().defaultRandom().primaryKey(),
  type: text({
    enum: ["send_sms", "send_email", "send_push_notification", "charge_instalment", "run_automation_step"],
  }).notNull(),
  payload: jsonb().notNull().default({}),
  status: text({
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
  }).notNull().default("pending"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).defaultNow().notNull(),
  attempts: integer().notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("job_queue_status_scheduled_idx").on(table.status, table.scheduledFor),
  index("job_queue_locked_until_idx").on(table.lockedUntil),
]);

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text({
    enum: ["payment_received", "payment_failed", "new_lead", "new_message", "follow_up_reminder", "delivery_failure", "system_alert", "editing_job_available"],
  }).notNull(),
  title: text().notNull(),
  message: text().notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  orderId: uuid("order_id"),
  subtype: text("subtype"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("notifications_user_id_is_read_idx").on(table.userId, table.isRead),
  index("notifications_tenant_id_idx").on(table.tenantId),
  index("notifications_contact_id_idx").on(table.contactId),
]);

export const systemHealth = pgTable("system_health", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text({ enum: ["user", "assistant"] }).notNull(),
  content: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("chat_messages_user_id_created_at_idx").on(table.userId, table.createdAt),
  index("chat_messages_tenant_id_idx").on(table.tenantId),
]);

export const clientPromises = pgTable("client_promises", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  projectId: uuid("project_id").references(() => projects.id),
  messageId: uuid("message_id").notNull().references(() => messages.id),
  promiseText: text("promise_text").notNull(),
  category: text({ enum: ["callback", "delivery", "pricing", "timeline", "meeting", "other"] }).notNull().default("other"),
  confidence: real().notNull(),
  status: text({ enum: ["tracked", "resolved", "dismissed"] }).notNull().default("tracked"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("client_promises_tenant_id_status_idx").on(table.tenantId, table.status),
  index("client_promises_contact_id_idx").on(table.contactId),
  index("client_promises_message_id_idx").on(table.messageId),
]);

export const automationsTemplates = pgTable("automations_templates", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

  // Identification
  name: text().notNull(),
  slug: varchar({ length: 255 }).notNull(),
  category: text({ enum: ["order", "payment", "gallery", "account", "admin", "marketing"] }).notNull(),
  channel: text({ enum: ["email", "sms"] }).notNull(),

  // Template content
  subject: varchar({ length: 255 }),
  body: text().notNull(),
  renderType: text("render_type", { enum: ["plain_text", "html"] }).notNull().default("plain_text"),
  variables: jsonb().notNull().default([]),

  // Metadata
  description: text(),
  isActive: boolean("is_active").notNull().default(true),
  isSystem: boolean("is_system").notNull().default(false),
  version: integer().notNull().default(1),

  // Delivery configuration
  quietHoursRespect: boolean("quiet_hours_respect").notNull().default(true),
  scheduleAtTime: varchar("schedule_at_time", { length: 5 }),

  // Tracking
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("automations_templates_tenant_id_idx").on(table.tenantId),
  index("automations_templates_slug_idx").on(table.slug),
  index("automations_templates_category_idx").on(table.category),
  index("automations_templates_channel_idx").on(table.channel),
]);

export const automationsTemplateVersions = pgTable("automations_template_versions", {
  id: uuid().defaultRandom().primaryKey(),
  templateId: uuid("template_id").notNull().references(() => automationsTemplates.id, { onDelete: "cascade" }),

  version: integer().notNull(),
  subject: varchar({ length: 255 }),
  body: text().notNull(),
  variables: jsonb().notNull().default([]),

  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  changeNotes: text("change_notes"),
}, (table) => [
  index("automations_template_versions_template_id_idx").on(table.templateId),
]);

export const automationsExecutionLog = pgTable("automations_execution_log", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

  // What was triggered
  templateId: uuid("template_id").references(() => automationsTemplates.id),
  triggerId: uuid("trigger_id").references(() => automations.id),

  // Who/what it was sent to
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  messageId: uuid("message_id").references(() => messages.id),

  // Execution details
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  channel: text({ enum: ["email", "sms"] }).notNull(),

  // Status
  status: text({ enum: ["queued", "sent", "delivered", "failed"] }).notNull(),
  errorMessage: text("error_message"),

  // Tracking
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("automations_execution_log_tenant_id_idx").on(table.tenantId),
  index("automations_execution_log_template_id_idx").on(table.templateId),
  index("automations_execution_log_contact_id_idx").on(table.contactId),
  index("automations_execution_log_status_idx").on(table.status),
]);

export const automations = pgTable("automations", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text().notNull(),
  triggerType: text("trigger_type", { enum: ["stage_change", "tag_applied"] }).notNull(),
  triggerConfig: jsonb("trigger_config").notNull().default({}),
  steps: jsonb().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("automations_tenant_id_idx").on(table.tenantId),
]);

export const contractTemplates = pgTable("contract_templates", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("contract_templates_tenant_id_idx").on(table.tenantId),
]);

export const bookingLinks = pgTable("booking_links", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  projectId: uuid("project_id").references(() => projects.id),
  token: text().notNull().unique(),
  status: text({ enum: ["pending", "viewed", "contract_signed", "payment_completed", "expired", "cancelled"] }).notNull().default("pending"),
  packageDetails: jsonb("package_details"),
  paymentPlan: jsonb("payment_plan"),
  contractSignedAt: timestamp("contract_signed_at", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("booking_links_tenant_id_idx").on(table.tenantId),
  index("booking_links_token_idx").on(table.token),
  index("booking_links_contact_id_idx").on(table.contactId),
]);

export const invoices = pgTable("invoices", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  orderId: uuid("order_id").references(() => orders.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceName: text("invoice_name"),
  status: text({ enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).notNull().default("draft"),
  subtotalCents: integer("subtotal_cents").notNull(),
  gstCents: integer("gst_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  issueDate: timestamp("issue_date", { withTimezone: true, mode: "date" }),
  lineItems: jsonb("line_items").notNull().default([]),
  urlHash: text("url_hash").notNull().unique(), // 64-char hex for secure public access (/pay/[hash])
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("invoices_tenant_id_idx").on(table.tenantId),
  index("invoices_contact_id_idx").on(table.contactId),
  index("invoices_order_id_idx").on(table.orderId),
  index("invoices_url_hash_idx").on(table.urlHash),
]);

export const formSubmissions = pgTable("form_submissions", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  formId: text("form_id"),
  formName: text("form_name"),
  campaign: text(),
  source: text(),
  answers: jsonb().notNull().default({}),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("form_submissions_tenant_id_idx").on(table.tenantId),
  index("form_submissions_contact_id_idx").on(table.contactId),
]);

export const editorJobs = pgTable("editor_jobs", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  projectId: uuid("project_id").references(() => projects.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  contactName: text("contact_name"),
  jobType: text("job_type", {
    enum: ["initial_edit", "final_retouch", "sneak_peek_selection", "sneak_peek_edit", "culling", "full_edit"],
  }).notNull().default("initial_edit"),
  genre: text(),
  status: text({ enum: ["pending", "sent", "received", "processing", "completed"] }).notNull().default("pending"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  minutesWorked: integer("minutes_worked"),
  hourlyRateCents: integer("hourly_rate_cents"),
  sentFolder: text("sent_folder"),
  receivedFolder: text("received_folder"),
  imageCount: integer("image_count"),
  zipSizeBytes: integer("zip_size_bytes"),
  notes: text(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("editor_jobs_tenant_id_idx").on(table.tenantId),
  index("editor_jobs_project_id_idx").on(table.projectId),
  index("editor_jobs_assigned_to_idx").on(table.assignedTo),
  index("editor_jobs_status_idx").on(table.status),
  index("editor_jobs_job_type_idx").on(table.jobType),
]);

export const editorTimeEntries = pgTable("editor_time_entries", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  notes: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("editor_time_entries_tenant_id_idx").on(table.tenantId),
  index("editor_time_entries_user_id_idx").on(table.userId),
]);

export const editorTimeEntryJobs = pgTable("editor_time_entry_jobs", {
  id: uuid().defaultRandom().primaryKey(),
  timeEntryId: uuid("time_entry_id").notNull().references(() => editorTimeEntries.id, { onDelete: "cascade" }),
  editorJobId: uuid("editor_job_id").notNull().references(() => editorJobs.id, { onDelete: "cascade" }),
  allocatedMinutes: integer("allocated_minutes"),
}, (table) => [
  index("editor_time_entry_jobs_time_entry_idx").on(table.timeEntryId),
  index("editor_time_entry_jobs_job_idx").on(table.editorJobId),
]);

export const reports = pgTable("reports", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  title: text().notNull(),
  category: text({
    enum: ["report", "knowledge_base", "analysis", "audit", "performance", "financial", "summary_report", "research", "sop"],
  }).notNull().default("report"),
  content: text(),
  summary: text(),
  status: text({ enum: ["draft", "published", "archived"] }).notNull().default("draft"),

  // Report generation configuration
  dataSources: jsonb("data_sources").notNull().default([]), // ["contacts", "projects", "orders", "payments", "automations"]
  filters: jsonb().notNull().default({}), // {dateRange: {from, to}, contactType: [...], projectStatus: [...], etc}
  exportFormats: text("export_formats").array().notNull().default([]), // ["pdf", "csv"]

  // Scheduling
  isScheduled: boolean("is_scheduled").notNull().default(false),
  scheduleFrequency: text("schedule_frequency", { enum: ["one_time", "daily", "weekly", "monthly"] }),
  scheduleDay: text("schedule_day"), // For weekly/monthly: "monday", "1st"
  scheduleTime: varchar("schedule_time", { length: 5 }), // HH:MM format
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  emailDelivery: text("email_delivery").array().notNull().default([]), // email addresses for scheduled delivery

  // Metadata
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("reports_tenant_id_idx").on(table.tenantId),
  index("reports_category_idx").on(table.category),
  index("reports_status_idx").on(table.status),
  index("reports_next_run_at_idx").on(table.nextRunAt),
]);

export const tasks = pgTable("tasks", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  title: text().notNull(),
  description: text(),
  priority: text({ enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  status: text({ enum: ["open", "in_progress", "done", "cancelled"] }).notNull().default("open"),
  tags: text().array().notNull().default([]),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  source: text(),
  verificationNote: text("verification_note"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("tasks_tenant_id_idx").on(table.tenantId),
  index("tasks_status_idx").on(table.status),
  index("tasks_assigned_to_idx").on(table.assignedTo),
  index("tasks_contact_id_idx").on(table.contactId),
  index("tasks_project_id_idx").on(table.projectId),
  index("tasks_due_date_idx").on(table.dueDate),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  endpoint: text().notNull(),
  keys: jsonb().notNull(),
  expirationTime: timestamp("expiration_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("push_subscriptions_user_id_idx").on(table.userId),
]);

export const webhookEvents = pgTable("webhook_events", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: text("event_id").notNull().unique(),
  type: text({ enum: ["stripe", "smtp2go", "facebook", "sms", "custom"] }).notNull(),
  source: text().notNull(),
  payload: jsonb().notNull().default({}),
  isProcessed: boolean("is_processed").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("webhook_events_event_id_type_idx").on(table.eventId, table.type),
  index("webhook_events_is_processed_idx").on(table.isProcessed),
  index("webhook_events_received_at_idx").on(table.receivedAt),
]);

// Phase M: Mobile Device Tokens
// Stores device tokens for mobile push notifications (iOS/Android via FCM and APNs)
export const mobileDeviceTokens = pgTable("mobile_device_tokens", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text().notNull(),
  platform: text({ enum: ["ios", "android"] }).notNull(),
  appVersion: text("app_version"),
  deviceInfo: jsonb("device_info"), // { model, os_version, app_bundle_id, etc }
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => [
  index("mobile_device_tokens_user_id_idx").on(table.userId),
  index("mobile_device_tokens_tenant_id_idx").on(table.tenantId),
  index("mobile_device_tokens_platform_idx").on(table.platform),
  index("mobile_device_tokens_is_active_idx").on(table.isActive),
  index("mobile_device_tokens_last_updated_idx").on(table.lastUpdated),
]);

// Phase M: Notification Delivery History
// Tracks all push notifications sent, delivery status, and engagement
export const notificationDeliveryHistory = pgTable("notification_delivery_history", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Notification content
  type: text({ enum: ["message", "appointment", "gallery", "order", "task", "manual"] }).notNull(),
  title: text().notNull(),
  body: text().notNull(),
  data: jsonb(), // { type: "message", id: "contact-id", message_id: "...", etc }

  // Delivery tracking
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),

  // Device info
  platform: text({ enum: ["ios", "android"] }),
  deviceTokenId: uuid("device_token_id").references(() => mobileDeviceTokens.id, { onDelete: "set null" }),

  // Status & errors
  deliveryStatus: text("delivery_status", {
    enum: ["pending", "delivered", "failed", "bounced", "unregistered"],
  }).notNull().default("pending"),
  errorReason: text("error_reason"),
}, (table) => [
  index("notification_delivery_history_recipient_idx").on(table.recipientId),
  index("notification_delivery_history_tenant_idx").on(table.tenantId),
  index("notification_delivery_history_sent_at_idx").on(table.sentAt),
  index("notification_delivery_history_type_idx").on(table.type),
  index("notification_delivery_history_delivery_status_idx").on(table.deliveryStatus),
]);

export const claudeTasks = pgTable("claude_tasks", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  taskType: text("task_type", {
    enum: ["receipt_extract", "categorise_transaction", "summarise_call"],
  }).notNull(),
  status: text({
    enum: ["pending", "processing", "done", "failed", "cancelled"],
  }).notNull().default("pending"),
  priority: integer().notNull().default(0), // higher = more urgent
  inputData: jsonb("input_data").notNull().default({}),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  attempts: integer().notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("claude_tasks_status_priority_idx").on(table.status, table.priority),
  index("claude_tasks_tenant_id_idx").on(table.tenantId),
  index("claude_tasks_task_type_idx").on(table.taskType),
  index("claude_tasks_created_at_idx").on(table.createdAt),
]);

export const config = pgTable("config", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
