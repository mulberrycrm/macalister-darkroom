import { z } from "zod";

/**
 * Validation schemas for Akahu endpoints
 */

export const syncTransactionsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export const createTransactionMatchSchema = z.object({
  bankTransactionId: z.string().uuid("Invalid transaction ID"),
  invoiceId: z.string().uuid("Invalid invoice ID").optional(),
  orderId: z.string().uuid("Invalid order ID").optional(),
  matchedAmount: z.number().int().positive("Amount must be positive").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
}).refine(
  (data) => data.invoiceId || data.orderId,
  "Either invoiceId or orderId must be provided"
).strict();

export const queryTransactionsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
}).strict();

export type SyncTransactionsInput = z.infer<typeof syncTransactionsSchema>;
export type CreateTransactionMatchInput = z.infer<typeof createTransactionMatchSchema>;
export type QueryTransactionsInput = z.infer<typeof queryTransactionsSchema>;
