-- Add transcript and recording columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS transcript jsonb,
  ADD COLUMN IF NOT EXISTS recording_url text;
