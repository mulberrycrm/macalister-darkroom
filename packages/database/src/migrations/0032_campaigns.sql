-- Email marketing campaigns
CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "name" text NOT NULL,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "body_text" text,
  "segment_filter" jsonb NOT NULL DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'draft',
  "scheduled_for" timestamp with time zone,
  "sent_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns" USING btree ("tenant_id");
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");

-- Individual send records per contact per campaign
CREATE TABLE "campaign_sends" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
  "message_id" uuid REFERENCES "messages"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'queued',
  "sent_at" timestamp with time zone,
  "opened_at" timestamp with time zone,
  "clicked_at" timestamp with time zone,
  UNIQUE ("campaign_id", "contact_id")
);

CREATE INDEX "campaign_sends_campaign_id_idx" ON "campaign_sends" USING btree ("campaign_id");
CREATE INDEX "campaign_sends_contact_id_idx" ON "campaign_sends" USING btree ("contact_id");
CREATE INDEX "campaign_sends_status_idx" ON "campaign_sends" USING btree ("status");

-- Add send_campaign_batch to job_queue type enum (text column, no actual enum to alter)
