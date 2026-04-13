-- Migration: Fix critical database issues
-- Date: 2026-04-01
-- Issues:
-- 1. RLS policies using wrong auth check (FIXED in 0006)
-- 2. Gallery slug global uniqueness (multi-tenant collision)
-- 3. Duplicate automations schema definitions (FIXED in schema cleanup)

-- Fix: Convert gallery slug from global unique to composite unique (tenant_id, slug)
-- This allows multiple tenants to use the same slug (e.g., "wedding-2026")

ALTER TABLE galleries DROP CONSTRAINT IF EXISTS galleries_slug_unique;

CREATE UNIQUE INDEX IF NOT EXISTS galleries_tenant_slug_idx
  ON galleries(tenant_id, slug);
