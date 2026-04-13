-- Create table for tracking idempotent payment operations
-- Prevents duplicate charges when the same request is sent multiple times
CREATE TABLE payment_idempotency_cache (
  idempotency_key TEXT PRIMARY KEY,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '24 hours'
);

-- Index for cleanup of expired entries
CREATE INDEX payment_idempotency_expires ON payment_idempotency_cache(expires_at);

-- Add comment for clarity
COMMENT ON TABLE payment_idempotency_cache IS 'Tracks processed idempotency keys for payment operations. Entries expire after 24 hours to allow key reuse for legitimate retries.';
COMMENT ON COLUMN payment_idempotency_cache.idempotency_key IS 'Unique idempotency key (typically instalment_id) to prevent duplicate processing';
COMMENT ON COLUMN payment_idempotency_cache.response_data IS 'Cached response from the original request to return on retries';
