-- Add scheduled_send_at column to messages table for tracking when a message should be sent
ALTER TABLE "messages" ADD COLUMN "scheduled_send_at" timestamp with time zone;
--> statement-breakpoint
-- Add index for efficient querying of scheduled messages
CREATE INDEX "idx_messages_scheduled_send_at" ON "messages" ("scheduled_send_at") WHERE "scheduled_send_at" IS NOT NULL;
