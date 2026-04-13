/**
 * Automations service layer
 * Handles template loading, rendering, validation, and execution logging
 */

import type {
  AutomationsTemplate,
  AutomationsVariable,
  AutomationsVariableContext,
  AutomationsRenderResult,
  AutomationsExecutionLog,
} from "../types";
import { renderTemplate, validateVariablesInTemplate } from "./variables";

/**
 * Service for working with automations templates
 * Note: This is the shared service - database access happens via REST API
 */
export class AutomationsService {
  private baseUrl: string;
  private tenantId: string;

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
  }

  /**
   * Load a template by slug
   * @param slug - Template slug (e.g., "order-confirmation-email")
   * @returns Template object or null if not found
   */
  async loadTemplate(slug: string): Promise<AutomationsTemplate | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/automations/templates/${slug}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      return (await response.json()) as AutomationsTemplate;
    } catch (error) {
      console.error(`Error loading template "${slug}":`, error);
      throw error;
    }
  }

  /**
   * Load multiple templates by slugs
   * @param slugs - Array of template slugs
   * @returns Array of template objects (missing templates excluded)
   */
  async loadTemplates(slugs: string[]): Promise<AutomationsTemplate[]> {
    const templates: AutomationsTemplate[] = [];
    for (const slug of slugs) {
      const template = await this.loadTemplate(slug);
      if (template) {
        templates.push(template);
      }
    }
    return templates;
  }

  /**
   * Render a template with variables
   * @param template - Template object
   * @param variables - Variable context mapping names to values
   * @returns Rendered template with subject, body, and validation info
   */
  renderTemplate(template: AutomationsTemplate, variables: AutomationsVariableContext): AutomationsRenderResult {
    return renderTemplate(template.subject, template.body, variables);
  }

  /**
   * Validate that a template can be rendered with the given variables
   * @param template - Template object
   * @param variables - Variable context
   * @returns Validation result with missing variables and warnings
   */
  validateVariables(
    template: AutomationsTemplate,
    variables: AutomationsVariableContext
  ): { valid: boolean; missing: string[]; warnings: string[] } {
    const subjectValidation = template.subject
      ? validateVariablesInTemplate(template.subject, variables)
      : { missing: [], warnings: [] };

    const bodyValidation = validateVariablesInTemplate(template.body, variables);

    const allMissing = Array.from(
      new Set([...subjectValidation.missing, ...bodyValidation.missing])
    );
    const allWarnings = Array.from(
      new Set([...subjectValidation.warnings, ...bodyValidation.warnings])
    );

    return {
      valid: allMissing.length === 0,
      missing: allMissing,
      warnings: allWarnings,
    };
  }

  /**
   * Create an execution log entry for a sent message
   * @param data - Log data including template ID, contact, status, etc.
   * @returns Created log entry
   */
  async createExecutionLog(data: {
    templateId: string;
    triggerId?: string;
    contactId: string;
    messageId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    channel: "email" | "sms";
    status: "queued" | "sent" | "delivered" | "failed";
    errorMessage?: string;
    sentAt?: Date;
    deliveredAt?: Date;
  }): Promise<AutomationsExecutionLog> {
    try {
      const response = await fetch(`${this.baseUrl}/api/automations/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create execution log: ${response.statusText}`);
      }

      return (await response.json()) as AutomationsExecutionLog;
    } catch (error) {
      console.error("Error creating execution log:", error);
      throw error;
    }
  }

  /**
   * Get execution logs for a template
   * @param templateId - Template ID
   * @param limit - Maximum number of logs to return (default: 100)
   * @returns Array of execution log entries
   */
  async getExecutionLogs(templateId: string, limit: number = 100): Promise<AutomationsExecutionLog[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/automations/logs?templateId=${templateId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get execution logs: ${response.statusText}`);
      }

      return (await response.json()) as AutomationsExecutionLog[];
    } catch (error) {
      console.error("Error getting execution logs:", error);
      throw error;
    }
  }

  /**
   * Get available variables for a template category
   * Returns the predefined set of variables that can be used in templates
   * @param category - Template category (e.g., "order", "payment")
   * @returns Array of available variables for this category
   */
  getAvailableVariables(category: string): AutomationsVariable[] {
    // These are the standard variables available for interpolation
    // Organized by category for easier UI reference
    const allVariables: Record<string, AutomationsVariable[]> = {
      contact: [
        {
          name: "contactName",
          description: "Full name of the contact",
          example: "Sarah Smith",
        },
        {
          name: "contactFirstName",
          description: "First name only",
          example: "Sarah",
        },
        {
          name: "contactEmail",
          description: "Email address",
          example: "sarah@example.com",
        },
        {
          name: "contactPhone",
          description: "Phone number",
          example: "+64 (2) 1234 5678",
        },
      ],
      order: [
        {
          name: "orderNumber",
          description: "Customer-facing order reference",
          example: "ORD-2026-001",
        },
        {
          name: "orderDate",
          description: "Order creation date",
          example: "Mar 15, 2026",
        },
        {
          name: "orderItems",
          description: "Formatted list of order items",
          example: "- Canvas Print (20x30cm)\n- Digital Download (High Res)",
        },
        {
          name: "orderSubtotal",
          description: "Subtotal before GST",
          example: "$869.57",
        },
        {
          name: "orderGST",
          description: "GST amount (15%)",
          example: "$130.43",
        },
        {
          name: "orderTotal",
          description: "Total amount including GST",
          example: "$1000.00",
        },
        {
          name: "orderStatus",
          description: "Current order status",
          example: "Pending",
        },
      ],
      payment: [
        {
          name: "paymentAmount",
          description: "Amount due or paid",
          example: "$500.00",
        },
        {
          name: "paymentDueDate",
          description: "Payment due date",
          example: "Mar 25, 2026",
        },
        {
          name: "paymentDaysUntilDue",
          description: "Human-readable days until due",
          example: "In 3 days",
        },
        {
          name: "paymentLink",
          description: "Secure payment link",
          example: "https://pay.example.com/inv/abc123",
        },
        {
          name: "paymentStatus",
          description: "Payment status",
          example: "Pending",
        },
        {
          name: "remainingBalance",
          description: "Amount still owed",
          example: "$500.00",
        },
      ],
      gallery: [
        {
          name: "galleryTitle",
          description: "Gallery name",
          example: "Sarah & John's Wedding",
        },
        {
          name: "galleryLink",
          description: "Link to client gallery",
          example: "https://galleries.example.com/sarah-john-wedding",
        },
        {
          name: "galleryPassword",
          description: "Gallery access password (if protected)",
          example: "wedding123",
        },
        {
          name: "photoCount",
          description: "Number of photos",
          example: "142",
        },
        {
          name: "galleryExpiresAt",
          description: "Gallery expiration date",
          example: "Apr 30, 2026",
        },
      ],
      shoot: [
        {
          name: "shootDate",
          description: "Event date and time",
          example: "Saturday, Mar 15 at 2:00 PM",
        },
        {
          name: "shootLocation",
          description: "Venue name or address",
          example: "Government Gardens, Rotorua",
        },
        {
          name: "shootType",
          description: "Type of shoot",
          example: "Wedding",
        },
        {
          name: "shootNotes",
          description: "Special instructions or notes",
          example: "Ceremony starts at 2pm, we'll arrive at 1:30pm",
        },
      ],
      system: [
        {
          name: "businessName",
          description: "Business name",
          example: "Macalister Photography",
        },
        {
          name: "businessEmail",
          description: "Business email address",
          example: "hello@macalister.nz",
        },
        {
          name: "businessPhone",
          description: "Business phone number",
          example: "+64 (2) 1234 5678",
        },
        {
          name: "businessWebsite",
          description: "Business website URL",
          example: "macalister.nz",
        },
        {
          name: "signatureBlock",
          description: "Email signature block (configurable)",
          example: "Macalister Photography\nWellington, New Zealand",
        },
      ],
    };

    // Return all variables for this category, or all if category not found
    return allVariables[category] ? allVariables[category] : Object.values(allVariables).flat();
  }
}
