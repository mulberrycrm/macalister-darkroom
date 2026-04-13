-- Stored procedures for REST API migration
-- These handle complex queries that benefit from server-side processing

-- ============================================================================
-- 1. Conversation List with Unread Counts
-- ============================================================================
-- Handles: LATERAL join with correlated subqueries for unread counts
CREATE OR REPLACE FUNCTION get_conversation_list(
  p_tenant_id uuid,
  p_search_query text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  contact_id uuid,
  known_as text,
  contact_type text,
  email text,
  phone text,
  photo_url text,
  last_message_text text,
  last_message_date timestamp with time zone,
  unread_count int,
  message_direction text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.known_as,
    c.contact_type,
    (SELECT COALESCE(cp.email, '') FROM contact_people cp WHERE cp.contact_id = c.id ORDER BY cp.created_at LIMIT 1),
    (SELECT COALESCE(cp.phone, '') FROM contact_people cp WHERE cp.contact_id = c.id ORDER BY cp.created_at LIMIT 1),
    c.photo_url,
    m.text,
    m.created_at,
    COALESCE((SELECT COUNT(*) FROM messages m2 WHERE m2.contact_id = c.id AND m2.is_read = false AND m2.direction = 'inbound'), 0),
    COALESCE(m.direction, '')
  FROM contacts c
  LEFT JOIN LATERAL (
    SELECT text, created_at, direction
    FROM messages
    WHERE messages.contact_id = c.id
    ORDER BY messages.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE c.tenant_id = p_tenant_id
    AND (p_search_query IS NULL OR c.known_as ILIKE '%' || p_search_query || '%')
  ORDER BY m.created_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. Find Duplicate Contacts
-- ============================================================================
-- Handles: Array aggregation with complex grouping
CREATE OR REPLACE FUNCTION find_duplicate_contacts(
  p_tenant_id uuid
)
RETURNS TABLE (
  known_as text,
  duplicate_count int,
  contact_ids uuid[],
  created_at_list timestamp with time zone[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.known_as,
    COUNT(*)::int,
    array_agg(c.id),
    array_agg(c.created_at ORDER BY c.created_at)
  FROM contacts c
  WHERE c.tenant_id = p_tenant_id
  GROUP BY c.known_as
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 3. Dashboard Statistics
-- ============================================================================
-- Handles: Multiple aggregate queries with joins and subqueries
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid, date, date);
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_tenant_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  total_contacts int,
  unread_messages int,
  pending_orders int,
  awaiting_payment int,
  this_month_revenue numeric,
  total_revenue numeric
) AS $$
DECLARE
  v_start_date date := COALESCE(p_start_date, DATE_TRUNC('month', NOW())::date);
  v_end_date date := COALESCE(p_end_date, (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::date);
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM contacts WHERE tenant_id = p_tenant_id)::int,
    (SELECT COUNT(*) FROM messages WHERE contact_id IN (SELECT id FROM contacts WHERE tenant_id = p_tenant_id) AND is_read = false AND direction = 'inbound')::int,
    (SELECT COUNT(*) FROM orders WHERE tenant_id = p_tenant_id AND status = 'draft')::int,
    (SELECT COUNT(*) FROM orders WHERE tenant_id = p_tenant_id AND status = 'approved' AND is_paid = false)::int,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = p_tenant_id AND status = 'completed' AND DATE(created_at) BETWEEN v_start_date AND v_end_date)::numeric,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = p_tenant_id AND status = 'completed')::numeric;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. Create Payment Plan with Instalments (Transaction)
-- ============================================================================
-- Handles: Multi-statement transaction with insert, update sequence
CREATE OR REPLACE FUNCTION create_payment_plan(
  p_order_id uuid,
  p_total_amount numeric,
  p_num_instalments int,
  p_due_dates date[]
)
RETURNS TABLE (
  payment_plan_id uuid,
  instalment_ids uuid[]
) AS $$
DECLARE
  v_payment_plan_id uuid;
  v_instalment_ids uuid[] := ARRAY[]::uuid[];
  v_i int;
  v_instalment_amount numeric;
  v_instalment_id uuid;
BEGIN
  -- Create payment plan
  INSERT INTO payment_plans (order_id, total, num_instalments, status)
  VALUES (p_order_id, p_total_amount, p_num_instalments, 'active')
  RETURNING id INTO v_payment_plan_id;

  v_instalment_amount := p_total_amount / p_num_instalments;

  -- Create instalments
  FOR v_i IN 1..p_num_instalments LOOP
    INSERT INTO payment_instalments (
      payment_plan_id,
      amount,
      due_date,
      instalment_number,
      status
    )
    VALUES (
      v_payment_plan_id,
      v_instalment_amount,
      p_due_dates[v_i],
      v_i,
      'pending'
    )
    RETURNING id INTO v_instalment_id;

    v_instalment_ids := array_append(v_instalment_ids, v_instalment_id);
  END LOOP;

  -- Update order status
  UPDATE orders SET status = 'payment_plan_pending' WHERE id = p_order_id;

  RETURN QUERY SELECT v_payment_plan_id, v_instalment_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Search Contacts with Full-Text
-- ============================================================================
-- Handles: Complex EXISTS subqueries with pattern matching
CREATE OR REPLACE FUNCTION search_contacts(
  p_tenant_id uuid,
  p_search_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  contact_id uuid,
  known_as text,
  email text,
  phone text,
  contact_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.known_as,
    COALESCE(cp_email.email, ''),
    COALESCE(cp_phone.phone, ''),
    c.contact_type
  FROM contacts c
  LEFT JOIN (
    SELECT DISTINCT contact_id, email FROM contact_people WHERE email IS NOT NULL
  ) cp_email ON cp_email.contact_id = c.id
  LEFT JOIN (
    SELECT DISTINCT contact_id, phone FROM contact_people WHERE phone IS NOT NULL
  ) cp_phone ON cp_phone.contact_id = c.id
  WHERE c.tenant_id = p_tenant_id
    AND (
      c.known_as ILIKE '%' || p_search_query || '%'
      OR cp_email.email ILIKE '%' || p_search_query || '%'
      OR cp_phone.phone ILIKE '%' || p_search_query || '%'
    )
  ORDER BY c.known_as
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Index for common filters to optimize performance
CREATE INDEX IF NOT EXISTS idx_messages_contact_is_read ON messages(contact_id, is_read, direction);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_name ON contacts(tenant_id, known_as);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
