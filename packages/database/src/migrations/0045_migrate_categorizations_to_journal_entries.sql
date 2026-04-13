-- Migration: Convert existing transaction categorizations (from 1 Apr 2025)
-- into double-entry journal entries as expense claims via SCA.
--
-- Only migrates personal account transactions marked as business expenses (is_personal = false).
-- These are expenses paid from personal funds — they go through the SCA.
--
-- Journal entry per categorized transaction:
--   DR Expense Account      (ex-GST, adjusted for deduction_percent)
--   DR GST Receivable 1200  (GST component, adjusted for deduction_percent)
--   CR SCA 3200             (full amount)
--
-- This migration is idempotent: checks for existing journal entries with source_type='expense_claim'.

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_sca_id UUID;
  v_gst_recv_id UUID;
  v_default_expense_id UUID;
  v_rec RECORD;
  v_account_id UUID;
  v_je_id UUID;
  v_amount_cents INTEGER;
  v_deduction_pct NUMERIC;
  v_gst_cents INTEGER;
  v_ex_gst_cents INTEGER;
  v_claimable_expense INTEGER;
  v_claimable_gst INTEGER;
  v_total_claimed INTEGER;
  v_date TIMESTAMPTZ;
  v_gst_period TEXT;
  v_migrated INTEGER := 0;
  v_category_name TEXT;
