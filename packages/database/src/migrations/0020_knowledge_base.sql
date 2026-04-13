-- Knowledge base system for internal documentation and guides

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Article metadata
  category TEXT NOT NULL CHECK (category IN ('Getting Started', 'Features', 'Billing', 'Client Portal', 'Troubleshooting', 'FAQ')),
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- Optional fields
  code_blocks TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  search_keywords TEXT,

  -- Publishing
  published BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Uniqueness constraint on slug per tenant
  UNIQUE(tenant_id, slug)
);

-- Indexes for performance
CREATE INDEX knowledge_base_tenant_id_idx ON knowledge_base(tenant_id);
CREATE INDEX knowledge_base_category_idx ON knowledge_base(category);
CREATE INDEX knowledge_base_published_idx ON knowledge_base(published);

-- Row Level Security
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_base_tenant_isolation
  ON knowledge_base FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid);

-- Public read access for published articles
CREATE POLICY knowledge_base_public_read
  ON knowledge_base FOR SELECT
  USING (published = true);
