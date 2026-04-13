-- Add title column to booking_appointments
-- Stores the display name e.g. "Becky & Kieran's Engagement Session"
ALTER TABLE booking_appointments ADD COLUMN IF NOT EXISTS title TEXT;
