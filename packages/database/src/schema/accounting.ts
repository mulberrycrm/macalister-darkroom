import { pgTable, uuid, text, integer, timestamp, boolean, index, jsonb, real } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { invoices } from "./system";
import { orders } from "./commerce";

/**
 * Bank transactions imported from Akahu API
 * Represents raw bank statement data
 */
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Akahu-specific fields
    akahuTransactionId: text("akahu_transaction_id").notNull().unique(),

    // Transaction details
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    amount: integer("amount").notNull(), // in cents, can be negative for debits
    description: text().notNull(),
    particulars: text(), // Often contains invoice number or payment reference
    particularsEncrypted: text("particulars_encrypted"), // AES-256-GCM encrypted sensitive data
    code: text(), // Akahu transaction code field
    reference: text(), // Akahu transaction reference field
    referenceEncrypted: text("reference_encrypted"), // AES-256-GCM encrypted sensitive data

    // Bank account information
    accountId: text("account_id").notNull(), // Akahu account ID
    accountNumber: text("account_number"),

    // Account classification (from akahuAccounts)
    accountType: text("account_type", {
      enum: ["personal", "business"],
    }), // Inherited from akahuAccounts for filtering

    // Balances
    balance: integer(), // Account balance after transaction (in cents)

    // Raw metadata from Akahu
    metadata: jsonb().notNull().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bank_transactions_tenant_id_idx").on(table.tenantId),
    index("bank_transactions_date_idx").on(table.date),
    index("bank_transactions_akahu_id_idx").on(table.akahuTransactionId),
    index("bank_transactions_reference_idx").on(table.particulars, table.reference),
  ]
);

/**
 * Links bank transactions to invoices for payment matching
 * A single transaction can match multiple invoices (partial payments)
 */
export const transactionMatches = pgTable(
  "transaction_matches",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Links to bank transaction and invoice
    bankTransactionId: uuid("bank_transaction_id").notNull().references(() => bankTransactions.id),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    orderId: uuid("order_id").references(() => orders.id),

    // Amount matched in this transaction (in cents)
    matchedAmount: integer("matched_amount").notNull(),

    // Matching method used
    matchMethod: text("match_method", {
      enum: [
        "auto_invoice_number", // Matched via invoice number in particulars
        "auto_reference", // Matched via reference field
        "auto_amount", // Matched by amount and approximate date
        "manual", // Manually matched by user
      ],
    }).notNull(),

    // Confidence score (0-100) for auto-matches
    confidence: integer().default(100),

    // Whether this match has been confirmed/reviewed
    isConfirmed: boolean("is_confirmed").notNull().default(false),

    // Notes on why this match was made
    notes: text(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    index("transaction_matches_tenant_id_idx").on(table.tenantId),
    index("transaction_matches_bank_transaction_id_idx").on(table.bankTransactionId),
    index("transaction_matches_invoice_id_idx").on(table.invoiceId),
  ]
);

/**
 * Akahu account credentials and sync status
 * Tracks OAuth tokens and last sync time
 */
export const akahuAccounts = pgTable(
  "akahu_accounts",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Akahu API tokens
    userToken: text("user_token").notNull(), // User-specific token for API access

    // Account details from Akahu
    akahuAccountId: text("akahu_account_id").notNull().unique(),
    accountName: text("account_name"),
    accountType: text("account_type"), // "BANK_ACCOUNT", "CREDIT_CARD", etc - used to classify as personal/business
    accountNumber: text("account_number"),

    // Sync status
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    nextSyncAt: timestamp("next_sync_at", { withTimezone: true }),
    lastSyncStatus: text("last_sync_status", {
      enum: ["success", "error", "pending"],
    }).default("pending"),
    lastError: text("last_error"),

    // Whether this account is active
    isActive: boolean("is_active").notNull().default(true),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("akahu_accounts_tenant_id_idx").on(table.tenantId),
    index("akahu_accounts_akahu_account_id_idx").on(table.akahuAccountId),
  ]
);

/**
 * Expense categories for categorizing transactions
 * Supports both personal account (personal vs business) and business account (expense type) categorization
 * Pre-populated with NZ tax system categories
 */
export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Category details
    name: text().notNull(), // e.g. "Office Supplies", "Travel", "Equipment & Software"
    description: text(), // Detailed description for user reference

    // Tax information
    taxCode: text("tax_code"), // NZ tax code for Xero export (e.g. "4000")
    isDeductible: boolean("is_deductible").notNull().default(true),

    // Soft delete
    isActive: boolean("is_active").notNull().default(true),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("expense_categories_tenant_id_idx").on(table.tenantId),
  ]
);

