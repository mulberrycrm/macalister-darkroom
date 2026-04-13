-- Migration: Double-entry accounting ledger foundation
-- Creates chart of accounts, journal entries, bank reconciliation, bank rules,
-- GST returns, expense claims tables + RPC functions + seed data

----------------------------------------------------------------------
-- 1. Chart of Accounts
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'tax')),
  sub_type TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  gst_applicable BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_tenant_code_idx ON accounts(tenant_id, code);
CREATE INDEX IF NOT EXISTS accounts_tenant_id_idx ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS accounts_tenant_type_idx ON accounts(tenant_id, type);

----------------------------------------------------------------------
-- 2. Journal Entries
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  date TIMESTAMPTZ NOT NULL,
  reference TEXT,
  description TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN (
    'invoice_payment', 'expense', 'bank_reconciliation', 'manual',
    'expense_claim', 'transfer', 'depreciation', 'gst_adjustment'
  )),
  source_id UUID,
  is_gst_cash_basis BOOLEAN NOT NULL DEFAULT false,
  gst_period TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversed_by UUID,
  is_reversed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS journal_entries_tenant_date_idx ON journal_entries(tenant_id, date);
CREATE INDEX IF NOT EXISTS journal_entries_source_idx ON journal_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS journal_entries_gst_period_idx ON journal_entries(tenant_id, gst_period);

----------------------------------------------------------------------
-- 3. Journal Lines
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  description TEXT,
  debit_cents INTEGER NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
  credit_cents INTEGER NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
  gst_amount_cents INTEGER NOT NULL DEFAULT 0,
  is_gst_exempt BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT journal_lines_one_side CHECK (
    (debit_cents > 0 AND credit_cents = 0) OR
    (credit_cents > 0 AND debit_cents = 0) OR
    (debit_cents = 0 AND credit_cents = 0)
  )
);

CREATE INDEX IF NOT EXISTS journal_lines_account_idx ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS journal_lines_entry_idx ON journal_lines(journal_entry_id);

----------------------------------------------------------------------
-- 4. Bank Reconciliations
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  status TEXT NOT NULL DEFAULT 'unreconciled' CHECK (status IN ('unreconciled', 'matched', 'reconciled', 'excluded')),
  matched_invoice_id UUID REFERENCES invoices(id),
  matched_account_id UUID REFERENCES accounts(id),
  matched_by TEXT CHECK (matched_by IN ('auto_invoice', 'auto_rule', 'auto_ai', 'manual')),
  confidence INTEGER,
  business_use_percent INTEGER NOT NULL DEFAULT 100,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMPTZ,
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_reconciliations_txn_idx ON bank_reconciliations(bank_transaction_id);
CREATE INDEX IF NOT EXISTS bank_reconciliations_tenant_status_idx ON bank_reconciliations(tenant_id, status);
CREATE INDEX IF NOT EXISTS bank_reconciliations_invoice_idx ON bank_reconciliations(matched_invoice_id);

----------------------------------------------------------------------
-- 5. Bank Rules
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  match_field TEXT NOT NULL CHECK (match_field IN ('description', 'particulars', 'reference', 'amount')),
  match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'equals', 'starts_with')),
  match_value TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  gst_applicable BOOLEAN NOT NULL DEFAULT true,
  is_transfer BOOLEAN NOT NULL DEFAULT false,
  transfer_account_id UUID REFERENCES accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_applied INTEGER NOT NULL DEFAULT 0,
  last_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bank_rules_tenant_active_idx ON bank_rules(tenant_id, is_active);

----------------------------------------------------------------------
-- 6. GST Returns
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gst_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  period TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'filed', 'amended')),
  total_sales_cents INTEGER NOT NULL DEFAULT 0,
  gst_on_sales_cents INTEGER NOT NULL DEFAULT 0,
  zero_rated_sales_cents INTEGER NOT NULL DEFAULT 0,
  adjustments_cents INTEGER NOT NULL DEFAULT 0,
  total_gst_collected_cents INTEGER NOT NULL DEFAULT 0,
  total_purchases_cents INTEGER NOT NULL DEFAULT 0,
  gst_on_purchases_cents INTEGER NOT NULL DEFAULT 0,
  credit_adjustments_cents INTEGER NOT NULL DEFAULT 0,
  total_gst_credits_cents INTEGER NOT NULL DEFAULT 0,
  gst_to_pay_cents INTEGER NOT NULL DEFAULT 0,
  filed_at TIMESTAMPTZ,
  filed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS gst_returns_tenant_period_idx ON gst_returns(tenant_id, period);

