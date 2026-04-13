-- Create table for storing OAuth credentials securely
-- Tokens are encrypted in application layer before storage
CREATE TABLE oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  -- Encrypted token data (encrypted in application layer)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  -- Token metadata
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  -- OAuth state for CSRF protection
  state_value TEXT,
  state_expires_at TIMESTAMP WITH TIME ZONE,
  -- Additional provider-specific data
  provider_data JSONB DEFAULT '{}',
  -- Audit trail
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure one active credential per provider per tenant
CREATE UNIQUE INDEX oauth_credentials_tenant_provider_active_idx
  ON oauth_credentials(tenant_id, provider)
  WHERE state_expires_at IS NULL;

-- Index for querying by tenant and provider
CREATE INDEX oauth_credentials_tenant_provider_idx ON oauth_credentials(tenant_id, provider);

-- Index for cleanup of expired state values
CREATE INDEX oauth_credentials_state_expires_idx ON oauth_credentials(state_expires_at);

-- Index for finding expired tokens
CREATE INDEX oauth_credentials_expires_idx ON oauth_credentials(expires_at);

-- Add comments
COMMENT ON TABLE oauth_credentials IS 'Stores encrypted OAuth tokens for third-party integrations. Tokens are encrypted at application layer before storage.';
COMMENT ON COLUMN oauth_credentials.tenant_id IS 'Tenant that owns this OAuth credential';
COMMENT ON COLUMN oauth_credentials.provider IS 'OAuth provider (e.g., google_calendar, stripe)';
COMMENT ON COLUMN oauth_credentials.access_token_encrypted IS 'Encrypted access token (encrypted at application layer)';
COMMENT ON COLUMN oauth_credentials.refresh_token_encrypted IS 'Encrypted refresh token for token rotation (encrypted at application layer)';
COMMENT ON COLUMN oauth_credentials.state_value IS 'CSRF protection state value during OAuth flow (temporary)';
COMMENT ON COLUMN oauth_credentials.state_expires_at IS 'State value expiry time (5 minutes, then NULL when state used)';
COMMENT ON COLUMN oauth_credentials.expires_at IS 'Access token expiration time for automatic refresh';
COMMENT ON COLUMN oauth_credentials.last_refreshed_at IS 'Last time token was refreshed (for audit)';
