-- booking_notification_templates: per-type × per-event notification templates
-- Replaces the flat email_templates approach for booking notifications

CREATE TABLE booking_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  appointment_type_id UUID NOT NULL REFERENCES booking_appointment_types(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('confirmed', 'rescheduled', 'cancelled', 'reminder_24h')),

  -- Email
  email_active BOOLEAN NOT NULL DEFAULT true,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,

  -- SMS
  sms_active BOOLEAN NOT NULL DEFAULT true,
  sms_body TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tenant_id, appointment_type_id, event)
);

-- RLS disabled — tenant isolation handled in application code (matches all other booking tables)

-- Indexes
CREATE INDEX idx_bnt_tenant_type ON booking_notification_templates(tenant_id, appointment_type_id);
