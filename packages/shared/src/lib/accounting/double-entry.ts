import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Double-entry accounting service.
 * Creates and validates balanced journal entries.
 * All amounts are in cents (integers).
 */

export interface JournalLineInput {
  accountId: string;
  description?: string;
  debitCents: number;
  creditCents: number;
  gstAmountCents?: number;
  isGstExempt?: boolean;
}

export interface CreateJournalEntryInput {
  date: string; // YYYY-MM-DD
  reference?: string;
  description: string;
  sourceType?: string;
  sourceId?: string;
  lines: JournalLineInput[];
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  date: string;
  reference: string | null;
  description: string;
  sourceType: string | null;
  sourceId: string | null;
  gstPeriod: string | null;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  description: string | null;
  debitCents: number;
  creditCents: number;
  gstAmountCents: number;
  isGstExempt: boolean;
}

/**
 * Validates that total debits === total credits for a set of journal lines.
 */
export function validateBalancedEntry(lines: JournalLineInput[]): {
  valid: boolean;
  debitTotal: number;
  creditTotal: number;
} {
  const debitTotal = lines.reduce((sum, l) => sum + l.debitCents, 0);
  const creditTotal = lines.reduce((sum, l) => sum + l.creditCents, 0);
  return { valid: debitTotal === creditTotal, debitTotal, creditTotal };
}

/**
 * Extracts GST component from a GST-inclusive amount.
 * NZ GST: 15% → GST = amount × 3/23
 */
export function extractGst(amountCents: number): {
  gstCents: number;
  exGstCents: number;
} {
  const absAmount = Math.abs(amountCents);
  const gstCents = Math.round(absAmount * 3 / 23);
  const exGstCents = absAmount - gstCents;
  return { gstCents, exGstCents };
}

/**
 * Derives the GST period (YYYY-MM) from a date string.
 */
export function getGstPeriod(dateStr: string): string {
  return dateStr.substring(0, 7); // "2026-03-15" → "2026-03"
}

/**
 * Creates a balanced journal entry with lines.
 * Throws if debits !== credits.
 */
export async function createJournalEntry(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  entry: CreateJournalEntryInput
): Promise<{ journalEntry: JournalEntry; journalLines: JournalLine[] }> {
  // Validate balance
  const { valid, debitTotal, creditTotal } = validateBalancedEntry(entry.lines);
  if (!valid) {
    throw new Error(
      `Journal entry is not balanced: debits=${debitTotal}, credits=${creditTotal}`
    );
  }

  // Validate at least 2 lines
  if (entry.lines.length < 2) {
    throw new Error("Journal entry must have at least 2 lines");
  }

  // Validate each line has either debit or credit (not both)
  for (const line of entry.lines) {
    if (line.debitCents > 0 && line.creditCents > 0) {
      throw new Error("A journal line cannot have both debit and credit");
    }
    if (line.debitCents < 0 || line.creditCents < 0) {
      throw new Error("Debit and credit amounts must be non-negative");
    }
  }

  const gstPeriod = getGstPeriod(entry.date);

  // Insert journal entry header
  const { data: je, error: jeError } = await supabase
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      date: entry.date,
      reference: entry.reference || null,
      description: entry.description,
      source_type: entry.sourceType || null,
      source_id: entry.sourceId || null,
      is_gst_cash_basis: true, // always cash basis
      gst_period: gstPeriod,
      created_by: userId,
    })
    .select()
    .single();

  if (jeError) {
    throw new Error(`Failed to create journal entry: ${jeError.message}`);
  }

  // Insert journal lines
  const lineRecords = entry.lines.map((line) => ({
    journal_entry_id: je.id,
    account_id: line.accountId,
    description: line.description || null,
    debit_cents: line.debitCents,
    credit_cents: line.creditCents,
    gst_amount_cents: line.gstAmountCents || 0,
    is_gst_exempt: line.isGstExempt || false,
  }));

  const { data: lines, error: linesError } = await supabase
    .from("journal_lines")
    .insert(lineRecords)
    .select();

  if (linesError) {
    throw new Error(`Failed to create journal lines: ${linesError.message}`);
  }

  return {
    journalEntry: je as JournalEntry,
    journalLines: lines as JournalLine[],
  };
}

/**
 * Reverses an existing journal entry by creating a mirror entry.
 * The original entry is marked as reversed.
 */
export async function reverseJournalEntry(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  journalEntryId: string,
  reason: string
): Promise<{ journalEntry: JournalEntry; journalLines: JournalLine[] }> {
  // Fetch original entry + lines
  const { data: original, error: origError } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", journalEntryId)
    .eq("tenant_id", tenantId)
    .single();

  if (origError || !original) {
    throw new Error("Journal entry not found");
  }

  if (original.is_reversed) {
    throw new Error("Journal entry is already reversed");
  }

  const { data: originalLines, error: linesError } = await supabase
    .from("journal_lines")
    .select("*")
    .eq("journal_entry_id", journalEntryId);

  if (linesError || !originalLines) {
    throw new Error("Failed to fetch journal lines");
  }

  // Create reversal entry (swap debits and credits)
  // Supabase returns snake_case columns
  const reversalLines: JournalLineInput[] = originalLines.map((line: Record<string, unknown>) => ({
    accountId: (line.account_id as string),
    description: `Reversal: ${(line.description as string) || ""}`.trim(),
    debitCents: (line.credit_cents as number) || 0,
    creditCents: (line.debit_cents as number) || 0,
    gstAmountCents: (line.gst_amount_cents as number) || 0,
    isGstExempt: (line.is_gst_exempt as boolean) ?? false,
  }));

  const result = await createJournalEntry(supabase, tenantId, userId, {
    date: new Date().toISOString().split("T")[0],
    reference: `REV-${original.reference || journalEntryId.slice(0, 8)}`,
    description: `Reversal: ${reason}`,
    sourceType: original.source_type,
    sourceId: original.source_id,
    lines: reversalLines,
  });

  // Mark original as reversed
  await supabase
    .from("journal_entries")
    .update({
      is_reversed: true,
      reversed_by: result.journalEntry.id,
    })
    .eq("id", journalEntryId)
    .eq("tenant_id", tenantId);

  return result;
}
