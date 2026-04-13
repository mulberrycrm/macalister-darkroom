-- Add location field to booking appointments
ALTER TABLE booking_appointments ADD COLUMN IF NOT EXISTS location TEXT;
