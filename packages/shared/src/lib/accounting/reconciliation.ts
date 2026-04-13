import type { SupabaseClient } from "@supabase/supabase-js";
import { createJournalEntry, extractGst, reverseJournalEntry } from "./double-entry";
import type { JournalEntry, JournalLine } from "./double-entry";
import { suggestCategory } from "./category-suggestions";

/**
 * Bank reconciliation service.
 * Matches bank transactions to invoices or expense accounts,
 * auto-generates journal entries on reconciliation.
 */

export interface ReconciliationResult {
  reconciliationId: string;
  journalEntry: JournalEntry;
  journalLines: JournalLine[];
}

export interface UnreconciledTransaction {
  id: string;
  date: string;
  amount: number; // cents
  description: string;
  particulars: string | null;
  reference: string | null;
  accountType: string | null;
  // Suggestion (if any)
  suggestion?: {
    type: "invoice" | "rule";
    invoiceId?: string;
    invoiceNumber?: string;
    invoiceContactName?: string;
    ruleId?: string;
    accountId?: string;
    accountCode?: string;
    accountName?: string;
    gstApplicable?: boolean;
    confidence: number;
  };
}

interface AccountRow {
  id: string;
  code: string;
  name: string;
  gst_applicable: boolean;
}

/**
 * Look up a chart of accounts row by code for a tenant.
 */
async function getAccountByCode(
  supabase: SupabaseClient,
  tenantId: string,
  code: string
): Promise<AccountRow> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, code, name, gst_applicable")
    .eq("tenant_id", tenantId)
    .eq("code", code)
    .single();
  if (error || !data) throw new Error(`Account ${code} not found`);
  return data as AccountRow;
}

/**
 * Reconcile a bank transaction by matching it to an invoice.
 * Creates journal entry: DR Bank, CR Accounts Receivable, CR GST Payable
 */
export async function reconcileToInvoice(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  bankTransactionId: string,
  invoiceId: string,
  notes?: string
): Promise<ReconciliationResult> {
  // Fetch the bank transaction
  const { data: txn, error: txnError } = await supabase
    .from("bank_transactions")
    .select("id, amount, date, description, particulars, reference")
    .eq("id", bankTransactionId)
    .eq("tenant_id", tenantId)
    .single();
  if (txnError || !txn) throw new Error("Bank transaction not found");

  // Fetch the invoice
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_cents, status")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .single();
  if (invError || !invoice) throw new Error("Invoice not found");

  const amountCents = Math.abs(txn.amount);
  const { gstCents, exGstCents } = extractGst(amountCents);

  // Look up required accounts
  const bankAccount = await getAccountByCode(supabase, tenantId, "1000");
  const arAccount = await getAccountByCode(supabase, tenantId, "1100");
  const gstPayableAccount = await getAccountByCode(supabase, tenantId, "2100");

  const dateStr = typeof txn.date === "string"
    ? txn.date.split("T")[0]
    : new Date(txn.date).toISOString().split("T")[0];

  // Create journal entry
  const result = await createJournalEntry(supabase, tenantId, userId, {
    date: dateStr,
    reference: invoice.invoice_number,
    description: `Payment received: ${invoice.invoice_number} — ${txn.description}`,
    sourceType: "invoice_payment",
    sourceId: invoiceId,
    lines: [
      {
        accountId: bankAccount.id,
        description: `Payment received`,
        debitCents: amountCents,
        creditCents: 0,
      },
      {
        accountId: arAccount.id,
        description: `Invoice ${invoice.invoice_number}`,
        debitCents: 0,
        creditCents: exGstCents,
      },
      {
        accountId: gstPayableAccount.id,
        description: `GST on ${invoice.invoice_number}`,
        debitCents: 0,
        creditCents: gstCents,
        gstAmountCents: gstCents,
      },
    ],
  });

  // Create/update bank reconciliation record
  const { data: recon, error: reconError } = await supabase
    .from("bank_reconciliations")
    .upsert({
      tenant_id: tenantId,
      bank_transaction_id: bankTransactionId,
      journal_entry_id: result.journalEntry.id,
      status: "reconciled",
      matched_invoice_id: invoiceId,
      matched_by: "manual",
      confidence: 100,
      business_use_percent: 100,
      reconciled_by: userId,
      reconciled_at: new Date().toISOString(),
      notes: notes || null,
    }, { onConflict: "bank_transaction_id" })
    .select()
    .single();

  if (reconError) throw new Error(`Failed to save reconciliation: ${reconError.message}`);

  // Update invoice status to paid if fully matched
  if (amountCents >= invoice.total_cents) {
    await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId)
      .eq("tenant_id", tenantId);
  }

  return {
    reconciliationId: recon.id,
    journalEntry: result.journalEntry,
    journalLines: result.journalLines,
  };
}

