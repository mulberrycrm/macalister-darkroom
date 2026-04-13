-- Migration: Editor workflow — expand editor_jobs for multi-stage editing
-- Date: 2026-04-08
--
-- Adds job_type, genre, assignment/claim tracking, time tracking,
-- and cost snapshot columns to editor_jobs.
-- Adds "editing_job_available" to notifications type check.

-- ── New columns on editor_jobs ──────────────────────────────────────────────

ALTER TABLE editor_jobs
  ADD COLUMN IF NOT EXISTS job_type TEXT NOT NULL DEFAULT 'initial_edit'
    CHECK (job_type IN (
      'initial_edit', 'final_retouch',
      'sneak_peek_selection', 'sneak_peek_edit', 'culling', 'full_edit'
    )),
  ADD COLUMN IF NOT EXISTS genre TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS minutes_worked INTEGER,
  ADD COLUMN IF NOT EXISTS hourly_rate_cents INTEGER;

CREATE INDEX IF NOT EXISTS editor_jobs_assigned_to_idx ON editor_jobs(assigned_to);
CREATE INDEX IF NOT EXISTS editor_jobs_status_idx ON editor_jobs(status);
CREATE INDEX IF NOT EXISTS editor_jobs_job_type_idx ON editor_jobs(job_type);

-- ── Time tracking tables ────────────────────────────────────────────────────
-- Replaces Jibble: editor starts/stops a timer against one or more jobs.
-- When a timer covers multiple jobs, time is split proportionally.

CREATE TABLE IF NOT EXISTS editor_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS editor_time_entries_tenant_id_idx ON editor_time_entries(tenant_id);
CREATE INDEX IF NOT EXISTS editor_time_entries_user_id_idx ON editor_time_entries(user_id);

CREATE TABLE IF NOT EXISTS editor_time_entry_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES editor_time_entries(id) ON DELETE CASCADE,
  editor_job_id UUID NOT NULL REFERENCES editor_jobs(id) ON DELETE CASCADE,
  allocated_minutes INTEGER
);

CREATE INDEX IF NOT EXISTS editor_time_entry_jobs_time_entry_idx ON editor_time_entry_jobs(time_entry_id);
CREATE INDEX IF NOT EXISTS editor_time_entry_jobs_job_idx ON editor_time_entry_jobs(editor_job_id);

-- ── Expand notifications type constraint ────────────────────────────────────

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'payment_received', 'payment_failed', 'new_lead', 'new_message',
    'follow_up_reminder', 'delivery_failure', 'system_alert',
    'editing_job_available'
  ));
