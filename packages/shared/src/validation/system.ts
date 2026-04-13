import { z } from "zod";
import { QUEUE_JOB_TYPES, NOTIFICATION_TYPES, EDITOR_JOB_TYPES, EDITOR_JOB_STATUSES } from "../constants/system";

export const jobQueueInsertSchema = z.object({
  type: z.enum(QUEUE_JOB_TYPES),
  payload: z.record(z.string(), z.unknown()),
  scheduledFor: z.coerce.date().optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
});

export const notificationInsertSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  contactId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  subtype: z.string().max(100).nullable().optional(),
});

export const automationInsertSchema = z.object({
  name: z.string().min(1).max(200),
  triggerType: z.enum(["stage_change", "tag_applied"]),
  triggerConfig: z.record(z.string(), z.unknown()),
  steps: z.array(z.record(z.string(), z.unknown())),
  isActive: z.boolean().optional(),
});

export const contractTemplateInsertSchema = z.object({
  name: z.string().min(1).max(200),
  body: z.string().min(1),
});

export const bookingLinkInsertSchema = z.object({
  contactId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  token: z.string().min(1).max(200),
  status: z.enum(["pending", "viewed", "contract_signed", "payment_completed", "expired", "cancelled"]).optional(),
  packageDetails: z.record(z.string(), z.unknown()).nullable().optional(),
  paymentPlan: z.record(z.string(), z.unknown()).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const invoiceInsertSchema = z.object({
  contactId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceName: z.string().max(200).nullable().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  subtotalCents: z.number().int().min(0),
  gstCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  dueDate: z.coerce.date().nullable().optional(),
  issueDate: z.coerce.date().nullable().optional(),
  lineItems: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const formSubmissionInsertSchema = z.object({
  contactId: z.string().uuid().nullable().optional(),
  formId: z.string().nullable().optional(),
  formName: z.string().max(200).nullable().optional(),
  campaign: z.string().max(200).nullable().optional(),
  source: z.string().max(200).nullable().optional(),
  answers: z.record(z.string(), z.unknown()),
  submittedAt: z.coerce.date().optional(),
});

export const editorJobInsertSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  jobType: z.enum(EDITOR_JOB_TYPES).optional(),
  genre: z.string().max(100).nullable().optional(),
  status: z.enum(EDITOR_JOB_STATUSES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  minutesWorked: z.number().int().min(0).nullable().optional(),
  hourlyRateCents: z.number().int().min(0).nullable().optional(),
  sentFolder: z.string().nullable().optional(),
  receivedFolder: z.string().nullable().optional(),
  imageCount: z.number().int().min(0).nullable().optional(),
  zipSizeBytes: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const reportInsertSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(100).nullable().optional(),
  content: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  createdBy: z.string().uuid().nullable().optional(),
});

export const taskInsertSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  source: z.string().max(200).nullable().optional(),
  verificationNote: z.string().nullable().optional(),
});

export const pushSubscriptionInsertSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.record(z.string(), z.unknown()),
  expirationTime: z.coerce.date().nullable().optional(),
});

export const automationUpdateSchema = automationInsertSchema.partial();

export const contractTemplateUpdateSchema = contractTemplateInsertSchema.partial();

export const bookingLinkUpdateSchema = bookingLinkInsertSchema.partial();

export const invoiceUpdateSchema = invoiceInsertSchema.partial();

export const formSubmissionUpdateSchema = formSubmissionInsertSchema.partial();

export const editorJobUpdateSchema = editorJobInsertSchema.partial();

export const reportUpdateSchema = reportInsertSchema.partial();

export const taskUpdateSchema = taskInsertSchema.partial();

export const configInsertSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.record(z.string(), z.unknown()),
});

export const configUpdateSchema = z.object({
  value: z.record(z.string(), z.unknown()),
});

export type JobQueueInsert = z.infer<typeof jobQueueInsertSchema>;
export type NotificationInsert = z.infer<typeof notificationInsertSchema>;
export type AutomationInsert = z.infer<typeof automationInsertSchema>;
export type AutomationUpdate = z.infer<typeof automationUpdateSchema>;
export type ContractTemplateInsert = z.infer<typeof contractTemplateInsertSchema>;
export type ContractTemplateUpdate = z.infer<typeof contractTemplateUpdateSchema>;
export type BookingLinkInsert = z.infer<typeof bookingLinkInsertSchema>;
export type BookingLinkUpdate = z.infer<typeof bookingLinkUpdateSchema>;
export type InvoiceInsert = z.infer<typeof invoiceInsertSchema>;
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>;
export type FormSubmissionInsert = z.infer<typeof formSubmissionInsertSchema>;
export type FormSubmissionUpdate = z.infer<typeof formSubmissionUpdateSchema>;
export type EditorJobInsert = z.infer<typeof editorJobInsertSchema>;
export type EditorJobUpdate = z.infer<typeof editorJobUpdateSchema>;
export type ReportInsert = z.infer<typeof reportInsertSchema>;
export type ReportUpdate = z.infer<typeof reportUpdateSchema>;
export type TaskInsert = z.infer<typeof taskInsertSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type PushSubscriptionInsert = z.infer<typeof pushSubscriptionInsertSchema>;
export type ConfigInsert = z.infer<typeof configInsertSchema>;
export type ConfigUpdate = z.infer<typeof configUpdateSchema>;