/**
 * Reconcile a bank transaction as an expense (categorise to an expense account).
 * Creates journal entry: DR Expense, DR GST Receivable, CR Bank
 * Adjusts for businessUsePercent if < 100%.
 */
export async function reconcileAsExpense(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  bankTransactionId: string,
  accountId: string,
  options: {
    gstApplicable: boolean;
    businessUsePercent: number;
    notes?: string;
    matchedBy?: "auto_rule" | "manual";
  }
): Promise<ReconciliationResult> {
  // Fetch the bank transaction
  const { data: txn, error: txnError } = await supabase
    .from("bank_transactions")
    .select("id, amount, date, description")
    .eq("id", bankTransactionId)
    .eq("tenant_id", tenantId)
    .single();
  if (txnError || !txn) throw new Error("Bank transaction not found");

  // Fetch the target expense account
  const { data: expenseAccount, error: accError } = await supabase
    .from("accounts")
    .select("id, code, name, gst_applicable")
    .eq("id", accountId)
    .eq("tenant_id", tenantId)
    .single();
  if (accError || !expenseAccount) throw new Error("Account not found");

  const bankAccount = await getAccountByCode(supabase, tenantId, "1000");
  const gstReceivableAccount = await getAccountByCode(supabase, tenantId, "1200");

  const totalCents = Math.abs(txn.amount);
  const isIncome = txn.amount > 0;
  const useGst = options.gstApplicable && expenseAccount.gst_applicable;
  const businessPercent = options.businessUsePercent / 100;

  const dateStr = typeof txn.date === "string"
    ? txn.date.split("T")[0]
    : new Date(txn.date).toISOString().split("T")[0];

  let lines;

  if (isIncome) {
    // Income transaction: DR Bank, CR Revenue, CR GST Payable
    const gstPayableAccount = await getAccountByCode(supabase, tenantId, "2100");
    if (useGst) {
      const { gstCents, exGstCents } = extractGst(totalCents);
      lines = [
        { accountId: bankAccount.id, description: "Deposit", debitCents: totalCents, creditCents: 0 },
        { accountId: accountId, description: txn.description, debitCents: 0, creditCents: exGstCents },
        { accountId: gstPayableAccount.id, description: "GST", debitCents: 0, creditCents: gstCents, gstAmountCents: gstCents },
      ];
    } else {
      lines = [
        { accountId: bankAccount.id, description: "Deposit", debitCents: totalCents, creditCents: 0 },
        { accountId: accountId, description: txn.description, debitCents: 0, creditCents: totalCents, isGstExempt: true },
      ];
    }
  } else {
    // Expense transaction: DR Expense, DR GST Receivable, CR Bank
    if (useGst) {
      const { gstCents, exGstCents } = extractGst(totalCents);
      const claimableGst = Math.round(gstCents * businessPercent);
      const claimableExpense = Math.round(exGstCents * businessPercent);
      const nonClaimable = totalCents - claimableExpense - claimableGst;

      if (businessPercent < 1 && nonClaimable > 0) {
        // Mixed use: split into claimable expense + non-claimable (drawings/personal)
        const drawingsAccount = await getAccountByCode(supabase, tenantId, "3300");
        lines = [
          { accountId: accountId, description: txn.description, debitCents: claimableExpense, creditCents: 0 },
          { accountId: gstReceivableAccount.id, description: "GST claimed", debitCents: claimableGst, creditCents: 0, gstAmountCents: claimableGst },
          { accountId: drawingsAccount.id, description: "Personal portion", debitCents: nonClaimable, creditCents: 0, isGstExempt: true },
          { accountId: bankAccount.id, description: "Payment", debitCents: 0, creditCents: totalCents },
        ];
      } else {
        lines = [
          { accountId: accountId, description: txn.description, debitCents: exGstCents, creditCents: 0 },
          { accountId: gstReceivableAccount.id, description: "GST", debitCents: gstCents, creditCents: 0, gstAmountCents: gstCents },
          { accountId: bankAccount.id, description: "Payment", debitCents: 0, creditCents: totalCents },
        ];
      }
    } else {
      // No GST
      lines = [
        { accountId: accountId, description: txn.description, debitCents: totalCents, creditCents: 0, isGstExempt: true },
        { accountId: bankAccount.id, description: "Payment", debitCents: 0, creditCents: totalCents },
      ];
    }
  }

  const result = await createJournalEntry(supabase, tenantId, userId, {
    date: dateStr,
    description: `${isIncome ? "Income" : "Expense"}: ${txn.description}`,
    sourceType: isIncome ? "bank_reconciliation" : "expense",
    sourceId: bankTransactionId,
    lines,
  });

  const { data: recon, error: reconError } = await supabase
    .from("bank_reconciliations")
    .upsert({
      tenant_id: tenantId,
      bank_transaction_id: bankTransactionId,
      journal_entry_id: result.journalEntry.id,
      status: "reconciled",
      matched_account_id: accountId,
      matched_by: options.matchedBy || "manual",
      confidence: 100,
      business_use_percent: options.businessUsePercent,
      reconciled_by: userId,
      reconciled_at: new Date().toISOString(),
      notes: options.notes || null,
    }, { onConflict: "bank_transaction_id" })
    .select()
    .single();

  if (reconError) throw new Error(`Failed to save reconciliation: ${reconError.message}`);

  return {
    reconciliationId: recon.id,
    journalEntry: result.journalEntry,
    journalLines: result.journalLines,
  };
}

