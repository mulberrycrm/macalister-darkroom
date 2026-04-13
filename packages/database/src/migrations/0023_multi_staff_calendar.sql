-- Multi-staff Google Calendar support for bookings
-- Allows multiple staff members to connect their own Google Calendar
-- and links appointment types to specific staff calendars

-- 1. Add user_id to oauth_credentials for per-staff calendar connections
ALTER TABLE oauth_credentials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 2. Drop old unique index (one credential per tenant per provider)
DROP INDEX IF EXISTS oauth_credentials_tenant_provider_active_idx;

-- 3. Create new unique index (one credential per tenant per provider per user)
-- Uses COALESCE to handle NULL user_id (tenant-level credentials)
CREATE UNIQUE INDEX oauth_credentials_tenant_provider_user_active_idx
  ON oauth_credentials(tenant_id, provider, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
  WHERE state_expires_at IS NULL;

-- 4. Add staff_user_id to booking_appointment_types
-- Links each appointment type to a specific staff member's calendar
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS staff_user_id UUID REFERENCES users(id);

-- 5. Add display/config fields needed by the public booking page
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS calendar_summary_template TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS confirmation_heading TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS confirmation_detail TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS email_intro TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS email_detail TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS notes_placeholder TEXT;
ALTER TABLE booking_appointment_types ADD COLUMN IF NOT EXISTS availability_label TEXT;

-- 6. Index for looking up appointment types by staff
CREATE INDEX IF NOT EXISTS booking_appointment_types_staff_user_id_idx
  ON booking_appointment_types(staff_user_id);

-- 7. Index for oauth credentials by user
CREATE INDEX IF NOT EXISTS oauth_credentials_user_id_idx
  ON oauth_credentials(user_id);
