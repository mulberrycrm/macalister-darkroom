-- Migration: Enhance RLS policies with explicit INSERT/UPDATE checks
-- Date: 2026-04-01
-- Purpose: Add WITH CHECK clauses for INSERT and UPDATE operations on RLS policies
-- This ensures users can only create/modify records for their own tenant

-- ============================================================================
-- MESSAGES TABLE - Add explicit INSERT/UPDATE checks
-- ============================================================================

-- Drop existing policy and recreate with WITH CHECK clause
DROP POLICY IF EXISTS messages_tenant_isolation ON messages;

CREATE POLICY messages_tenant_isolation
  ON messages FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- CONTACTS TABLE - Add explicit INSERT/UPDATE checks
-- ============================================================================

DROP POLICY IF EXISTS contacts_tenant_isolation ON contacts;

CREATE POLICY contacts_tenant_isolation
  ON contacts FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- ORDERS TABLE - Add explicit INSERT/UPDATE checks
-- ============================================================================

DROP POLICY IF EXISTS orders_tenant_isolation ON orders;

CREATE POLICY orders_tenant_isolation
  ON orders FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- PROJECTS TABLE - Add explicit INSERT/UPDATE checks
-- ============================================================================

DROP POLICY IF EXISTS projects_tenant_isolation ON projects;

CREATE POLICY projects_tenant_isolation
  ON projects FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================================
-- CONTACT PEOPLE TABLE - Add explicit INSERT/UPDATE checks
-- ============================================================================

DROP POLICY IF EXISTS contact_people_tenant_isolation ON contact_people;

CREATE POLICY contact_people_tenant_isolation
  ON contact_people FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts
      WHERE tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify RLS is properly configured:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('messages', 'contacts', 'orders', 'projects', 'contact_people');
--
-- Expected: All tables should show rowsecurity = true
-- ============================================================================
