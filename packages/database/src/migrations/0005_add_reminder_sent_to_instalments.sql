-- Add reminder_sent column to payment_instalments for tracking payment reminders
ALTER TABLE payment_instalments
ADD COLUMN reminder_sent BOOLEAN DEFAULT false NOT NULL;

-- Add index for querying unsent reminders
CREATE INDEX payment_instalments_reminder_sent_idx
  ON payment_instalments(reminder_sent, due_date);
