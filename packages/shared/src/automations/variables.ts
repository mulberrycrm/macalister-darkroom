/**
 * Template variable interpolation engine
 * Replaces {variableName} placeholders with actual values
 */

import type { AutomationsRenderResult, AutomationsVariableContext } from "../types";

/**
 * Interpolate a template string with variables
 * Replaces {variableName} with values from context
 * Handles missing variables gracefully
 *
 * @param template - Template string (e.g., "Hi {contactName}, your order is...")
 * @param context - Object mapping variable names to values
 * @returns Interpolated string with {variableName} replaced by values
 */
export function interpolateTemplate(template: string, context: AutomationsVariableContext): string {
  if (!template) return "";

  // Pattern to match {variableName} - allows alphanumeric, underscore, camelCase
  const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

  return template.replace(variablePattern, (match, variableName) => {
    const value = context[variableName];

    // Handle different types of values
    if (value === null || value === undefined) {
      return ""; // Missing variables become empty strings
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    // Fallback for objects/arrays
    return JSON.stringify(value);
  });
}

/**
 * Find all variables referenced in a template
 * Returns both defined variables and missing ones
 *
 * @param template - Template string
 * @returns Array of variable names referenced in template
 */
export function extractVariablesFromTemplate(template: string): string[] {
  if (!template) return [];

  const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

/**
 * Validate that all variables in a template have corresponding values
 * Returns missing variables and warnings
 *
 * @param template - Template string
 * @param context - Variable context
 * @returns Object with missing variables and warnings
 */
export function validateVariablesInTemplate(
  template: string,
  context: AutomationsVariableContext
): { missing: string[]; warnings: string[] } {
  const referencedVariables = extractVariablesFromTemplate(template);
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check for missing variables
  for (const variableName of referencedVariables) {
    const value = context[variableName];
    if (value === null || value === undefined) {
      missing.push(variableName);
      warnings.push(`Missing variable: {${variableName}}`);
    }
  }

  return { missing, warnings };
}

/**
 * Render a template subject and body with variables
 * Returns interpolated text and validation warnings
 *
 * @param subject - Email subject (or null for SMS)
 * @param body - Email/SMS body
 * @param context - Variable values
 * @returns Rendered subject/body and metadata
 */
export function renderTemplate(
  subject: string | null,
  body: string,
  context: AutomationsVariableContext
): AutomationsRenderResult {
  const warnings: string[] = [];
  const allMissing: string[] = [];

  // Validate subject if present
  let renderedSubject: string | null = null;
  if (subject) {
    const subjectValidation = validateVariablesInTemplate(subject, context);
    renderedSubject = interpolateTemplate(subject, context);
    warnings.push(...subjectValidation.warnings);
    allMissing.push(...subjectValidation.missing);
  }

  // Validate body
  const bodyValidation = validateVariablesInTemplate(body, context);
  const renderedBody = interpolateTemplate(body, context);
  warnings.push(...bodyValidation.warnings);
  allMissing.push(...bodyValidation.missing);

  return {
    subject: renderedSubject,
    body: renderedBody,
    missingVariables: Array.from(new Set(allMissing)),
    warnings,
  };
}

/**
 * Check if a template can be safely rendered with the given context
 * Returns true if all variables are available
 *
 * @param template - Template string
 * @param context - Variable context
 * @returns true if all variables are available
 */
export function canRenderTemplate(template: string, context: AutomationsVariableContext): boolean {
  const { missing } = validateVariablesInTemplate(template, context);
  return missing.length === 0;
}
