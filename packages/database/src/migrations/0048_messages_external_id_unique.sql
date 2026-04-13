-- Prevent duplicate inbound messages from webhook retries (e.g. SMS Gate)
-- Partial unique index: only enforced where external_id is not null
-- NULLs are excluded so old messages without external_id are unaffected
CREATE UNIQUE INDEX IF NOT EXISTS "messages_external_id_unique_idx"
  ON "messages" ("external_id")
  WHERE "external_id" IS NOT NULL;

-- Prevent duplicate inbound emails from Mailgun webhook retries
-- Partial unique index: only enforced where message_id_header is not null
CREATE UNIQUE INDEX IF NOT EXISTS "messages_message_id_header_unique_idx"
  ON "messages" ("message_id_header")
  WHERE "message_id_header" IS NOT NULL;
