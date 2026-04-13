-- Migration: Expand user roles + add project assignment
-- Date: 2026-04-05
--
-- Adds named staff roles beyond the binary admin/user split.
-- Adds assigned_consultant_id to projects so design consultants
-- only see work assigned to them.

-- ── Role check constraint ─────────────────────────────────────────────────────
-- The role column is plain TEXT — just update the check constraint.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'user', 'photographer', 'design_consultant', 'editor', 'customer_service'));

-- ── Project assignment ────────────────────────────────────────────────────────
-- Which design consultant is assigned to this project.
-- NULL = unassigned (admin sees all, unassigned projects appear in admin view).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS assigned_consultant_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_assigned_consultant_idx
  ON projects(assigned_consultant_id);
