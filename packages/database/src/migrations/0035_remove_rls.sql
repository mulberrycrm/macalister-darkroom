-- Migration: Remove all RLS policies and disable row-level security
-- Date: 2026-04-05
--
-- RLS was added with the intention of multi-tenant isolation, but this is a
-- single-tenant system and all auth is handled at the application layer via
-- server actions. The policies relied on auth.jwt()->'tenant_id' which is never
-- set (the app uses its own session auth, not Supabase Auth), so they were
-- never enforcing anything. The galleries app uses Firebase for favorites/
-- analytics, so the "public_read" gallery policies were also inert.
--
-- All tenant isolation is done via .eq("tenant_id", ...) in server actions.

-- ── Disable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS contacts                       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages                       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders                         DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects                       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_people                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS automations_templates          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS automations_template_versions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS automations_triggers           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS automations_execution_log      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_appointment_types      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_availability_windows   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_appointments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_calendar_availability  DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_sync_log               DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS galleries                      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery_sections               DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery_photos                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery_favorites              DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery_analytics              DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS knowledge_base                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ops_reviews                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates                DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questionnaires                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questionnaire_responses           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS booking_notification_templates    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_catalogue_lists          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_catalogue_prices         DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_catalogue_products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supplier_catalogue_suppliers      DISABLE ROW LEVEL SECURITY;

-- ── Drop all policies ─────────────────────────────────────────────────────────

-- contacts
DROP POLICY IF EXISTS contacts_tenant_isolation ON contacts;

-- messages
DROP POLICY IF EXISTS messages_tenant_isolation ON messages;

-- orders
DROP POLICY IF EXISTS orders_tenant_isolation ON orders;

-- projects
DROP POLICY IF EXISTS projects_tenant_isolation ON projects;

-- contact_people
DROP POLICY IF EXISTS contact_people_tenant_isolation ON contact_people;

-- automations (tables may not exist in all environments)
DO $$ BEGIN
  DROP POLICY IF EXISTS automations_templates_tenant_isolation         ON automations_templates;
  DROP POLICY IF EXISTS automations_template_versions_tenant_isolation ON automations_template_versions;
  DROP POLICY IF EXISTS automations_triggers_tenant_isolation          ON automations_triggers;
  DROP POLICY IF EXISTS automations_execution_log_tenant_isolation     ON automations_execution_log;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- bookings
DROP POLICY IF EXISTS booking_appointment_types_tenant_isolation     ON booking_appointment_types;
DROP POLICY IF EXISTS booking_availability_windows_tenant_isolation  ON booking_availability_windows;
DROP POLICY IF EXISTS booking_appointments_tenant_isolation          ON booking_appointments;
DROP POLICY IF EXISTS booking_calendar_availability_tenant_isolation ON booking_calendar_availability;
DROP POLICY IF EXISTS booking_sync_log_tenant_isolation              ON booking_sync_log;

-- galleries (all policies — favorites/analytics use Firebase, not these tables)
DROP POLICY IF EXISTS galleries_tenant_isolation       ON galleries;
DROP POLICY IF EXISTS gallery_sections_tenant_isolation ON gallery_sections;
DROP POLICY IF EXISTS gallery_photos_tenant_isolation  ON gallery_photos;
DROP POLICY IF EXISTS gallery_favorites_public_read    ON gallery_favorites;
DROP POLICY IF EXISTS gallery_favorites_tenant_write   ON gallery_favorites;
DROP POLICY IF EXISTS gallery_analytics_public_read    ON gallery_analytics;
DROP POLICY IF EXISTS gallery_analytics_tenant_write   ON gallery_analytics;

-- knowledge base (may not exist in all environments)
DO $$ BEGIN
  DROP POLICY IF EXISTS knowledge_base_tenant_isolation ON knowledge_base;
  DROP POLICY IF EXISTS knowledge_base_public_read      ON knowledge_base;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ops reviews
DROP POLICY IF EXISTS ops_reviews_tenant_isolation ON ops_reviews;

-- email templates
DROP POLICY IF EXISTS "Email templates readable by tenant" ON email_templates;
DROP POLICY IF EXISTS "Email templates insertable by tenant" ON email_templates;
DROP POLICY IF EXISTS "Email templates updatable by tenant" ON email_templates;
DROP POLICY IF EXISTS "Email templates deletable by tenant" ON email_templates;

-- questionnaires
DROP POLICY IF EXISTS "Questionnaires readable by tenant"  ON questionnaires;
DROP POLICY IF EXISTS "Questionnaires insertable by tenant" ON questionnaires;
DROP POLICY IF EXISTS "Questionnaires updatable by tenant" ON questionnaires;

-- questionnaire responses
DROP POLICY IF EXISTS "Responses readable by tenant"   ON questionnaire_responses;
DROP POLICY IF EXISTS "Responses insertable by anyone" ON questionnaire_responses;
DROP POLICY IF EXISTS "Responses updatable by tenant"  ON questionnaire_responses;

-- booking notification templates
DROP POLICY IF EXISTS tenant_isolation ON booking_notification_templates;

-- email templates (anon policies added in a later migration)
DROP POLICY IF EXISTS email_templates_anon_read ON email_templates;
DROP POLICY IF EXISTS email_templates_anon_write ON email_templates;

-- supplier catalogue
DO $$ BEGIN
  DROP POLICY IF EXISTS tenant_read_supplier_lists     ON supplier_catalogue_lists;
  DROP POLICY IF EXISTS tenant_write_supplier_lists    ON supplier_catalogue_lists;
  DROP POLICY IF EXISTS tenant_read_supplier_prices    ON supplier_catalogue_prices;
  DROP POLICY IF EXISTS tenant_write_supplier_prices   ON supplier_catalogue_prices;
  DROP POLICY IF EXISTS tenant_read_supplier_products  ON supplier_catalogue_products;
  DROP POLICY IF EXISTS tenant_write_supplier_products ON supplier_catalogue_products;
  DROP POLICY IF EXISTS tenant_read_supplier_suppliers  ON supplier_catalogue_suppliers;
  DROP POLICY IF EXISTS tenant_write_supplier_suppliers ON supplier_catalogue_suppliers;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
