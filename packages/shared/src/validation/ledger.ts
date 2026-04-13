import { z } from "zod";

/**
 * Validation schemas for the double-entry accounting system
 */

// Reconcile a bank transaction (match to invoice, categorise as expense, transfer, or exclude)
export const reconcileTransactionSchema = z.object({
  bankTransactionId: z.string().uuid("Invalid transaction ID"),
  action: z.enum(["match_invoice", "categorise", "transfer", "exclude"]),
  invoiceId: z.string().uuid("Invalid invoice ID").optional(),
  accountId: z.string().uuid("Invalid account ID").optional(),
  gstApplicable: z.boolean().default(true),
  businessUsePercent: z.number().int().min(0).max(100).default(100),
  notes: z.string().max(1000).optional(),
  createRule: z.boolean().default(false),
}).strict().refine(
  (data) => {
    if (data.action === "match_invoice") return !!data.invoiceId;
    if (data.action === "categorise" || data.action === "transfer") return !!data.accountId;
    return true; // exclude doesn't need extra fields
  },
  "invoiceId required for match_invoice; accountId required for categorise/transfer"
);

// Create or update a bank rule
export const bankRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  matchField: z.enum(["description", "particulars", "reference", "amount"]),
  matchType: z.enum(["contains", "equals", "starts_with"]),
  matchValue: z.string().min(1, "Match value is required").max(200),
  accountId: z.string().uuid("Invalid account ID"),
  gstApplicable: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
}).strict();

// Query account balances / trial balance
export const accountBalanceQuerySchema = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  accountType: z.enum(["asset", "liability", "equity", "revenue", "expense", "tax"]).optional(),
}).strict();

// Query a GST return period
export const gstReturnQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
}).strict();

// Save/file a GST return
export const gstReturnSaveSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
  status: z.enum(["draft", "review", "filed"]).default("draft"),
  adjustments_cents: z.number().int().default(0),
  credit_adjustments_cents: z.number().int().default(0),
  zero_rated_sales_cents: z.number().int().default(0),
  notes: z.string().max(2000).optional(),
}).strict();

// Query GST return history
export const gstReturnHistorySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(24),
  status: z.enum(["draft", "review", "filed", "amended"]).optional().nullable(),
}).strict();

// Create a new chart of accounts entry
export const createAccountSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense", "tax"]),
  subType: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  gstApplicable: z.boolean().default(true),
}).strict();

// Update a chart of accounts entry
export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  gstApplicable: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

// Report date range query
export const reportDateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
}).strict();

// Query unreconciled transactions
export const queryUnreconciledSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  accountType: z.enum(["personal", "business"]).optional().nullable(),
}).strict();

// Create an expense claim
export const createExpenseClaimSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  description: z.string().min(1).max(500),
  amountCents: z.number().int().positive("Amount must be positive"),
  accountId: z.string().uuid("Invalid account ID"),
  gstInclusive: z.boolean().default(true),
  receiptUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
}).strict();

// Update expense claim status
export const updateExpenseClaimSchema = z.object({
  status: z.enum(["approved", "reimbursed"]),
}).strict();

// Query expense claims
export const queryExpenseClaimsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["pending", "approved", "reimbursed"]).optional(),
}).strict();

export type ReconcileTransactionInput = z.infer<typeof reconcileTransactionSchema>;
export type BankRuleInput = z.infer<typeof bankRuleSchema>;
export type AccountBalanceQuery = z.infer<typeof accountBalanceQuerySchema>;
export type GstReturnQuery = z.infer<typeof gstReturnQuerySchema>;
export type GstReturnSaveInput = z.infer<typeof gstReturnSaveSchema>;
export type GstReturnHistoryQuery = z.infer<typeof gstReturnHistorySchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ReportDateRange = z.infer<typeof reportDateRangeSchema>;
export type QueryUnreconciledInput = z.infer<typeof queryUnreconciledSchema>;
export type CreateExpenseClaimInput = z.infer<typeof createExpenseClaimSchema>;
export type UpdateExpenseClaimInput = z.infer<typeof updateExpenseClaimSchema>;
export type QueryExpenseClaimsInput = z.infer<typeof queryExpenseClaimsSchema>;
