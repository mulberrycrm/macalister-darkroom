-- Seed initial Automations templates (Phase 1)
-- Insert 5 system templates for order and payment communications
-- These are marked as is_system=true (read-only in UI, but timing can be overridden)

-- Create or replace the helper function to insert templates for all tenants
CREATE OR REPLACE FUNCTION insert_system_templates()
RETURNS TABLE (
  template_name text,
  channel text,
  tenant_id uuid,
  created_at timestamp
) AS $$
DECLARE
  v_tenant_id uuid;
  v_admin_user_id uuid;
  v_now timestamp := NOW();
BEGIN
  -- Loop through all tenants
  FOR v_tenant_id IN SELECT id FROM tenants
  LOOP
    -- Get the admin user for this tenant (if exists, otherwise use NULL)
    SELECT id INTO v_admin_user_id FROM users WHERE tenant_id = v_tenant_id AND role = 'admin' LIMIT 1;

    -- Template 1: Order Confirmation Email
    INSERT INTO automations_templates (
      tenant_id, name, slug, category, channel, subject, body,
      render_type, variables, description, is_system, is_active,
      quiet_hours_respect, created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_tenant_id,
      'Order Confirmation Email',
      'order-confirmation-email',
      'order',
      'email',
      'Your Order #{orderNumber} – Confirmation',
      E'Hi {contactName},\n\nThank you for your order! Here are your order details:\n\nOrder Number: {orderNumber}\nOrder Date: {orderDate}\n\nItems:\n{orderItems}\n\nSubtotal: ${orderSubtotal}\nGST (15%): ${orderGST}\n\nTotal: ${orderTotal}\n\nNext Steps:\nTo complete your payment and finalize your order, please visit the following link:\n{paymentLink}\n\nIf you have any questions, please don''t hesitate to reach out.\n\nThank you!',
      'plain_text',
      '[{"name":"contactName","description":"Customer name (known_as field)","example":"John"},{"name":"orderNumber","description":"Order reference number","example":"ORD-20260331-001"},{"name":"orderDate","description":"ISO date when order was created","example":"2026-03-31"},{"name":"orderItems","description":"Formatted list of ordered items","example":"- 1x Premium Album - $850.00\n- 10x 6x4 Prints - $45.00"},{"name":"orderSubtotal","description":"Subtotal before GST (formatted)","example":"$870.00"},{"name":"orderGST","description":"15% GST amount (formatted)","example":"$113.04"},{"name":"orderTotal","description":"Total amount due (formatted)","example":"$983.04"},{"name":"paymentLink","description":"Payment link to Stripe payment intent","example":"https://sm.macalister.nz/pay/intent_123abc"}]'::jsonb,
      'Automatically sent when an order is created. Includes order details, items, and payment link.',
      true,
      true,
      true,
      v_admin_user_id,
      v_admin_user_id,
      v_now,
      v_now
    ) ON CONFLICT (tenant_id, slug) DO NOTHING;

    -- Template 2: Payment Due Reminder Email
    INSERT INTO automations_templates (
      tenant_id, name, slug, category, channel, subject, body,
      render_type, variables, description, is_system, is_active,
      quiet_hours_respect, schedule_at_time, created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_tenant_id,
      'Payment Due Reminder Email',
      'payment-due-reminder-email',
      'payment',
      'email',
      'Payment Due Reminder – {orderNumber}',
      E'Hi {contactName},\n\nThis is a friendly reminder that payment is due on {dueDate}.\n\nOrder Number: {orderNumber}\nAmount Due: {amount}\n\nTo make your payment, please follow this link:\n{paymentLink}\n\nThank you!',
      'plain_text',
      '[{"name":"contactName","description":"Customer name (known_as field)","example":"John"},{"name":"orderNumber","description":"Order reference number","example":"ORD-20260331-001"},{"name":"dueDate","description":"Payment due date (formatted)","example":"2026-04-15"},{"name":"amount","description":"Amount due (formatted)","example":"$300.50"},{"name":"paymentLink","description":"Payment link to Stripe payment intent","example":"https://sm.macalister.nz/pay/intent_456def"}]'::jsonb,
      'Reminder email sent 3 days, 1 day, and on the due date. Scheduled for 9:00 AM NZT.',
      true,
      true,
      true,
      '09:00',
      v_admin_user_id,
      v_admin_user_id,
      v_now,
      v_now
    ) ON CONFLICT (tenant_id, slug) DO NOTHING;

    -- Template 3: Payment Due Reminder SMS (160 char limit)
    INSERT INTO automations_templates (
      tenant_id, name, slug, category, channel, subject, body,
      render_type, variables, description, is_system, is_active,
      quiet_hours_respect, schedule_at_time, created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_tenant_id,
      'Payment Due Reminder SMS',
      'payment-due-reminder-sms',
      'payment',
      'sms',
      NULL,
      'Hi {contactName}, this is a reminder that ${amount} is due on {dueDate}. Pay here: {paymentLink} Thank you!',
      'plain_text',
      '[{"name":"contactName","description":"Customer first name (known_as field)","example":"John"},{"name":"amount","description":"Amount due (unformatted, e.g. 300.50)","example":"300.50"},{"name":"dueDate","description":"Payment due date (short format)","example":"Apr 15"},{"name":"paymentLink","description":"Short payment link","example":"sm.macalister.nz/pay/i456"}]'::jsonb,
      'SMS reminder sent 3 days, 1 day, and on the due date. Keep under 160 characters. Scheduled for 9:00 AM NZT.',
      true,
      true,
      true,
      '09:00',
      v_admin_user_id,
      v_admin_user_id,
      v_now,
      v_now
    ) ON CONFLICT (tenant_id, slug) DO NOTHING;

    -- Template 4: Payment Received Email
    INSERT INTO automations_templates (
      tenant_id, name, slug, category, channel, subject, body,
      render_type, variables, description, is_system, is_active,
      quiet_hours_respect, created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_tenant_id,
      'Payment Received Email',
      'payment-received-email',
      'payment',
      'email',
      'Payment Received – Thank You!',
      E'Hi {contactName},\n\nWe''ve received your payment of {amount}. Thank you!\n\nOrder Number: {orderNumber}\nPayment Date: {paymentDate}\nRemaining Balance: {remainingBalance}\n\nWe''re processing your order and will keep you updated every step of the way.\n\nIf you have any questions, feel free to reach out.\n\nThank you!',
      'plain_text',
      '[{"name":"contactName","description":"Customer name (known_as field)","example":"John"},{"name":"amount","description":"Payment amount received (formatted)","example":"$300.50"},{"name":"orderNumber","description":"Order reference number","example":"ORD-20260331-001"},{"name":"paymentDate","description":"ISO date when payment was received","example":"2026-03-31"},{"name":"remainingBalance","description":"Remaining balance on the order (formatted)","example":"$682.54"}]'::jsonb,
      'Automatically sent immediately when a payment is received via Stripe webhook. Bypasses quiet hours for urgency.',
      true,
      true,
      false,
      v_admin_user_id,
      v_admin_user_id,
      v_now,
      v_now
    ) ON CONFLICT (tenant_id, slug) DO NOTHING;

    -- Template 5: Payment Received SMS (160 char limit)
    INSERT INTO automations_templates (
      tenant_id, name, slug, category, channel, subject, body,
      render_type, variables, description, is_system, is_active,
      quiet_hours_respect, created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_tenant_id,
      'Payment Received SMS',
      'payment-received-sms',
      'payment',
      'sms',
      NULL,
      'Hi {contactName}, we received your payment of ${amount}. Remaining balance: ${remainingBalance}. Thank you!',
      'plain_text',
      '[{"name":"contactName","description":"Customer first name (known_as field)","example":"John"},{"name":"amount","description":"Payment amount received (unformatted)","example":"300.50"},{"name":"remainingBalance","description":"Remaining balance (unformatted)","example":"682.54"}]'::jsonb,
      'SMS sent immediately when payment is received. Keep under 160 characters. Bypasses quiet hours.',
      true,
      true,
      false,
      v_admin_user_id,
      v_admin_user_id,
      v_now,
      v_now
    ) ON CONFLICT (tenant_id, slug) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to insert all templates for all tenants
SELECT insert_system_templates();
