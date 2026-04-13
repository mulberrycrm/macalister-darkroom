-- Ops Reviews Table
-- Stores operational review documents with metrics, decisions, and action items

CREATE TABLE ops_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Core metadata
  review_date DATE NOT NULL,
  title VARCHAR(255),
  generated_by UUID REFERENCES users(id),

  -- Review content sections (stored as JSON for flexibility)
  stats JSONB NOT NULL DEFAULT '{}', -- Key metrics and KPIs
  alerts JSONB NOT NULL DEFAULT '[]', -- Active alerts and issues
  notices JSONB NOT NULL DEFAULT '[]', -- General notices and updates
  priorities JSONB NOT NULL DEFAULT '[]', -- Priority items
  decisions JSONB NOT NULL DEFAULT '[]', -- Decisions made
  next_steps JSONB NOT NULL DEFAULT '[]', -- Action items for next period
  recent_activity JSONB NOT NULL DEFAULT '{}', -- Summary of recent activity
  completed_this_session JSONB NOT NULL DEFAULT '[]', -- Items completed in this session

  -- Status and timestamps
  archived BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Unique constraint: one review per tenant per date
  UNIQUE(tenant_id, review_date)
);

-- Indexes for performance
CREATE INDEX ops_reviews_tenant_id_idx ON ops_reviews(tenant_id);
CREATE INDEX ops_reviews_review_date_idx ON ops_reviews(review_date DESC);
CREATE INDEX ops_reviews_tenant_date_idx ON ops_reviews(tenant_id, review_date DESC);
CREATE INDEX ops_reviews_archived_idx ON ops_reviews(archived);

-- Row Level Security
ALTER TABLE ops_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY ops_reviews_tenant_isolation
  ON ops_reviews FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.jwt() ->> 'tenant_id')::uuid
  );
