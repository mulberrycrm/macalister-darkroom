import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategorySuggestion {
  accountId: string;
  accountCode: string;
  accountName: string;
  gstApplicable: boolean;
  confidence: number;
  reason: string;
}

/**
 * Suggest a category for a bank transaction based on past reconciliation history.
 * Uses description similarity matching against previously reconciled transactions.
 */
export async function suggestCategory(
  supabase: SupabaseClient,
  tenantId: string,
  transaction: {
    description: string;
    amount: number;
    particulars?: string | null;
    reference?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<CategorySuggestion | null> {
  // Get past reconciled transactions with their account assignments
  const { data: pastReconciliations } = await supabase
    .from("bank_reconciliations")
    .select(`
      bank_transaction_id,
      account_id,
      status,
      accounts!inner(id, code, name, type, gst_applicable),
      bank_transactions!inner(description, amount)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "reconciled")
    .limit(500)
    .order("created_at", { ascending: false });

  if (!pastReconciliations || pastReconciliations.length === 0) return null;

  // Normalize the incoming description
  const normalizedDesc = normalizeDescription(transaction.description);
  const isExpense = transaction.amount < 0;

  // Find best match by description similarity
  let bestMatch: CategorySuggestion | null = null;
  let bestScore = 0;

  // Build a map of description -> account (majority vote)
  const descriptionMap = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      gstApplicable: boolean;
      count: number;
    }
  >();

  for (const rec of pastReconciliations) {
    const pastDesc = normalizeDescription((rec.bank_transactions as any)?.description || "");
    const account = rec.accounts as any;
    if (!account || !pastDesc) continue;

    const key = pastDesc;
    const existing = descriptionMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      descriptionMap.set(key, {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        gstApplicable: account.gst_applicable,
        count: 1,
      });
    }
  }

  // Score each past description against the new one
  for (const [pastDesc, info] of descriptionMap.entries()) {
    const score = calculateSimilarity(normalizedDesc, pastDesc);

    // Boost score for exact matches and high frequency
    const adjustedScore = score * (1 + Math.min(info.count / 10, 0.5));

    if (adjustedScore > bestScore && adjustedScore > 0.6) {
      bestScore = adjustedScore;
      bestMatch = {
        accountId: info.accountId,
        accountCode: info.accountCode,
        accountName: info.accountName,
        gstApplicable: info.gstApplicable,
        confidence: Math.min(Math.round(adjustedScore * 100), 95),
        reason: `Similar to past transactions categorised as ${info.accountName} (${info.count} times)`,
      };
    }
  }

  // If no history match, try keyword heuristics
  if (!bestMatch) {
    bestMatch = keywordHeuristic(transaction.description, isExpense);
  }

  return bestMatch;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;

  const aWords = new Set(a.split(" ").filter((w) => w.length > 2));
  const bWords = new Set(b.split(" ").filter((w) => w.length > 2));

  if (aWords.size === 0 || bWords.size === 0) return 0;

  let intersection = 0;
  for (const word of aWords) {
    if (bWords.has(word)) intersection++;
  }

  // Jaccard similarity
  const union = aWords.size + bWords.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// Common NZ business expense keywords
const KEYWORD_CATEGORIES: Array<{
  keywords: string[];
  accountName: string;
  accountCode: string;
  gstApplicable: boolean;
}> = [
  {
    keywords: ["petrol", "fuel", "bp", "z energy", "gull", "mobil"],
    accountName: "Vehicle Expenses",
    accountCode: "5300",
    gstApplicable: true,
  },
  {
    keywords: ["adobe", "canva", "lightroom", "photoshop", "capture one"],
    accountName: "Software & Subscriptions",
    accountCode: "5400",
    gstApplicable: true,
  },
  {
    keywords: ["spark", "vodafone", "2degrees", "one nz"],
    accountName: "Phone & Internet",
    accountCode: "5500",
    gstApplicable: true,
  },
  {
    keywords: ["insurance", "nib", "tower", "ami", "state"],
    accountName: "Insurance",
    accountCode: "5600",
    gstApplicable: false,
  },
  {
    keywords: ["office", "warehouse", "noel leeming", "pb tech"],
    accountName: "Office Expenses",
    accountCode: "5200",
    gstApplicable: true,
  },
  {
    keywords: ["uber eats", "doordash", "restaurant", "cafe", "lunch", "dinner"],
    accountName: "Meals & Entertainment",
    accountCode: "5800",
    gstApplicable: true,
  },
  {
    keywords: ["spotify", "netflix", "youtube", "apple music"],
    accountName: "Software & Subscriptions",
    accountCode: "5400",
    gstApplicable: true,
  },
  {
    keywords: ["countdown", "new world", "paknsave", "supermarket"],
    accountName: "Groceries",
    accountCode: "5900",
    gstApplicable: true,
  },
];

function keywordHeuristic(
  description: string,
  isExpense: boolean
): CategorySuggestion | null {
  if (!isExpense) return null;

  const lower = description.toLowerCase();

  for (const cat of KEYWORD_CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword)) {
        return {
          accountId: "", // Will need to be resolved against actual chart of accounts
          accountCode: cat.accountCode,
          accountName: cat.accountName,
          gstApplicable: cat.gstApplicable,
          confidence: 40,
          reason: `Keyword match: "${keyword}" → ${cat.accountName}`,
        };
      }
    }
  }

  return null;
}
