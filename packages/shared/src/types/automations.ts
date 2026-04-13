/**
 * Automations system types
 * Email/SMS templates, variables, and execution tracking
 */

export type AutomationsCategory = "order" | "payment" | "gallery" | "account" | "admin" | "marketing";
export type AutomationsChannel = "email" | "sms";
export type AutomationsRenderType = "plain_text" | "html";
export type AutomationsStatus = "queued" | "sent" | "delivered" | "failed";
export type AutomationsTriggerEventType =
  | "order.created"
  | "order.updated"
  | "payment.due_in_3d"
  | "payment.due_in_1d"
  | "payment.due_today"
  | "payment.received"
  | "gallery.published"
  | "gallery.reminder"
  | "shoot.reminder_24h"
  | "shoot.reminder_3h";

/**
 * Variable definition in a template
 */
export interface AutomationsVariable {
  name: string; // e.g., "contactName"
  description: string; // e.g., "Full name of the contact"
  example: string; // e.g., "Sarah Smith"
}

/**
 * Template object (database row)
 */
export interface AutomationsTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string; // e.g., "order-confirmation-email"
  category: AutomationsCategory;
  channel: AutomationsChannel;
  subject: string | null; // NULL for SMS
  body: string;
  renderType: AutomationsRenderType;
  variables: AutomationsVariable[];
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  quietHoursRespect: boolean;
  scheduleAtTime: string | null; // e.g., "09:00"
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Template version (audit trail)
 */
export interface AutomationsTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  subject: string | null;
  body: string;
  variables: AutomationsVariable[];
  changedBy: string | null;
  changedAt: Date;
  changeNotes: string | null;
}

/**
 * Trigger definition (Phase 2+)
 */
export interface AutomationsTrigger {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  eventType: AutomationsTriggerEventType;
  templateId: string;
  conditions: Record<string, unknown> | null; // JSON conditions
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution log entry (audit trail of sent messages)
 */
export interface AutomationsExecutionLog {
  id: string;
  tenantId: string;
  templateId: string;
  triggerId: string | null;
  contactId: string;
  messageId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  channel: AutomationsChannel;
  status: AutomationsStatus;
  errorMessage: string | null;
  triggeredAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

/**
 * Variable context for rendering a template
 * Maps variable names to their values
 */
export type AutomationsVariableContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Template interpolation result
 */
export interface AutomationsRenderResult {
  subject: string | null;
  body: string;
  missingVariables: string[]; // Variables referenced in template but not provided
  warnings: string[];
}

/**
 * Request to enqueue an automation
 */
export interface EnqueueAutomationRequest {
  templateSlug: string;
  contactId: string;
  channel: AutomationsChannel;
  context: AutomationsVariableContext;
  sendAt?: Date;
  triggerId?: string;
  messageId?: string;
}