/**
 * Mark a bank transaction as excluded (e.g., inter-account transfer, duplicate).
 */
export async function excludeTransaction(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  bankTransactionId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from("bank_reconciliations")
    .upsert({
      tenant_id: tenantId,
      bank_transaction_id: bankTransactionId,
      status: "excluded",
      matched_by: "manual",
      reconciled_by: userId,
      reconciled_at: new Date().toISOString(),
      notes: notes || null,
    }, { onConflict: "bank_transaction_id" })
    .select()
    .single();

  if (error) throw new Error(`Failed to exclude transaction: ${error.message}`);
}

/**
 * Undo a reconciliation: reverse the journal entry and set status back to unreconciled.
 */
export async function undoReconciliation(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  bankTransactionId: string
): Promise<void> {
  // Get the reconciliation record
  const { data: recon, error: reconError } = await supabase
    .from("bank_reconciliations")
    .select("id, journal_entry_id, status")
    .eq("bank_transaction_id", bankTransactionId)
    .eq("tenant_id", tenantId)
    .single();

  if (reconError || !recon) throw new Error("Reconciliation not found");
  if (recon.status === "unreconciled") throw new Error("Transaction is not reconciled");

  // Reverse the journal entry if one exists
  if (recon.journal_entry_id) {
    await reverseJournalEntry(supabase, tenantId, userId, recon.journal_entry_id, "Reconciliation undone");
  }

  // Reset reconciliation status
  await supabase
    .from("bank_reconciliations")
    .update({
      status: "unreconciled",
      journal_entry_id: null,
      matched_invoice_id: null,
      matched_account_id: null,
      matched_by: null,
      confidence: null,
      reconciled_by: null,
      reconciled_at: null,
    })
    .eq("id", recon.id)
    .eq("tenant_id", tenantId);
}

/**
 * Find bank rules that match a transaction.
 * Returns the highest-priority matching rule, or null.
 */
