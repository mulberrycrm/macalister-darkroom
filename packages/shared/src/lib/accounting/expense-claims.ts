import type { SupabaseClient } from "@supabase/supabase-js";
import { createJournalEntry, extractGst, getGstPeriod } from "./double-entry";

export interface ExpenseClaim {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  gstCents: number;
  accountId: string;
  status: "pending" | "approved" | "reimbursed";
  journalEntryId: string | null;
  reimbursementJournalId: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  reimbursedAt: string | null;
}

export async function createExpenseClaim(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  input: {
    date: string;
    description: string;
    amountCents: number;
    accountId: string;
    gstInclusive: boolean;
    receiptUrl?: string;
    notes?: string;
  }
): Promise<ExpenseClaim> {
  const { gstCents, exGstCents } = input.gstInclusive
    ? extractGst(input.amountCents)
    : { gstCents: 0, exGstCents: input.amountCents };

  // Find SCA account
  const { data: scaAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("sub_type", "sca")
    .single();

  if (!scaAccount) throw new Error("Shareholder Current Account not found. Seed chart of accounts first.");

  // Find GST Receivable account
  const { data: gstAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("code", "1200")
    .single();

  // Create double-entry journal: DR Expense + DR GST Receivable, CR SCA
  const lines = [
    {
      accountId: input.accountId,
      debitCents: exGstCents,
      creditCents: 0,
      gstAmountCents: 0,
      isGstExempt: !input.gstInclusive,
      description: input.description,
    },
  ];

  if (gstCents > 0 && gstAccount) {
    lines.push({
      accountId: gstAccount.id,
      debitCents: gstCents,
      creditCents: 0,
      gstAmountCents: gstCents,
      isGstExempt: false,
      description: `GST on: ${input.description}`,
    });
  }

  lines.push({
    accountId: scaAccount.id,
    debitCents: 0,
    creditCents: input.amountCents,
    gstAmountCents: 0,
    isGstExempt: true,
    description: `Expense claim: ${input.description}`,
  });

  const journalEntry = await createJournalEntry(supabase, tenantId, userId, {
    date: input.date,
    description: `Expense claim: ${input.description}`,
    reference: `EC-${Date.now().toString(36).toUpperCase()}`,
    sourceType: "expense_claim",
    lines,
  });

  // Create expense claim record
  const { data, error } = await supabase
    .from("expense_claims")
    .insert({
      tenant_id: tenantId,
      date: input.date,
      description: input.description,
      amount_cents: input.amountCents,
      gst_cents: gstCents,
      account_id: input.accountId,
      status: "pending",
      journal_entry_id: journalEntry.journalEntry.id,
      receipt_url: input.receiptUrl || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ExpenseClaim;
}

export async function approveExpenseClaim(
  supabase: SupabaseClient,
  tenantId: string,
  claimId: string
): Promise<void> {
  const { error } = await supabase
    .from("expense_claims")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("tenant_id", tenantId);

  if (error) throw error;
}

export async function reimburseExpenseClaim(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  claimId: string
): Promise<void> {
  // Fetch the claim
  const { data: claim, error: fetchError } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("id", claimId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !claim) throw new Error("Claim not found");
  if (claim.status !== "approved") throw new Error("Claim must be approved before reimbursement");

  // Find SCA and bank accounts
  const { data: scaAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("sub_type", "sca")
    .single();

  const { data: bankAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("sub_type", "bank")
    .limit(1)
    .single();

  if (!scaAccount || !bankAccount) throw new Error("SCA or Bank account not found");

  // Create reimbursement journal: DR SCA, CR Bank
  const journal = await createJournalEntry(supabase, tenantId, userId, {
    date: new Date().toISOString().split("T")[0],
    description: `Reimbursement: ${claim.description}`,
    reference: `REIMB-${claimId.slice(0, 8)}`,
    sourceType: "expense_claim",
    lines: [
      {
        accountId: scaAccount.id,
        debitCents: claim.amount_cents,
        creditCents: 0,
        gstAmountCents: 0,
        isGstExempt: true,
        description: `Reimbursement: ${claim.description}`,
      },
      {
        accountId: bankAccount.id,
        debitCents: 0,
        creditCents: claim.amount_cents,
        gstAmountCents: 0,
        isGstExempt: true,
        description: `Reimbursement: ${claim.description}`,
      },
    ],
  });

  await supabase
    .from("expense_claims")
    .update({
      status: "reimbursed",
      reimbursement_journal_id: journal.journalEntry.id,
      reimbursed_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .eq("tenant_id", tenantId);
}

export async function getScaBalance(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ balanceCents: number; claimsPending: number }> {
  // Get SCA account
  const { data: scaAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("sub_type", "sca")
    .single();

  if (!scaAccount) return { balanceCents: 0, claimsPending: 0 };

  // Sum journal lines for SCA
  const { data: lines } = await supabase
    .from("journal_lines")
    .select("debit_cents, credit_cents")
    .eq("account_id", scaAccount.id);

  let balance = 0;
  for (const l of lines || []) {
    balance += (l.credit_cents || 0) - (l.debit_cents || 0);
  }

  // Count pending claims
  const { count } = await supabase
    .from("expense_claims")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  return { balanceCents: balance, claimsPending: count || 0 };
}

export async function queryExpenseClaims(
  supabase: SupabaseClient,
  tenantId: string,
  options: {
    limit: number;
    offset: number;
    status?: string;
  }
): Promise<{ claims: ExpenseClaim[]; total: number }> {
  let query = supabase
    .from("expense_claims")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query.range(
    options.offset,
    options.offset + options.limit - 1
  );

  if (error) throw error;

  return {
    claims: (data || []) as ExpenseClaim[],
    total: count || 0,
  };
}
