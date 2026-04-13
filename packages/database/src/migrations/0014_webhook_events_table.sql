-- Add webhook_events table for idempotency tracking
-- Prevents duplicate processing of webhook events (Stripe retries, etc.)

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('stripe', 'smtp2go', 'facebook', 'sms', 'custom')),
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS webhook_events_event_id_type_idx
  ON webhook_events(event_id, type);

CREATE INDEX IF NOT EXISTS webhook_events_is_processed_idx
  ON webhook_events(is_processed);

CREATE INDEX IF NOT EXISTS webhook_events_received_at_idx
  ON webhook_events(received_at);
