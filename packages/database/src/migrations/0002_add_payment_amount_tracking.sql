-- Add amount_paid_cents to payment_instalments to track partial payment amounts
ALTER TABLE "payment_instalments" ADD COLUMN "amount_paid_cents" integer DEFAULT 0 NOT NULL;

-- Create an index for tracking payment status by amount
CREATE INDEX "payment_instalments_amount_paid_idx" ON "payment_instalments" ("plan_id", "amount_paid_cents");
