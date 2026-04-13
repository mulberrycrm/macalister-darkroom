-- Bookings system tables for appointment management and availability tracking
-- Supports multi-tenant appointment booking with Google Calendar integration

-- Table: booking_appointment_types
-- Defines types of appointments that can be booked (e.g., phone-call, ordering-session)
CREATE TABLE booking_appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identification
  key VARCHAR(100) NOT NULL,  -- 'phone-call', 'ordering-session'
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scheduling
  duration_minutes INTEGER NOT NULL,  -- 20, 90, etc.
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30,  -- How often slots appear

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(tenant_id, key)
);

-- Table: booking_availability_windows
-- Defines available time windows per day of week for each appointment type
CREATE TABLE booking_availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  appointment_type_id UUID NOT NULL REFERENCES booking_appointment_types(id) ON DELETE CASCADE,

  -- Day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday (or using 1 = Monday)
  day_of_week INTEGER NOT NULL,  -- 0-6

  -- Time window
  start_time TIME NOT NULL,  -- '10:00'
  end_time TIME NOT NULL,    -- '13:00'

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: booking_appointments
-- Individual appointment bookings by clients
CREATE TABLE booking_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  appointment_type_id UUID NOT NULL REFERENCES booking_appointment_types(id),
  contact_id UUID REFERENCES contacts(id),

  -- Date/Time
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- ISO 8601 datetime
  timezone VARCHAR(50) NOT NULL DEFAULT 'Pacific/Auckland',

  -- Client information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_notes TEXT,

  -- External integrations
  google_event_id TEXT,  -- Google Calendar event ID

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',  -- 'scheduled', 'confirmed', 'cancelled', 'no-show'

  -- Tracking
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,  -- Soft delete

  CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'no-show'))
);

-- Table: booking_calendar_availability
-- Tracks daily availability status per appointment type
CREATE TABLE booking_calendar_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  appointment_type_id UUID NOT NULL REFERENCES booking_appointment_types(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Availability info
  available_slots INTEGER,  -- Count of available slots for the day
  status VARCHAR(50) NOT NULL DEFAULT 'open',  -- 'open', 'full', 'blocked'
  blocked_reason VARCHAR(100),  -- 'holiday', 'event', 'manual', etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(tenant_id, appointment_type_id, date)
);

-- Table: booking_sync_log
-- Audit trail for integration sync operations (Google Calendar, etc.)
CREATE TABLE booking_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Action details
  action VARCHAR(100) NOT NULL,  -- 'create_event', 'update_event', 'delete_event', 'fetch_availability'
  resource_type VARCHAR(100) NOT NULL,  -- 'appointment', 'availability', 'calendar_sync'
  external_id VARCHAR(500),  -- Google event ID, etc.

  -- Status tracking
  status VARCHAR(50) NOT NULL,  -- 'pending', 'completed', 'failed'
  error_message TEXT,  -- Error details if failed

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance

-- booking_appointment_types indexes
CREATE INDEX booking_appointment_types_tenant_id_idx
  ON booking_appointment_types(tenant_id);
CREATE INDEX booking_appointment_types_is_active_idx
  ON booking_appointment_types(is_active);

-- booking_availability_windows indexes
CREATE INDEX booking_availability_windows_tenant_id_idx
  ON booking_availability_windows(tenant_id);
CREATE INDEX booking_availability_windows_type_id_idx
  ON booking_availability_windows(appointment_type_id);
CREATE INDEX booking_availability_windows_day_idx
  ON booking_availability_windows(day_of_week);

-- booking_appointments indexes
CREATE INDEX booking_appointments_tenant_id_idx
  ON booking_appointments(tenant_id);
CREATE INDEX booking_appointments_contact_id_idx
  ON booking_appointments(contact_id);
CREATE INDEX booking_appointments_type_id_idx
  ON booking_appointments(appointment_type_id);
CREATE INDEX booking_appointments_scheduled_at_idx
  ON booking_appointments(scheduled_at);
CREATE INDEX booking_appointments_status_idx
  ON booking_appointments(status);
CREATE INDEX booking_appointments_created_at_idx
  ON booking_appointments(created_at);
CREATE INDEX booking_appointments_client_email_idx
  ON booking_appointments(client_email);
CREATE INDEX booking_appointments_google_event_id_idx
  ON booking_appointments(google_event_id);

-- booking_calendar_availability indexes
CREATE INDEX booking_calendar_availability_tenant_id_idx
  ON booking_calendar_availability(tenant_id);
CREATE INDEX booking_calendar_availability_type_id_idx
  ON booking_calendar_availability(appointment_type_id);
CREATE INDEX booking_calendar_availability_date_idx
  ON booking_calendar_availability(date);
CREATE INDEX booking_calendar_availability_status_idx
  ON booking_calendar_availability(status);

-- booking_sync_log indexes
CREATE INDEX booking_sync_log_tenant_id_idx
  ON booking_sync_log(tenant_id);
CREATE INDEX booking_sync_log_status_idx
  ON booking_sync_log(status);
CREATE INDEX booking_sync_log_created_at_idx
  ON booking_sync_log(created_at);
CREATE INDEX booking_sync_log_external_id_idx
  ON booking_sync_log(external_id);

-- Row Level Security (RLS) Policies

-- booking_appointment_types: only allow access to own tenant
ALTER TABLE booking_appointment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_appointment_types_tenant_isolation
  ON booking_appointment_types FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- booking_availability_windows: only allow access to own tenant
ALTER TABLE booking_availability_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_availability_windows_tenant_isolation
  ON booking_availability_windows FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- booking_appointments: only allow access to own tenant
ALTER TABLE booking_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_appointments_tenant_isolation
  ON booking_appointments FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- booking_calendar_availability: only allow access to own tenant
ALTER TABLE booking_calendar_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_calendar_availability_tenant_isolation
  ON booking_calendar_availability FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- booking_sync_log: only allow access to own tenant
ALTER TABLE booking_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_sync_log_tenant_isolation
  ON booking_sync_log FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
