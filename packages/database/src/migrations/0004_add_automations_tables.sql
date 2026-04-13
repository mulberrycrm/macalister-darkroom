-- Automations system tables for email/SMS templates and execution tracking

-- Main templates table
CREATE TABLE automations_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- "order", "payment", "gallery", "account", "admin", "marketing"
  channel VARCHAR(50) NOT NULL,   -- "email" or "sms"

  -- Template content
  subject VARCHAR(255),           -- NULL for SMS; required for email
  body TEXT NOT NULL,
  render_type VARCHAR(50) NOT NULL DEFAULT 'plain_text',  -- "plain_text" or "html"
  variables TEXT NOT NULL DEFAULT '[]',  -- JSON array of {name, description, example}

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,  -- System templates (not editable in UI)
  version INT DEFAULT 1,

  -- Delivery configuration
  quiet_hours_respect BOOLEAN DEFAULT true,  -- Respect 9am-6pm NZT
  schedule_at_time VARCHAR(5),  -- NULL for immediate, "09:00" for specific time

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  UNIQUE(tenant_id, slug)
);

-- Template version history
CREATE TABLE automations_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES automations_templates(id) ON DELETE CASCADE,

  version INT NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables TEXT NOT NULL,

  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  change_notes TEXT,

  UNIQUE(template_id, version)
);

-- Trigger definitions (Phase 2+)
CREATE TABLE automations_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,  -- "order.created", "payment.due_in_3d", "gallery.published"

  -- Linked template
  template_id UUID NOT NULL REFERENCES automations_templates(id),

  -- Conditions
  conditions TEXT,  -- JSON object of conditional logic (future)

  -- Execution
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,  -- Higher = execute first

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(tenant_id, slug)
);

-- Execution audit log
CREATE TABLE automations_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- What was triggered
  template_id UUID NOT NULL REFERENCES automations_templates(id),
  trigger_id UUID REFERENCES automations_triggers(id),

  -- Who/what it was sent to
  contact_id UUID NOT NULL REFERENCES contacts(id),
  message_id UUID REFERENCES messages(id),

  -- Execution details
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  channel VARCHAR(50) NOT NULL,  -- "email", "sms"

  -- Status
  status VARCHAR(50) NOT NULL,  -- "queued", "sent", "delivered", "failed"
  error_message TEXT,

  -- Tracking
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX automations_templates_tenant_id_idx ON automations_templates(tenant_id);
CREATE INDEX automations_templates_tenant_slug_idx ON automations_templates(tenant_id, slug);
CREATE INDEX automations_templates_is_active_idx ON automations_templates(is_active);

CREATE INDEX automations_template_versions_template_id_idx ON automations_template_versions(template_id);

CREATE INDEX automations_triggers_tenant_id_idx ON automations_triggers(tenant_id);
CREATE INDEX automations_triggers_tenant_slug_idx ON automations_triggers(tenant_id, slug);
CREATE INDEX automations_triggers_event_type_idx ON automations_triggers(event_type);

CREATE INDEX automations_execution_log_tenant_id_idx ON automations_execution_log(tenant_id);
CREATE INDEX automations_execution_log_template_id_idx ON automations_execution_log(template_id);
CREATE INDEX automations_execution_log_contact_id_idx ON automations_execution_log(contact_id);
CREATE INDEX automations_execution_log_status_idx ON automations_execution_log(status);
CREATE INDEX automations_execution_log_created_at_idx ON automations_execution_log(created_at);

-- Row Level Security (RLS) Policies

-- Automations templates: only allow access to own tenant
ALTER TABLE automations_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY automations_templates_tenant_isolation
  ON automations_templates FOR ALL
  USING (tenant_id = auth.uid()::uuid);  -- Assumes auth context

-- Template versions: only allow access to templates in own tenant
ALTER TABLE automations_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY automations_template_versions_tenant_isolation
  ON automations_template_versions FOR ALL
  USING (
    template_id IN (
      SELECT id FROM automations_templates WHERE tenant_id = auth.uid()::uuid
    )
  );

-- Triggers: only allow access to own tenant
ALTER TABLE automations_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY automations_triggers_tenant_isolation
  ON automations_triggers FOR ALL
  USING (tenant_id = auth.uid()::uuid);

-- Execution log: only allow access to own tenant
ALTER TABLE automations_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY automations_execution_log_tenant_isolation
  ON automations_execution_log FOR ALL
  USING (tenant_id = auth.uid()::uuid);