BEGIN
  -- Get the first tenant (single-tenant system)
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'No tenants found, skipping migration';
    RETURN;
  END IF;

  -- Get the first admin user
  SELECT id INTO v_user_id FROM users WHERE tenant_id = v_tenant_id LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found, skipping migration';
    RETURN;
  END IF;

  -- Check if migration already ran
  IF EXISTS (
    SELECT 1 FROM journal_entries
    WHERE tenant_id = v_tenant_id AND source_type = 'expense_claim'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Migration already completed, skipping';
    RETURN;
  END IF;

  -- Look up required accounts
  SELECT id INTO v_sca_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '3200';
  SELECT id INTO v_gst_recv_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '1200';
  SELECT id INTO v_default_expense_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5900';

  IF v_sca_id IS NULL OR v_gst_recv_id IS NULL OR v_default_expense_id IS NULL THEN
    RAISE NOTICE 'Required accounts not found (3200, 1200, 5900). Seed chart of accounts first.';
    RETURN;
  END IF;

  -- Process each categorized personal business expense from 1 Apr 2025
  FOR v_rec IN
    SELECT
      tc.id AS cat_id,
      tc.bank_transaction_id,
      tc.expense_category_id,
      tc.deduction_percent,
      tc.notes,
      bt.date,
      bt.amount,
      bt.description,
      bt.akahu_transaction_id,
      ec.name AS category_name,
      ec.tax_code
    FROM transaction_categorizations tc
    JOIN bank_transactions bt ON bt.id = tc.bank_transaction_id
    LEFT JOIN expense_categories ec ON ec.id = tc.expense_category_id
    WHERE tc.tenant_id = v_tenant_id
      AND tc.account_type = 'personal'
      AND tc.is_personal = false  -- business expense to claim
      AND bt.date >= '2025-04-01'
    ORDER BY bt.date ASC
  LOOP
    -- Map category name to chart of accounts code
    v_category_name := LOWER(COALESCE(v_rec.category_name, ''));
    v_account_id := v_default_expense_id; -- default to 5900 Other Expenses

    -- Simple keyword mapping
    IF v_category_name LIKE '%camera%' OR v_category_name LIKE '%equipment%' OR v_category_name LIKE '%hardware%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5000';
    ELSIF v_category_name LIKE '%software%' OR v_category_name LIKE '%subscription%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5010';
    ELSIF v_category_name LIKE '%insurance%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5020';
    ELSIF v_category_name LIKE '%vehicle%' OR v_category_name LIKE '%fuel%' OR v_category_name LIKE '%petrol%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5030';
    ELSIF v_category_name LIKE '%travel%' OR v_category_name LIKE '%accommodation%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5040';
    ELSIF v_category_name LIKE '%marketing%' OR v_category_name LIKE '%advertising%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5050';
    ELSIF v_category_name LIKE '%office%' OR v_category_name LIKE '%supplies%' OR v_category_name LIKE '%stationery%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5060';
    ELSIF v_category_name LIKE '%subcontract%' OR v_category_name LIKE '%contractor%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5070';
    ELSIF v_category_name LIKE '%training%' OR v_category_name LIKE '%professional dev%' OR v_category_name LIKE '%course%' OR v_category_name LIKE '%workshop%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5080';
    ELSIF v_category_name LIKE '%accounting%' OR v_category_name LIKE '%legal%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5090';
    ELSIF v_category_name LIKE '%bank%' OR v_category_name LIKE '%fee%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5100';
    ELSIF v_category_name LIKE '%entertainment%' OR v_category_name LIKE '%client%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5110';
    ELSIF v_category_name LIKE '%phone%' OR v_category_name LIKE '%internet%' OR v_category_name LIKE '%communication%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5120';
    ELSIF v_category_name LIKE '%rent%' OR v_category_name LIKE '%home office%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5130';
    ELSIF v_category_name LIKE '%print%' OR v_category_name LIKE '%album%' THEN
      SELECT id INTO v_account_id FROM accounts WHERE tenant_id = v_tenant_id AND code = '5140';
    END IF;

    -- Use the default if lookup failed
    IF v_account_id IS NULL THEN
      v_account_id := v_default_expense_id;
    END IF;

    -- Calculate amounts
    v_amount_cents := ABS(v_rec.amount);
    v_deduction_pct := COALESCE(v_rec.deduction_percent, 100)::NUMERIC / 100;

    -- Check GST applicability for the target account
    DECLARE
      v_gst_applicable BOOLEAN;
    BEGIN
      SELECT gst_applicable INTO v_gst_applicable FROM accounts WHERE id = v_account_id;

      IF v_gst_applicable THEN
        v_gst_cents := ROUND(v_amount_cents * 3.0 / 23);
        v_ex_gst_cents := v_amount_cents - v_gst_cents;
        v_claimable_expense := ROUND(v_ex_gst_cents * v_deduction_pct);
        v_claimable_gst := ROUND(v_gst_cents * v_deduction_pct);
      ELSE
        v_gst_cents := 0;
        v_ex_gst_cents := v_amount_cents;
        v_claimable_expense := ROUND(v_amount_cents * v_deduction_pct);
        v_claimable_gst := 0;
      END IF;

      v_total_claimed := v_claimable_expense + v_claimable_gst;
    END;

    v_date := v_rec.date;
    v_gst_period := TO_CHAR(v_date, 'YYYY-MM');

    -- Create journal entry
    INSERT INTO journal_entries (
      tenant_id, date, reference, description, source_type, source_id,
      is_gst_cash_basis, gst_period, created_by
    ) VALUES (
      v_tenant_id, v_date, 'EC-MIGRATED',
      'Expense claim (migrated): ' || v_rec.description,
      'expense_claim', v_rec.cat_id,
      true, v_gst_period, v_user_id
    ) RETURNING id INTO v_je_id;

    -- Journal lines: DR Expense, DR GST Receivable (if applicable), CR SCA
    IF v_claimable_gst > 0 THEN
      -- With GST
      INSERT INTO journal_lines (journal_entry_id, account_id, description, debit_cents, credit_cents, gst_amount_cents, is_gst_exempt) VALUES
        (v_je_id, v_account_id, v_rec.description, v_claimable_expense, 0, 0, false),
        (v_je_id, v_gst_recv_id, 'GST on ' || v_rec.description, v_claimable_gst, 0, v_claimable_gst, false),
        (v_je_id, v_sca_id, 'Expense claim', 0, v_total_claimed, 0, true);
    ELSE
      -- No GST
      INSERT INTO journal_lines (journal_entry_id, account_id, description, debit_cents, credit_cents, gst_amount_cents, is_gst_exempt) VALUES
        (v_je_id, v_account_id, v_rec.description, v_claimable_expense, 0, 0, true),
        (v_je_id, v_sca_id, 'Expense claim', 0, v_claimable_expense, 0, true);
    END IF;

    -- Create expense claim record
    INSERT INTO expense_claims (
      tenant_id, date, description, amount_cents, gst_cents, account_id,
      status, source_transaction_id, source_bank_transaction_id,
      journal_entry_id, notes
    ) VALUES (
      v_tenant_id, v_date, v_rec.description, v_amount_cents, v_claimable_gst,
      v_account_id, 'approved', v_rec.akahu_transaction_id,
      v_rec.bank_transaction_id, v_je_id,
      COALESCE(v_rec.notes, 'Migrated from transaction categorization')
    );

    -- Create bank reconciliation record
    INSERT INTO bank_reconciliations (
      tenant_id, bank_transaction_id, journal_entry_id, status,
      matched_account_id, matched_by, confidence, business_use_percent,
      reconciled_by, reconciled_at
    ) VALUES (
      v_tenant_id, v_rec.bank_transaction_id, v_je_id, 'reconciled',
      v_account_id, 'manual', 100, COALESCE(v_rec.deduction_percent, 100),
      v_user_id, NOW()
    )
    ON CONFLICT (bank_transaction_id) DO NOTHING;

    v_migrated := v_migrated + 1;
  END LOOP;

  RAISE NOTICE 'Migration complete: % transactions migrated to journal entries', v_migrated;
END $$;
