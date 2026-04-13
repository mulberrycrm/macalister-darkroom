/**
 * Automations module exports
 * Template system for email/SMS messages with variable interpolation
 */

export { AutomationsService } from "./service";
export {
  interpolateTemplate,
  extractVariablesFromTemplate,
  validateVariablesInTemplate,
  renderTemplate,
  canRenderTemplate,
} from "./variables";

export type {
  AutomationsCategory,
  AutomationsChannel,
  AutomationsRenderType,
  AutomationsStatus,
  AutomationsTriggerEventType,
  AutomationsVariable,
  AutomationsTemplate,
  AutomationsTemplateVersion,
  AutomationsTrigger,
  AutomationsExecutionLog,
  AutomationsVariableContext,
  AutomationsRenderResult,
  EnqueueAutomationRequest,
} from "../types/automations";