export async function findMatchingRule(
  supabase: SupabaseClient,
  tenantId: string,
  transaction: { description: string; particulars?: string | null; reference?: string | null; amount?: number }
): Promise<{
  id: string;
  name: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  gstApplicable: boolean;
} | null> {
  const { data: rules, error } = await supabase
    .from("bank_rules")
    .select("id, name, match_field, match_type, match_value, account_id, gst_applicable")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !rules || rules.length === 0) return null;

  for (const rule of rules) {
    const fieldValue = getFieldValue(transaction, rule.match_field);
    if (!fieldValue) continue;

    const matches = matchValue(fieldValue, rule.match_type, rule.match_value);
    if (matches) {
      // Look up the target account
      const { data: account } = await supabase
        .from("accounts")
        .select("id, code, name")
        .eq("id", rule.account_id)
        .single();

      if (account) {
        return {
          id: rule.id,
          name: rule.name,
          accountId: rule.account_id,
          accountCode: account.code,
          accountName: account.name,
          gstApplicable: rule.gst_applicable,
        };
      }
    }
  }

  return null;
}

function getFieldValue(
  txn: { description: string; particulars?: string | null; reference?: string | null; amount?: number },
  field: string
): string | null {
  switch (field) {
    case "description": return txn.description;
    case "particulars": return txn.particulars || null;
    case "reference": return txn.reference || null;
    case "amount": return txn.amount != null ? String(txn.amount) : null;
    default: return null;
  }
}

function matchValue(fieldValue: string, matchType: string, matchVal: string): boolean {
  const lower = fieldValue.toLowerCase();
  const target = matchVal.toLowerCase();
  switch (matchType) {
    case "contains": return lower.includes(target);
    case "equals": return lower === target;
    case "starts_with": return lower.startsWith(target);
    default: return false;
  }
}

/**
 * Find unpaid invoices that might match a bank transaction (by amount or reference).
 */
