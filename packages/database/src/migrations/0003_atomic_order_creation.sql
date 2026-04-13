-- Atomic order creation with items
-- Ensures all-or-nothing semantics: either the order is created with all items, or nothing is created
-- Prevents orphaned orders if network fails partway through adding items

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_tenant_id uuid,
  p_contact_id uuid,
  p_project_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items json DEFAULT NULL
)
RETURNS TABLE (
  order_id uuid,
  total_cents integer,
  subtotal_cents integer,
  gst_cents integer,
  item_count integer
) AS $$
DECLARE
  v_order_id uuid;
  v_item_count integer := 0;
  v_total_cents integer := 0;
  v_gst_cents integer;
  v_subtotal_cents integer;
  v_item record;
BEGIN
  -- Create the order
  INSERT INTO orders (tenant_id, contact_id, project_id, status, total_cents, notes)
  VALUES (p_tenant_id, p_contact_id, p_project_id, 'draft', 0, p_notes)
  RETURNING id INTO v_order_id;

  -- If items are provided, insert them all and calculate totals
  IF p_items IS NOT NULL THEN
    -- Insert all items in a single statement to ensure atomicity
    INSERT INTO order_items (order_id, product_id, price_list_item_id, description, quantity, unit_price_cents)
    SELECT
      v_order_id,
      (item->>'product_id')::uuid,
      (item->>'price_list_item_id')::uuid,
      item->>'description',
      COALESCE((item->>'quantity')::integer, 1),
      (item->>'unit_price_cents')::integer
    FROM json_array_elements(p_items) AS item
    WHERE (item->>'description') IS NOT NULL AND ((item->>'unit_price_cents')::integer) IS NOT NULL;

    -- Count inserted items
    SELECT COUNT(*) INTO v_item_count FROM order_items WHERE order_id = v_order_id;

    -- Calculate totals from all items
    SELECT
      COALESCE(SUM(unit_price_cents * quantity), 0)
    INTO v_total_cents
    FROM order_items
    WHERE order_id = v_order_id;

    -- Calculate GST (15% in New Zealand) - GST is included in total price
    -- Formula: GST = Math.round((totalCents * 15) / 115)
    v_gst_cents := ROUND((v_total_cents * 15.0) / 115.0)::integer;
    v_subtotal_cents := v_total_cents - v_gst_cents;

    -- Update order with calculated totals
    UPDATE orders
    SET total_cents = v_total_cents, gst_cents = v_gst_cents, subtotal_cents = v_subtotal_cents
    WHERE id = v_order_id;
  END IF;

  RETURN QUERY SELECT v_order_id, v_total_cents, v_subtotal_cents, v_gst_cents, v_item_count;
END;
$$ LANGUAGE plpgsql;

-- Function to add a single item to an existing order and recalculate totals
CREATE OR REPLACE FUNCTION add_order_item_atomic(
  p_order_id uuid,
  p_product_id uuid DEFAULT NULL,
  p_price_list_item_id uuid DEFAULT NULL,
  p_description text,
  p_quantity integer DEFAULT 1,
  p_unit_price_cents integer
)
RETURNS TABLE (
  item_id uuid,
  total_cents integer,
  subtotal_cents integer,
  gst_cents integer
) AS $$
DECLARE
  v_item_id uuid;
  v_total_cents integer;
  v_gst_cents integer;
  v_subtotal_cents integer;
BEGIN
  -- Insert the new item
  INSERT INTO order_items (
    order_id,
    product_id,
    price_list_item_id,
    description,
    quantity,
    unit_price_cents
  )
  VALUES (p_order_id, p_product_id, p_price_list_item_id, p_description, p_quantity, p_unit_price_cents)
  RETURNING id INTO v_item_id;

  -- Recalculate totals
  SELECT COALESCE(SUM(unit_price_cents * quantity), 0)
  INTO v_total_cents
  FROM order_items
  WHERE order_id = p_order_id;

  -- Calculate GST (15% in New Zealand) - GST is included in total price
  v_gst_cents := ROUND((v_total_cents * 15.0) / 115.0)::integer;
  v_subtotal_cents := v_total_cents - v_gst_cents;

  -- Update order with new totals
  UPDATE orders
  SET total_cents = v_total_cents, gst_cents = v_gst_cents, subtotal_cents = v_subtotal_cents
  WHERE id = p_order_id;

  RETURN QUERY SELECT v_item_id, v_total_cents, v_subtotal_cents, v_gst_cents;
END;
$$ LANGUAGE plpgsql;
