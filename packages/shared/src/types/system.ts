export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type QueueJobType =
  | "send_sms"
  | "send_email"
  | "send_push_notification"
  | "charge_instalment"
  | "run_automation_step";

export type NotificationType =
  | "payment_received"
  | "payment_failed"
  | "new_lead"
  | "new_message"
  | "follow_up_reminder"
  | "delivery_failure"
  | "system_alert";

export interface JobQueue {
  id: string;
  type: QueueJobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  lockedUntil: Date | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  contactId: string | null;
  orderId: string | null;
  subtype: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface SystemHealth {
  key: string;
  value: string;
  updatedAt: Date;
}

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  tenantId: string;
  userId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
}

export type PromiseCategory = "callback" | "delivery" | "pricing" | "timeline" | "meeting" | "other";
export type PromiseStatus = "tracked" | "resolved" | "dismissed";

export interface ClientPromise {
  id: string;
  tenantId: string;
  contactId: string;
  projectId: string | null;
  messageId: string;
  promiseText: string;
  category: PromiseCategory;
  confidence: number;
  status: PromiseStatus;
  resolvedAt: Date | null;
  createdAt: Date;
}

export type AutomationTriggerType = "stage_change" | "tag_applied";

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  steps: Record<string, unknown>[];
  isActive: boolean;
  createdAt: Date;
}

export interface ContractTemplate {
  id: string;
  tenantId: string;
  name: string;
  body: string;
  createdAt: Date;
}

export type BookingLinkStatus = "pending" | "viewed" | "contract_signed" | "payment_completed" | "expired" | "cancelled";

export interface BookingLink {
  id: string;
  tenantId: string;
  contactId: string | null;
  projectId: string | null;
  token: string;
  status: BookingLinkStatus;
  packageDetails: Record<string, unknown> | null;
  paymentPlan: Record<string, unknown> | null;
  contractSignedAt: Date | null;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
  expiresAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  tenantId: string;
  contactId: string | null;
  orderId: string | null;
  invoiceNumber: string;
  invoiceName: string | null;
  status: InvoiceStatus;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  dueDate: Date | null;
  issueDate: Date | null;
  lineItems: Record<string, unknown>[];
  createdAt: Date;
}

export interface FormSubmission {
  id: string;
  tenantId: string;
  contactId: string | null;
  formId: string | null;
  formName: string | null;
  campaign: string | null;
  source: string | null;
  answers: Record<string, unknown>;
  submittedAt: Date;
}

export type EditorJobType = "initial_edit" | "final_retouch" | "sneak_peek_selection" | "sneak_peek_edit" | "culling" | "full_edit";
export type EditorJobStatus = "pending" | "sent" | "received" | "processing" | "completed";

export interface EditorJob {
  id: string;
  tenantId: string;
  projectId: string | null;
  contactId: string | null;
  contactName: string | null;
  jobType: EditorJobType;
  genre: string | null;
  status: EditorJobStatus;
  assignedTo: string | null;
  claimedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  minutesWorked: number | null;
  hourlyRateCents: number | null;
  sentFolder: string | null;
  receivedFolder: string | null;
  imageCount: number | null;
  zipSizeBytes: number | null;
  notes: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
}

export interface EditorTimeEntry {
  id: string;
  tenantId: string;
  userId: string;
  startedAt: Date;
  stoppedAt: Date | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
}

export interface EditorTimeEntryJob {
  id: string;
  timeEntryId: string;
  editorJobId: string;
  allocatedMinutes: number | null;
}

export type ReportStatus = "draft" | "published" | "archived";

export interface Report {
  id: string;
  tenantId: string;
  title: string;
  category: string | null;
  content: string | null;
  summary: string | null;
  status: ReportStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  tenantId: string;
  description: string;
  priority: TaskPriority;
  source: string | null;
  status: TaskStatus;
  tags: string[];
  verificationNote: string | null;
  verifiedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: Record<string, unknown>;
  expirationTime: Date | null;
  createdAt: Date;
}

export interface Config {
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
}