export async function findMatchingInvoices(
  supabase: SupabaseClient,
  tenantId: string,
  transaction: { amount: number; particulars?: string | null; reference?: string | null; description: string }
): Promise<Array<{
  invoiceId: string;
  invoiceNumber: string;
  contactName: string;
  totalCents: number;
  confidence: number;
  matchReason: string;
}>> {
  const matches: Array<{
    invoiceId: string;
    invoiceNumber: string;
    contactName: string;
    totalCents: number;
    confidence: number;
    matchReason: string;
  }> = [];

  // Only match positive amounts (payments received)
  if (transaction.amount <= 0) return matches;

  const amountCents = Math.abs(transaction.amount);

  // Fetch unpaid invoices
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_cents, status, contact_id, contacts(display_name)")
    .eq("tenant_id", tenantId)
    .in("status", ["sent", "overdue"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !invoices) return matches;

  for (const inv of invoices) {
    let confidence = 0;
    let matchReason = "";

    // Check if invoice number appears in particulars or reference
    const searchFields = [
      transaction.particulars,
      transaction.reference,
      transaction.description,
    ].filter(Boolean).join(" ").toLowerCase();

    const invNumber = inv.invoice_number?.toLowerCase() || "";

    if (invNumber && searchFields.includes(invNumber)) {
      confidence = 95;
      matchReason = `Invoice number "${inv.invoice_number}" found in transaction`;
    } else if (amountCents === inv.total_cents) {
      confidence = 80;
      matchReason = `Amount matches exactly ($${(amountCents / 100).toFixed(2)})`;
    }

    if (confidence > 0) {
      const contactName = (inv as Record<string, unknown>).contacts
        ? ((inv as Record<string, unknown>).contacts as { display_name: string })?.display_name || "Unknown"
        : "Unknown";

      matches.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        contactName,
        totalCents: inv.total_cents,
        confidence,
        matchReason,
      });
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

/**
 * Get unreconciled bank transactions with auto-suggestions.
 */
export async function getUnreconciledWithSuggestions(
  supabase: SupabaseClient,
  tenantId: string,
  options: {
    limit: number;
    offset: number;
    from?: string;
    to?: string;
    accountType?: string;
  }
): Promise<{ transactions: UnreconciledTransaction[]; total: number }> {
  // Get business bank transactions that don't have a reconciliation record,
  // or have an 'unreconciled' reconciliation record
  let query = supabase
    .from("bank_transactions")
    .select("id, date, amount, description, particulars, reference, account_type, metadata", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (options.accountType) {
    query = query.eq("account_type", options.accountType);
  } else {
    query = query.eq("account_type", "business");
  }

  if (options.from) query = query.gte("date", options.from);
  if (options.to) query = query.lte("date", options.to);

  query = query.order("date", { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);

  const { data: allTxns, error: txnError, count } = await query;
  if (txnError || !allTxns) return { transactions: [], total: 0 };

  // Get already-reconciled transaction IDs
  const txnIds = allTxns.map((t: { id: string }) => t.id);
  const { data: reconciled } = await supabase
    .from("bank_reconciliations")
    .select("bank_transaction_id, status")
    .in("bank_transaction_id", txnIds)
    .neq("status", "unreconciled");

  const reconciledIds = new Set(
    (reconciled || []).map((r: { bank_transaction_id: string }) => r.bank_transaction_id)
  );

  // Filter to unreconciled only
  const unreconciledTxns = allTxns.filter(
    (t: { id: string }) => !reconciledIds.has(t.id)
  );

  // Generate suggestions for each
  const transactions: UnreconciledTransaction[] = [];
  for (const txn of unreconciledTxns) {
    const result: UnreconciledTransaction = {
      id: txn.id,
      date: typeof txn.date === "string" ? txn.date.split("T")[0] : new Date(txn.date).toISOString().split("T")[0],
      amount: txn.amount,
      description: txn.description,
      particulars: txn.particulars,
      reference: txn.reference,
      accountType: txn.account_type,
    };

    // Try invoice matching first (for positive amounts)
    if (txn.amount > 0) {
      const invoiceMatches = await findMatchingInvoices(supabase, tenantId, txn);
      if (invoiceMatches.length > 0) {
        const best = invoiceMatches[0];
        result.suggestion = {
          type: "invoice",
          invoiceId: best.invoiceId,
          invoiceNumber: best.invoiceNumber,
          invoiceContactName: best.contactName,
          confidence: best.confidence,
        };
      }
    }

    // If no invoice match, try rules
    if (!result.suggestion) {
      const rule = await findMatchingRule(supabase, tenantId, txn);
      if (rule) {
        result.suggestion = {
          type: "rule",
          ruleId: rule.id,
          accountId: rule.accountId,
          accountCode: rule.accountCode,
          accountName: rule.accountName,
          gstApplicable: rule.gstApplicable,
          confidence: 90,
        };
      }
    }

    // Fallback: use Akahu merchant/category from metadata
    if (!result.suggestion && txn.metadata) {
      const meta = typeof txn.metadata === "string" ? JSON.parse(txn.metadata) : txn.metadata;
      const merchantName = meta?.merchant?.name;
      if (merchantName) {
        // Try to find an account matching the merchant category
        const categoryName = meta?.category?.name;
        if (categoryName) {
          const { data: matchedAccount } = await supabase
            .from("accounts")
            .select("id, code, name")
            .eq("tenant_id", tenantId)
            .eq("type", txn.amount < 0 ? "expense" : "revenue")
            .ilike("name", `%${categoryName}%`)
            .limit(1)
            .single();

          if (matchedAccount) {
            result.suggestion = {
              type: "rule",
              accountId: matchedAccount.id,
              accountCode: matchedAccount.code,
              accountName: `${matchedAccount.name} (${merchantName})`,
              gstApplicable: true,
              confidence: 50,
            };
          }
        }
      }
    }

    // Final fallback: AI category suggestion from history
    if (!result.suggestion) {
      const aiSuggestion = await suggestCategory(supabase, tenantId, {
        description: txn.description,
        amount: txn.amount,
        particulars: txn.particulars,
        reference: txn.reference,
        metadata: txn.metadata,
      });
      if (aiSuggestion && aiSuggestion.accountId) {
        result.suggestion = {
          type: "rule",
          accountId: aiSuggestion.accountId,
          accountCode: aiSuggestion.accountCode,
          accountName: aiSuggestion.accountName,
          gstApplicable: aiSuggestion.gstApplicable,
          confidence: aiSuggestion.confidence,
        };
      }
    }

    transactions.push(result);
  }

  return { transactions, total: count || 0 };
}
