import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecurringPattern {
  description: string;
  normalizedDescription: string;
  averageAmountCents: number;
  frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "annual";
  occurrences: number;
  lastDate: string;
  nextExpectedDate: string;
  accountId: string | null;
  accountName: string | null;
}

/**
 * Detect recurring transaction patterns from bank transaction history.
 * Groups transactions by normalised description, calculates frequency,
 * and predicts next expected date.
 */
export async function detectRecurringTransactions(
  supabase: SupabaseClient,
  tenantId: string,
  options?: { minOccurrences?: number; lookbackDays?: number }
): Promise<RecurringPattern[]> {
  const minOccurrences = options?.minOccurrences || 3;
  const lookbackDays = options?.lookbackDays || 365;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  // Fetch transaction history
  const { data: transactions, error } = await supabase
    .from("bank_transactions")
    .select("id, date, amount, description, account_type")
    .eq("tenant_id", tenantId)
    .gte("date", cutoff.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error || !transactions || transactions.length === 0) return [];

  // Group by normalized description + similar amount
  const groups = new Map<string, Array<{ date: string; amount: number }>>();

  for (const txn of transactions) {
    const key = normalizeForGrouping(txn.description);
    if (!key) continue;

    const existing = groups.get(key) || [];
    existing.push({ date: txn.date, amount: txn.amount });
    groups.set(key, existing);
  }

  // Get reconciliation info for account mapping
  const { data: reconciliations } = await supabase
    .from("bank_reconciliations")
    .select("bank_transaction_id, account_id, accounts(name)")
    .eq("status", "reconciled")
    .limit(1000);

  const txnAccountMap = new Map<string, { accountId: string; accountName: string }>();
  for (const rec of (reconciliations || [])) {
    const accountName = (rec.accounts as any)?.name || "";
    txnAccountMap.set(rec.bank_transaction_id, {
      accountId: rec.account_id,
      accountName,
    });
  }

  const patterns: RecurringPattern[] = [];

  for (const [normalizedDesc, occurrences] of groups.entries()) {
    if (occurrences.length < minOccurrences) continue;

    // Calculate intervals between consecutive transactions
    const dates = occurrences
      .map(o => new Date(o.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = Math.round((dates[i].getTime() - dates[i-1].getTime()) / 86400000);
      intervals.push(daysDiff);
    }

    if (intervals.length === 0) continue;

    // Determine frequency from average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = classifyFrequency(avgInterval);
    if (!frequency) continue;

    // Check consistency (standard deviation should be low relative to interval)
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > avgInterval * 0.3) continue; // Too inconsistent

    // Average amount
    const avgAmount = Math.round(occurrences.reduce((s, o) => s + o.amount, 0) / occurrences.length);

    // Predict next date
    const lastDate = dates[dates.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

    // Find account from any reconciled transaction with this description
    let accountId: string | null = null;
    let accountName: string | null = null;

    patterns.push({
      description: occurrences[0]?.date ? normalizedDesc : normalizedDesc,
      normalizedDescription: normalizedDesc,
      averageAmountCents: avgAmount,
      frequency,
      occurrences: occurrences.length,
      lastDate: lastDate.toISOString().split("T")[0],
      nextExpectedDate: nextDate.toISOString().split("T")[0],
      accountId,
      accountName,
    });
  }

  // Sort by occurrence count descending
  patterns.sort((a, b) => b.occurrences - a.occurrences);
  return patterns;
}

function normalizeForGrouping(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\d{2}\/\d{2}\/?\d{0,4}/g, "") // Remove dates
    .replace(/\d{4,}/g, "") // Remove long numbers (reference IDs)
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyFrequency(avgDays: number): RecurringPattern["frequency"] | null {
  if (avgDays >= 5 && avgDays <= 9) return "weekly";
  if (avgDays >= 12 && avgDays <= 17) return "fortnightly";
  if (avgDays >= 25 && avgDays <= 35) return "monthly";
  if (avgDays >= 80 && avgDays <= 100) return "quarterly";
  if (avgDays >= 340 && avgDays <= 400) return "annual";
  return null;
}
