-- Performance Optimization: Add missing indexes
-- Improves query performance for common filtering and ordering operations
-- Expected improvement: 20-30% faster on filtered queries

-- For conversations list (filter by tenant + order by created_at)
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id_created_at
  ON contacts(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- For message filtering by is_read (unread counts)
CREATE INDEX IF NOT EXISTS idx_messages_contact_id_is_read
  ON messages(contact_id, is_read)
  WHERE deleted_at IS NULL;

-- For orders filtering by status
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id_status
  ON orders(tenant_id, status)
  WHERE deleted_at IS NULL;

-- For projects filtering by stage
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id_stage_id
  ON projects(tenant_id, stage_id)
  WHERE deleted_at IS NULL;

-- For order items fulfillment status
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_stage
  ON order_items(fulfilment_stage)
  WHERE deleted_at IS NULL;

-- For contact searches by tags and type
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id_type
  ON contacts(tenant_id, contact_type)
  WHERE deleted_at IS NULL;

-- For message searches by direction and status
CREATE INDEX IF NOT EXISTS idx_messages_contact_id_direction_created
  ON messages(contact_id, direction, created_at DESC)
  WHERE deleted_at IS NULL;

-- For gallery views by tenant
CREATE INDEX IF NOT EXISTS idx_galleries_tenant_id_published
  ON galleries(tenant_id, is_published)
  WHERE deleted_at IS NULL;

-- For payment instalments filtering
CREATE INDEX IF NOT EXISTS idx_payment_instalments_plan_id_status
  ON payment_instalments(plan_id, status)
  WHERE deleted_at IS NULL;

-- For contact_people email lookups
CREATE INDEX IF NOT EXISTS idx_contact_people_email_contact_id
  ON contact_people(email, contact_id)
  WHERE deleted_at IS NULL;