/**
 * Transaction categorizations - audit-logged classification of bank transactions
 * Handles two workflows:
 * 1. Personal account: isPersonal flag indicates personal vs business expense to claim
 * 2. Business account: expenseCategoryId categorizes for CRM reporting
 */
export const transactionCategorizations = pgTable(
  "transaction_categorizations",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Links to bank transaction
    bankTransactionId: uuid("bank_transaction_id").notNull().references(() => bankTransactions.id),

    // Account type (inherited from bankTransactions for filtering)
    accountType: text("account_type", {
      enum: ["personal", "business"],
    }).notNull(),

    // Category (optional for some flows)
    expenseCategoryId: uuid("expense_category_id").references(() => expenseCategories.id),

    // Personal account workflow (only used when accountType = 'personal')
    isPersonal: boolean("is_personal"), // true = personal expense, false = business expense to claim
    isDeductible: boolean("is_deductible"), // Can override category deductibility
    deductionPercent: integer("deduction_percent").default(100), // 0-100, for partial deductions (e.g. business meals 50%)

    // Notes and audit trail
    notes: text(), // Reason for categorization (e.g. "Client entertainment - lunch with Jane Smith")
    categorizedBy: uuid("categorized_by").notNull().references(() => users.id),
    categorizedAt: timestamp("categorized_at", { withTimezone: true }).notNull(),

    // Track previous categorizations for audit (self-reference for tracking changes)
    previousCategoryId: uuid("previous_category_id"), // FK to transactionCategorizations.id - added manually due to self-reference

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("transaction_categorizations_tenant_id_bank_transaction_id_idx").on(
      table.tenantId,
      table.bankTransactionId
    ),
    index("transaction_categorizations_tenant_id_account_type_idx").on(
      table.tenantId,
      table.accountType
    ),
    index("transaction_categorizations_expense_category_id_idx").on(table.expenseCategoryId),
    index("transaction_categorizations_categorized_at_idx").on(table.categorizedAt),
  ]
);

/**
 * Receipts for expense tracking
 * Stores receipt images and extracted data for matching to bank transactions
 */
export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Extracted data
    vendorName: text("vendor_name"),
    date: timestamp("date", { withTimezone: true }),
    totalAmountCents: integer("total_amount_cents"), // GST-inclusive
    subtotalAmountCents: integer("subtotal_amount_cents"),
    gstAmountCents: integer("gst_amount_cents"),
    gstNumber: text("gst_number"), // vendor's GST number
    gstEstimated: boolean("gst_estimated").default(false),
    currency: text("currency").default("NZD"),
    description: text("description"),
    notes: text("notes"),

    // Categorisation
    expenseCategoryId: uuid("expense_category_id").references(() => expenseCategories.id),

    // Receipt image
    imageR2Path: text("image_r2_path").notNull(),
    imageUrl: text("image_url"),
    thumbnailR2Path: text("thumbnail_r2_path"),

    // Extraction metadata
    extractionMethod: text("extraction_method"), // 'claude_api', 'manual'
    extractionRaw: jsonb("extraction_raw"),
    extractionConfidence: real("extraction_confidence"),

    // Matching to bank transactions
    bankTransactionId: uuid("bank_transaction_id").references(() => bankTransactions.id),
    matchStatus: text("match_status").default("unmatched"), // 'unmatched', 'matched', 'no_transaction'

    // Source
    source: text("source").default("camera"), // 'camera', 'gallery', 'manual'

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("receipts_tenant_id_idx").on(table.tenantId),
    index("receipts_date_idx").on(table.date),
    index("receipts_match_status_idx").on(table.tenantId, table.matchStatus),
    index("receipts_bank_transaction_id_idx").on(table.bankTransactionId),
  ]
);

/**
 * Task queue for Claude Code to process non-urgent background work
 * Tasks are claimed, processed, and completed by Claude Code agents
 */
export const claudeTasks = pgTable(
  "claude_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),

    // Task definition
    taskType: text("task_type").notNull(), // 'receipt_extract', 'categorise_transaction', 'generate_report', 'data_cleanup'
    priority: integer("priority").default(0), // higher = more urgent
    status: text("status").default("pending").notNull(), // 'pending', 'processing', 'done', 'failed', 'cancelled'

    // Input/output
    inputData: jsonb("input_data"), // task-specific input (e.g., { receiptId: "..." })
    outputData: jsonb("output_data"), // task-specific result
    errorMessage: text("error_message"), // if failed

    // Tracking
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }), // optional: don't process before this time
  },
  (table) => [
    index("claude_tasks_tenant_id_idx").on(table.tenantId),
    index("claude_tasks_status_idx").on(table.status),
    index("claude_tasks_tenant_status_priority_idx").on(table.tenantId, table.status, table.priority),
  ]
);
