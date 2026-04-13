import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Account balance queries and financial report data.
 * Uses RPC functions for server-side aggregation.
 */

export interface TrialBalanceRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_total: number;
  credit_total: number;
  balance: number;
}

export interface GstSummary {
  total_sales_cents: number;
  gst_on_sales_cents: number;
  total_purchases_cents: number;
  gst_on_purchases_cents: number;
  gst_to_pay_cents: number;
}

export interface ProfitAndLoss {
  period: { startDate: string; endDate: string };
  revenue: TrialBalanceRow[];
  expenses: TrialBalanceRow[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: TrialBalanceRow[];
  liabilities: TrialBalanceRow[];
  equity: TrialBalanceRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

/**
 * Get trial balance — all accounts with their debit/credit totals and net balance.
 * Uses the `get_trial_balance` RPC function for server-side aggregation.
 */
export async function getTrialBalance(
  supabase: SupabaseClient,
  tenantId: string,
  asOfDate?: string
): Promise<TrialBalanceRow[]> {
  const { data, error } = await supabase.rpc("get_trial_balance", {
    p_tenant_id: tenantId,
    p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
  });

  if (error) throw new Error(`Failed to get trial balance: ${error.message}`);
  return (data || []) as TrialBalanceRow[];
}

/**
 * Get GST summary for a period — calculates GST101A box values.
 * Uses the `get_gst_summary` RPC function.
 */
export async function getGstSummary(
  supabase: SupabaseClient,
  tenantId: string,
  period: string
): Promise<GstSummary> {
  const { data, error } = await supabase.rpc("get_gst_summary", {
    p_tenant_id: tenantId,
    p_period: period,
  });

  if (error) throw new Error(`Failed to get GST summary: ${error.message}`);

  // RPC returns an array, take the first row
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      total_sales_cents: 0,
      gst_on_sales_cents: 0,
      total_purchases_cents: 0,
      gst_on_purchases_cents: 0,
      gst_to_pay_cents: 0,
    };
  }
  return row as GstSummary;
}

/**
 * Generate Profit & Loss report for a date range.
 * Queries revenue and expense account balances for the period.
 */
