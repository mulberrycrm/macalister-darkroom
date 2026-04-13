-- Migration: Add Row-Level Security (RLS) policies for tenant isolation
-- Date: 2026-04-01
-- Purpose: Strengthen defense-in-depth security by enforcing tenant isolation at the database level
-- This complements application-level tenant_id validation with database-level access control
--
-- Tables covered:
-- 1. messages - prevent users from reading/writing messages for other tenants
-- 2. contacts - prevent users from accessing contacts from other tenants
-- 3. orders - prevent users from accessing orders from other tenants
-- 4. projects - prevent users from accessing projects from other tenants
--
-- Note: Each policy uses a composite check via joining to contacts table
-- This ensures multi-tenant isolation even if there are bugs in application code

-- ============================================================================
-- MESSAGES TABLE RLS
-- ============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages: Users can only access messages for contacts in their tenant
CREATE POLICY messages_tenant_isolation
  ON messages FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- CONTACTS TABLE RLS
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can only access contacts in their tenant
CREATE POLICY contacts_tenant_isolation
  ON contacts FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- ORDERS TABLE RLS
-- ============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders: Users can only access orders for projects in their tenant
CREATE POLICY orders_tenant_isolation
  ON orders FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- PROJECTS TABLE RLS
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access projects in their tenant
CREATE POLICY projects_tenant_isolation
  ON projects FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- SUPPORTING TABLES RLS
-- ============================================================================

-- Note: These tables may already have RLS policies from schema creation.
-- If they don't, the policies below provide defense-in-depth protection.

ALTER TABLE contact_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_people_tenant_isolation
  ON contact_people FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify RLS is enabled and working:
--   SELECT schemaname, tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('messages', 'contacts', 'orders', 'projects', 'contact_people');
--
-- Expected output: All tables should show rowsecurity = true
-- ============================================================================
