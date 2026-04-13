-- Add project_id to booking_appointments
-- Bookings should link to the project (which carries job_type for genre display names)
-- rather than only to the contact

ALTER TABLE booking_appointments
  ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

--> statement-breakpoint

CREATE INDEX booking_appointments_project_id_idx
  ON booking_appointments(project_id);