export async function getProfitAndLoss(
  supabase: SupabaseClient,
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<ProfitAndLoss> {
  // Get all journal lines for the period, grouped by account
  const { data, error } = await supabase
    .from("journal_lines")
    .select(`
      account_id,
      debit_cents,
      credit_cents,
      journal_entries!inner(tenant_id, date, is_reversed),
      accounts!inner(id, code, name, type)
    `)
    .eq("journal_entries.tenant_id", tenantId)
    .eq("journal_entries.is_reversed", false)
    .gte("journal_entries.date", startDate)
    .lte("journal_entries.date", endDate);

  if (error) throw new Error(`Failed to get P&L data: ${error.message}`);

  // Aggregate by account
  const accountTotals = new Map<string, { account: TrialBalanceRow; debits: number; credits: number }>();

  for (const line of data || []) {
    const acc = (line as Record<string, unknown>).accounts as { id: string; code: string; name: string; type: string };
    const key = acc.id;
    if (!accountTotals.has(key)) {
      accountTotals.set(key, {
        account: {
          account_id: acc.id,
          account_code: acc.code,
          account_name: acc.name,
          account_type: acc.type,
          debit_total: 0,
          credit_total: 0,
          balance: 0,
        },
        debits: 0,
        credits: 0,
      });
    }
    const entry = accountTotals.get(key)!;
    entry.debits += line.debit_cents;
    entry.credits += line.credit_cents;
  }

  const revenue: TrialBalanceRow[] = [];
  const expenses: TrialBalanceRow[] = [];

  for (const [, { account, debits, credits }] of accountTotals) {
    if (account.account_type === "revenue") {
      account.debit_total = debits;
      account.credit_total = credits;
      account.balance = credits - debits; // revenue normal balance is credit
      revenue.push(account);
    } else if (account.account_type === "expense" || account.account_type === "tax") {
      account.debit_total = debits;
      account.credit_total = credits;
      account.balance = debits - credits; // expense normal balance is debit
      expenses.push(account);
    }
  }

  revenue.sort((a, b) => a.account_code.localeCompare(b.account_code));
  expenses.sort((a, b) => a.account_code.localeCompare(b.account_code));

  const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.balance, 0);

  return {
    period: { startDate, endDate },
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

/**
 * Generate Balance Sheet as of a date.
 * Queries asset, liability, and equity account balances.
 */
export async function getBalanceSheet(
  supabase: SupabaseClient,
  tenantId: string,
  asOfDate?: string
): Promise<BalanceSheet> {
  const trialBalance = await getTrialBalance(supabase, tenantId, asOfDate);

  const assets = trialBalance.filter((r) => r.account_type === "asset");
  const liabilities = trialBalance.filter((r) => r.account_type === "liability");
  const equity = trialBalance.filter((r) => r.account_type === "equity");

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
  const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);

  return {
    asOfDate: asOfDate || new Date().toISOString().split("T")[0],
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
  };
}

/**
 * Aged Receivables report structures
 */
export interface AgedReceivable {
  invoiceId: string;
  invoiceNumber: string;
  contactName: string;
  issuedDate: string;
  dueDate: string;
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  daysOverdue: number;
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
}

export interface AgedReceivablesSummary {
  items: AgedReceivable[];
  buckets: {
    current: number;
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
  };
  totalOutstanding: number;
}

/**
 * Get aged receivables — outstanding invoices grouped by age.
 * Queries unpaid and partially-paid invoices, calculates days overdue.
 */
export async function getAgedReceivables(
  supabase: SupabaseClient,
  tenantId: string,
  asOfDate?: string
): Promise<AgedReceivablesSummary> {
  const asOf = asOfDate || new Date().toISOString().split("T")[0];

  // Query unpaid/partially paid invoices
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      contact_id,
      issue_date,
      due_date,
      total_cents,
      status,
      contacts!inner(known_as, organisation)
    `
    )
    .eq("tenant_id", tenantId)
    .in("status", ["draft", "sent", "overdue"])
    .lte("issue_date", asOf)
    .order("due_date", { ascending: false });

  if (error) throw error;
  if (!invoices || invoices.length === 0) {
    return {
      items: [],
      buckets: { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
      totalOutstanding: 0,
    };
  }

  // Get matched payments for these invoices
  const invoiceIds = invoices.map((i: any) => i.id);
  const { data: matches } = await supabase
    .from("transaction_matches")
    .select("invoice_id, matched_amount")
    .in("invoice_id", invoiceIds);

  const paymentsByInvoice = new Map<string, number>();
  for (const m of matches || []) {
    paymentsByInvoice.set(
      m.invoice_id,
      (paymentsByInvoice.get(m.invoice_id) || 0) + m.matched_amount
    );
  }

  const today = new Date(asOf);
  const items: AgedReceivable[] = [];
  const buckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

  for (const inv of invoices) {
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const outstanding = inv.total_cents - paid;

    // Skip fully paid invoices
    if (outstanding <= 0) continue;

    const dueDate = new Date(inv.due_date || inv.issue_date);
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / 86400000)
    );

    let bucket: AgedReceivable["bucket"];
    if (daysOverdue === 0) bucket = "current";
    else if (daysOverdue <= 30) bucket = "1-30";
    else if (daysOverdue <= 60) bucket = "31-60";
    else if (daysOverdue <= 90) bucket = "61-90";
    else bucket = "90+";

    const contact = inv.contacts as any;
    const contactName =
      contact?.organisation ||
      contact?.known_as ||
      "Unknown";

    items.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoice_number,
      contactName,
      issuedDate: inv.issue_date,
      dueDate: inv.due_date || inv.issue_date,
      totalCents: inv.total_cents,
      paidCents: paid,
      outstandingCents: outstanding,
      daysOverdue,
      bucket,
    });

    buckets[bucket] += outstanding;
  }

  items.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    items,
    buckets,
    totalOutstanding: Object.values(buckets).reduce((a, b) => a + b, 0),
  };
}

/**
 * Cash Flow Statement structures
 */
export interface CashFlowItem {
  name: string;
  amountCents: number;
}

export interface CashFlowSection {
  items: CashFlowItem[];
  total: number;
}

export interface CashFlowStatement {
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

/**
 * Generate Cash Flow Statement for a date range.
 * Categorizes journal entries into operating, investing, and financing activities.
 */
export async function getCashFlowStatement(
  supabase: SupabaseClient,
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<CashFlowStatement> {
  // Get all journal entries for the period with their lines and account info
  const { data: entries, error } = await supabase
    .from("journal_lines")
    .select(
      `
      debit_cents,
      credit_cents,
      accounts!inner(id, code, name, type, sub_type),
      journal_entries!inner(tenant_id, date, is_reversed)
    `
    )
    .eq("journal_entries.tenant_id", tenantId)
    .eq("journal_entries.is_reversed", false)
    .gte("journal_entries.date", startDate)
    .lte("journal_entries.date", endDate);

  if (error) throw new Error(`Failed to get cash flow data: ${error.message}`);

  // Categorize by cash flow type based on account type/sub_type
  const operating: Map<string, number> = new Map();
  const investing: Map<string, number> = new Map();
  const financing: Map<string, number> = new Map();

  for (const line of entries || []) {
    const account = (line as Record<string, unknown>).accounts as {
      id: string;
      code: string;
      name: string;
      type: string;
      sub_type: string | null;
    };
    const net = (line.debit_cents || 0) - (line.credit_cents || 0);
    const name = account.name;
    const type = account.type;
    const subType = account.sub_type || "";

    // Categorize activities
    if (type === "revenue" || type === "expense" || type === "tax") {
      // Operating activities
      operating.set(name, (operating.get(name) || 0) + net);
    } else if (subType === "fixed_asset" || subType === "depreciation") {
      // Investing activities
      investing.set(name, (investing.get(name) || 0) + net);
    } else if (type === "equity" || subType === "loan" || subType === "sca") {
      // Financing activities
      financing.set(name, (financing.get(name) || 0) + net);
    }
  }

  const mapToItems = (m: Map<string, number>): CashFlowItem[] =>
    Array.from(m.entries())
      .filter(([, v]) => v !== 0)
      .map(([name, amountCents]) => ({ name, amountCents }))
      .sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents));

  const opItems = mapToItems(operating);
  const invItems = mapToItems(investing);
  const finItems = mapToItems(financing);
  const opTotal = opItems.reduce((s, i) => s + i.amountCents, 0);
  const invTotal = invItems.reduce((s, i) => s + i.amountCents, 0);
  const finTotal = finItems.reduce((s, i) => s + i.amountCents, 0);

  // Get bank account balance at start of period for opening balance
  const { data: bankAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("sub_type", "bank");

  let openingBalance = 0;
  if (bankAccounts && bankAccounts.length > 0) {
    const bankIds = bankAccounts.map((a: any) => a.id);
    const { data: priorLines } = await supabase
      .from("journal_lines")
      .select("debit_cents, credit_cents, account_id, journal_entries!inner(is_reversed)")
      .in("account_id", bankIds)
      .eq("journal_entries.is_reversed", false)
      .lt("journal_entries.date", startDate);

    for (const l of priorLines || []) {
      openingBalance += (l.debit_cents || 0) - (l.credit_cents || 0);
    }
  }

  const netCashFlow = opTotal + invTotal + finTotal;

  return {
    operating: { items: opItems, total: opTotal },
    investing: { items: invItems, total: invTotal },
    financing: { items: finItems, total: finTotal },
    netCashFlow,
    openingBalance,
    closingBalance: openingBalance + netCashFlow,
  };
}
