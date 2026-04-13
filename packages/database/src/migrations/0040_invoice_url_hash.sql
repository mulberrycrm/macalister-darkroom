-- Add url_hash column to invoices for secure public access
-- url_hash is a 64-char random string that acts as the access token for /pay/[hash]

ALTER TABLE invoices ADD COLUMN url_hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Create index for fast lookups by url_hash
CREATE INDEX invoices_url_hash_idx ON invoices(url_hash);

-- Drop the default now that all rows are populated
ALTER TABLE invoices ALTER COLUMN url_hash DROP DEFAULT;
