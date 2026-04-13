-- Add call_metadata JSONB column to messages table for phone call data
-- Stores: callSid, callStatus, duration, fromNumber, toNumber, callType, transcript, notes
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "call_metadata" jsonb;

-- Add summarise_call task type to claude_tasks
-- (Drizzle schema enum updated, but the DB text column accepts any value)

-- Index for looking up messages by callSid within call_metadata
CREATE INDEX IF NOT EXISTS "messages_call_metadata_call_sid_idx"
  ON "messages" ((call_metadata->>'callSid'))
  WHERE "call_metadata" IS NOT NULL;