----------------------------------------------------------------------
-- 7. Expense Claims
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  gst_cents INTEGER NOT NULL DEFAULT 0,
  account_id UUID NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'reimbursed')),
  source_transaction_id TEXT,
  source_bank_transaction_id UUID REFERENCES bank_transactions(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  reimbursement_journal_id UUID REFERENCES journal_entries(id),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  reimbursed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS expense_claims_tenant_status_idx ON expense_claims(tenant_id, status);

----------------------------------------------------------------------
-- 8. RPC: Trial Balance
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_trial_balance(p_tenant_id uuid, p_as_of_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  debit_total bigint,
  credit_total bigint,
  balance bigint
) AS $$
  SELECT
    a.id,
    a.code,
    a.name,
    a.type,
    COALESCE(SUM(jl.debit_cents), 0)::bigint AS debit_total,
    COALESCE(SUM(jl.credit_cents), 0)::bigint AS credit_total,
    CASE
      WHEN a.type IN ('asset', 'expense', 'tax')
        THEN (COALESCE(SUM(jl.debit_cents), 0) - COALESCE(SUM(jl.credit_cents), 0))::bigint
      ELSE
        (COALESCE(SUM(jl.credit_cents), 0) - COALESCE(SUM(jl.debit_cents), 0))::bigint
    END AS balance
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
    AND je.tenant_id = p_tenant_id
    AND je.date <= p_as_of_date
    AND je.is_reversed = false
  WHERE a.tenant_id = p_tenant_id
    AND a.is_active = true
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code;
$$ LANGUAGE SQL STABLE;

----------------------------------------------------------------------
-- 9. RPC: GST Summary for a period
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_gst_summary(p_tenant_id uuid, p_period text)
RETURNS TABLE(
  total_sales_cents bigint,
  gst_on_sales_cents bigint,
  total_purchases_cents bigint,
  gst_on_purchases_cents bigint,
  gst_to_pay_cents bigint
) AS $$
  WITH period_entries AS (
    SELECT je.id
    FROM journal_entries je
    WHERE je.tenant_id = p_tenant_id
      AND je.gst_period = p_period
      AND je.is_reversed = false
  ),
  sales AS (
    -- Revenue account credits (income received)
    SELECT
      COALESCE(SUM(jl.credit_cents), 0)::bigint AS total_incl_gst,
      COALESCE(SUM(CASE WHEN NOT jl.is_gst_exempt THEN jl.gst_amount_cents ELSE 0 END), 0)::bigint AS gst
    FROM journal_lines jl
    JOIN period_entries pe ON pe.id = jl.journal_entry_id
    JOIN accounts a ON a.id = jl.account_id
    WHERE a.type = 'revenue'
      AND jl.credit_cents > 0
  ),
  purchases AS (
    -- Expense account debits (expenses paid)
    SELECT
      COALESCE(SUM(jl.debit_cents + jl.gst_amount_cents), 0)::bigint AS total_incl_gst,
      COALESCE(SUM(CASE WHEN NOT jl.is_gst_exempt THEN jl.gst_amount_cents ELSE 0 END), 0)::bigint AS gst
    FROM journal_lines jl
    JOIN period_entries pe ON pe.id = jl.journal_entry_id
    JOIN accounts a ON a.id = jl.account_id
    WHERE a.type IN ('expense', 'tax')
      AND jl.debit_cents > 0
  )
  SELECT
    s.total_incl_gst AS total_sales_cents,
    s.gst AS gst_on_sales_cents,
    p.total_incl_gst AS total_purchases_cents,
    p.gst AS gst_on_purchases_cents,
    (s.gst - p.gst)::bigint AS gst_to_pay_cents
  FROM sales s, purchases p;
$$ LANGUAGE SQL STABLE;

----------------------------------------------------------------------
-- 10. Seed Chart of Accounts (per tenant)
----------------------------------------------------------------------
INSERT INTO accounts (tenant_id, code, name, type, sub_type, description, is_system, gst_applicable)
SELECT t.id, v.code, v.name, v.type, v.sub_type, v.description, true, v.gst_applicable
FROM tenants t
CROSS JOIN (VALUES
  -- Assets (1xxx)
  ('1000', 'Business Cheque Account',    'asset',     'bank',        'Main business bank account',                    true),
  ('1001', 'Business Savings Account',   'asset',     'bank',        'Business savings',                              true),
  ('1100', 'Accounts Receivable',        'asset',     'receivable',  'Unpaid invoices',                               true),
  ('1200', 'GST Receivable',             'asset',     'tax',         'GST paid on expenses (claimed back from IRD)',   true),
  ('1300', 'Prepaid Expenses',           'asset',     NULL,          'Advance payments (insurance etc.)',              true),
  ('1350', 'Fixed Assets at Cost',       'asset',     'fixed',       'Camera gear, computers, vehicles',              true),
  ('1400', 'Accumulated Depreciation',   'asset',     'contra',      'Contra-asset (reduces fixed asset value)',       true),

  -- Liabilities (2xxx)
  ('2000', 'Accounts Payable',           'liability', 'payable',     'Bills to pay',                                  true),
  ('2100', 'GST Payable',               'liability', 'tax',         'GST collected on sales (owed to IRD)',           true),
  ('2200', 'PAYE Payable',              'liability', 'tax',         'PAYE on director salary (if applicable)',        false),
  ('2300', 'Income Tax Payable',         'liability', 'tax',         'Provisional tax / terminal tax',                false),
  ('2400', 'ACC Levy Payable',          'liability', NULL,          'ACC levies',                                    true),
  ('2500', 'Credit Card',               'liability', 'bank',        'Business credit card balance',                  true),

  -- Equity (3xxx)
  ('3000', 'Share Capital',              'equity',    NULL,          'Initial company investment',                    true),
  ('3100', 'Retained Earnings',          'equity',    NULL,          'Accumulated profits',                           true),
  ('3200', 'Shareholder Current Account','equity',    'sca',         'Money flowing between Rainer and the company',  true),
  ('3300', 'Drawings',                   'equity',    NULL,          'Distributions to shareholder',                  true),

  -- Revenue (4xxx)
  ('4000', 'Photography Income',         'revenue',   NULL,          'Wedding/portrait revenue',                      true),
  ('4010', 'Print Sales',               'revenue',   NULL,          'Album and print revenue',                       true),
  ('4020', 'Mini Session Income',        'revenue',   NULL,          'Mini session bookings',                         true),
  ('4050', 'Other Income',              'revenue',   NULL,          'Miscellaneous income',                          true),
  ('4100', 'Interest Income',           'revenue',   NULL,          'Bank interest',                                 false),
  ('4200', 'Gain on Asset Disposal',    'revenue',   NULL,          'Profit from selling gear',                      true),

  -- Expenses (5xxx)
  ('5000', 'Camera Equipment',           'expense',   NULL,          'Gear purchases',                                true),
  ('5010', 'Software & Subscriptions',   'expense',   NULL,          'Lightroom, hosting, etc.',                      true),
  ('5020', 'Insurance',                 'expense',   NULL,          'Professional indemnity, equipment',             false),
  ('5030', 'Vehicle Expenses',          'expense',   NULL,          'Fuel, maintenance, registration',               true),
  ('5040', 'Travel & Accommodation',    'expense',   NULL,          'Out-of-town shoots',                            true),
  ('5050', 'Marketing & Advertising',   'expense',   NULL,          'Website, social media, ads',                    true),
  ('5060', 'Office & Supplies',         'expense',   NULL,          'Stationery, printer ink',                       true),
  ('5070', 'Subcontractors',            'expense',   NULL,          'Second shooters, assistants',                   true),
  ('5080', 'Professional Development',  'expense',   NULL,          'Workshops, courses',                            true),
  ('5090', 'Accounting & Legal',        'expense',   NULL,          'Accountant fees',                               true),
  ('5100', 'Bank Fees',                 'expense',   NULL,          'Transaction fees',                              false),
  ('5110', 'Client Entertainment',      'expense',   NULL,          'Client meetings',                               true),
  ('5120', 'Communication',             'expense',   NULL,          'Phone, internet (business %)',                   true),
  ('5130', 'Rent / Home Office',        'expense',   NULL,          'Office space or home office %',                  true),
  ('5140', 'Printing & Albums',         'expense',   NULL,          'Lab costs, album production',                   true),
  ('5150', 'Depreciation',             'expense',   NULL,          'Annual depreciation charge',                    true),
  ('5160', 'Loss on Asset Disposal',    'expense',   NULL,          'Loss from selling gear below book value',       true),
  ('5900', 'Other Expenses',           'expense',   NULL,          'Miscellaneous',                                 true),

  -- Tax (6xxx)
  ('6000', 'Income Tax Expense',        'tax',       NULL,          'Company tax (28%)',                             false),
  ('6100', 'ACC Levies',               'tax',       NULL,          'ACC',                                           false)
) AS v(code, name, type, sub_type, description, gst_applicable)
WHERE NOT EXISTS (
  SELECT 1 FROM accounts a WHERE a.tenant_id = t.id AND a.code = v.code
);
