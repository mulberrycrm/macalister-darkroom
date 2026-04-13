-- Create accounting schema tables for bank transaction tracking and payment matching

CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  akahu_transaction_id text NOT NULL UNIQUE,
  date date NOT NULL,
  amount integer NOT NULL,
  description text NOT NULL,
  particulars text,
  code text,
  reference text,
  account_id text NOT NULL,
  account_number text,
  balance integer,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX bank_transactions_tenant_id_idx ON bank_transactions(tenant_id);
CREATE INDEX bank_transactions_date_idx ON bank_transactions(date);
CREATE INDEX bank_transactions_akahu_id_idx ON bank_transactions(akahu_transaction_id);
CREATE INDEX bank_transactions_reference_idx ON bank_transactions(particulars, reference);

CREATE TABLE IF NOT EXISTS transaction_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bank_transaction_id uuid NOT NULL REFERENCES bank_transactions(id),
  invoice_id uuid REFERENCES invoices(id),
  order_id uuid REFERENCES orders(id),
  matched_amount integer NOT NULL,
  match_method text NOT NULL CHECK (match_method IN ('auto_invoice_number', 'auto_reference', 'auto_amount', 'manual')),
  confidence integer DEFAULT 100,
  is_confirmed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone
);

CREATE INDEX transaction_matches_tenant_id_idx ON transaction_matches(tenant_id);
CREATE INDEX transaction_matches_bank_transaction_id_idx ON transaction_matches(bank_transaction_id);
CREATE INDEX transaction_matches_invoice_id_idx ON transaction_matches(invoice_id);

CREATE TABLE IF NOT EXISTS akahu_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_token text NOT NULL,
  akahu_account_id text NOT NULL UNIQUE,
  account_name text,
  account_type text,
  account_number text,
  last_sync_at timestamp with time zone,
  next_sync_at timestamp with time zone,
  last_sync_status text DEFAULT 'pending' CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_error text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX akahu_accounts_tenant_id_idx ON akahu_accounts(tenant_id);
CREATE INDEX akahu_accounts_akahu_account_id_idx ON akahu_accounts(akahu_account_id);

COMMENT ON TABLE bank_transactions IS 'Bank transactions imported from Akahu API';
COMMENT ON TABLE transaction_matches IS 'Links between bank transactions and invoices for payment matching';
COMMENT ON TABLE akahu_accounts IS 'Akahu account credentials and sync status';
