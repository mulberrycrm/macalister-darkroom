-- Add status column to email_templates (draft/active/archived)
ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
