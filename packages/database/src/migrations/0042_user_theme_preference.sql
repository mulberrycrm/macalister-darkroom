-- Migration: Add theme_preference to users table
-- Date: 2026-04-08
-- Per-user theme persistence (dark/light)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'dark'
    CHECK (theme_preference IN ('dark', 'light'));
