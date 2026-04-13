import { pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { bankTransactions } from "./accounting";
import { invoices } from "./system";

/**
 * Chart of Accounts — simplified for a NZ photography company.
 * Types: asset (1xxx), liability (2xxx), equity (3xxx), revenue (4xxx), expense (5xxx), tax (6xxx)
 */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    code: text().notNull(), // e.g., "1000", "5010"
    name: text().notNull(), // e.g., "Business Cheque Account"
    type: text({
      enum: ["asset", "liability", "equity", "revenue", "expense", "tax"],
    }).notNull(),
    subType: text("sub_type"), // e.g., "bank", "receivable", "payable"
    description: text(),

    isActive: boolean("is_active").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false), // system accounts can't be deleted
    gstApplicable: boolean("gst_applicable").notNull().default(true), // does this account normally have GST?
    parentId: uuid("parent_id"), // for sub-accounts if needed (self-reference)

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("accounts_tenant_code_idx").on(table.tenantId, table.code),
    index("accounts_tenant_id_idx").on(table.tenantId),
    index("accounts_tenant_type_idx").on(table.tenantId, table.type),
  ]
);

/**
 * Journal Entries — the core of double-entry accounting.
 * Every financial event creates a journal entry with balanced debit/credit lines.
 */
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    reference: text(), // e.g., "INV-0042", "BANK-2026-03-12"
    description: text().notNull(),

    sourceType: text("source_type", {
      enum: [
        "invoice_payment",
        "expense",
        "bank_reconciliation",
        "manual",
        "expense_claim",
        "transfer",
        "depreciation",
        "gst_adjustment",
      ],
    }),
    sourceId: uuid("source_id"), // polymorphic FK to originating record

    isGstCashBasis: boolean("is_gst_cash_basis").notNull().default(false),
    gstPeriod: text("gst_period"), // e.g., "2026-03" for monthly GST

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    reversedBy: uuid("reversed_by"), // FK to journal_entries.id (self-reference)
    isReversed: boolean("is_reversed").notNull().default(false),
  },
  (table) => [
    index("journal_entries_tenant_date_idx").on(table.tenantId, table.date),
    index("journal_entries_source_idx").on(table.sourceType, table.sourceId),
    index("journal_entries_gst_period_idx").on(table.tenantId, table.gstPeriod),
  ]
);

/**
 * Journal Lines — individual debit/credit entries within a journal entry.
 * Total debits must equal total credits for the parent journal entry.
 * Each line affects exactly one account.
 */
export const journalLines = pgTable(
  "journal_lines",
  {
    id: uuid().defaultRandom().primaryKey(),
    journalEntryId: uuid("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id),

    description: text(),
    debitCents: integer("debit_cents").notNull().default(0), // always >= 0
    creditCents: integer("credit_cents").notNull().default(0), // always >= 0
    gstAmountCents: integer("gst_amount_cents").notNull().default(0),
    isGstExempt: boolean("is_gst_exempt").notNull().default(false),
  },
  (table) => [
    index("journal_lines_account_idx").on(table.accountId),
    index("journal_lines_entry_idx").on(table.journalEntryId),
  ]
);

/**
 * Bank Reconciliation — links each bank transaction to a journal entry.
 * One-to-one: each bank transaction has at most one reconciliation.
 */
export const bankReconciliations = pgTable(
  "bank_reconciliations",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    bankTransactionId: uuid("bank_transaction_id").notNull().references(() => bankTransactions.id),
    journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id),

    status: text({
      enum: ["unreconciled", "matched", "reconciled", "excluded"],
    }).notNull().default("unreconciled"),

    matchedInvoiceId: uuid("matched_invoice_id").references(() => invoices.id),
    matchedAccountId: uuid("matched_account_id").references(() => accounts.id), // for expense categorisation
    matchedBy: text("matched_by", {
      enum: ["auto_invoice", "auto_rule", "auto_ai", "manual"],
    }),
    confidence: integer(), // 0-100

    businessUsePercent: integer("business_use_percent").notNull().default(100), // for mixed-use expenses
    reconciledBy: uuid("reconciled_by").references(() => users.id),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    notes: text(),
  },
  (table) => [
    uniqueIndex("bank_reconciliations_txn_idx").on(table.bankTransactionId),
    index("bank_reconciliations_tenant_status_idx").on(table.tenantId, table.status),
    index("bank_reconciliations_invoice_idx").on(table.matchedInvoiceId),
  ]
);

/**
 * Bank Rules — auto-categorisation rules for recurring transactions.
 * Matched by merchant/description during reconciliation.
 */
export const bankRules = pgTable(
  "bank_rules",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    name: text().notNull(),
    priority: integer().notNull().default(0), // higher = checked first

    matchField: text("match_field", {
      enum: ["description", "particulars", "reference", "amount"],
    }).notNull(),
    matchType: text("match_type", {
      enum: ["contains", "equals", "starts_with"],
    }).notNull(),
    matchValue: text("match_value").notNull(),

    accountId: uuid("account_id").notNull().references(() => accounts.id), // target expense/income account
    gstApplicable: boolean("gst_applicable").notNull().default(true),

    isTransfer: boolean("is_transfer").notNull().default(false),
    transferAccountId: uuid("transfer_account_id").references(() => accounts.id),

    isActive: boolean("is_active").notNull().default(true),
    timesApplied: integer("times_applied").notNull().default(0),
    lastAppliedAt: timestamp("last_applied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bank_rules_tenant_active_idx").on(table.tenantId, table.isActive),
  ]
);

/**
 * GST Returns — monthly GST101A returns (cash basis).
 * Auto-populated from reconciled transactions.
 */
export const gstReturns = pgTable(
  "gst_returns",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    period: text().notNull(), // "2026-03"
    periodStart: timestamp("period_start", { withTimezone: true, mode: "date" }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }).notNull(),
    status: text({
      enum: ["draft", "review", "filed", "amended"],
    }).notNull().default("draft"),

    // GST101A fields (all in cents)
    totalSalesCents: integer("total_sales_cents").notNull().default(0), // Box 5
    gstOnSalesCents: integer("gst_on_sales_cents").notNull().default(0), // Box 6
    zeroRatedSalesCents: integer("zero_rated_sales_cents").notNull().default(0), // Box 7
    adjustmentsCents: integer("adjustments_cents").notNull().default(0), // Box 8
    totalGstCollectedCents: integer("total_gst_collected_cents").notNull().default(0), // Box 9
    totalPurchasesCents: integer("total_purchases_cents").notNull().default(0), // Box 11
    gstOnPurchasesCents: integer("gst_on_purchases_cents").notNull().default(0), // Box 12
    creditAdjustmentsCents: integer("credit_adjustments_cents").notNull().default(0), // Box 13
    totalGstCreditsCents: integer("total_gst_credits_cents").notNull().default(0), // Box 14
    gstToPayCents: integer("gst_to_pay_cents").notNull().default(0), // Box 15

    filedAt: timestamp("filed_at", { withTimezone: true }),
    filedBy: uuid("filed_by").references(() => users.id),
    notes: text(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("gst_returns_tenant_period_idx").on(table.tenantId, table.period),
  ]
);

/**
 * Expense Claims — personal→business expenses via Shareholder Current Account.
 * Created when a personal bank transaction is flagged as a business expense.
 */
export const expenseClaims = pgTable(
  "expense_claims",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    description: text().notNull(),
    amountCents: integer("amount_cents").notNull(), // total including GST
    gstCents: integer("gst_cents").notNull().default(0),
    accountId: uuid("account_id").notNull().references(() => accounts.id), // expense category

    status: text({
      enum: ["pending", "approved", "reimbursed"],
    }).notNull().default("pending"),

    sourceTransactionId: text("source_transaction_id"), // Akahu txn ID from personal account
    sourceBankTransactionId: uuid("source_bank_transaction_id").references(() => bankTransactions.id),
    journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id),
    reimbursementJournalId: uuid("reimbursement_journal_id").references(() => journalEntries.id),

    receiptUrl: text("receipt_url"),
    notes: text(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reimbursedAt: timestamp("reimbursed_at", { withTimezone: true }),
  },
  (table) => [
    index("expense_claims_tenant_status_idx").on(table.tenantId, table.status),
  ]
);
