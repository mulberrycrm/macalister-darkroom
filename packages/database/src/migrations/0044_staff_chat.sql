-- Staff Chat: channels and messages for internal team communication

CREATE TABLE staff_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT, -- NULL for 1:1 DMs, set for group channels
  type TEXT NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff_chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES staff_chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

CREATE TABLE staff_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES staff_chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX staff_chat_channels_tenant_id_idx ON staff_chat_channels(tenant_id);
CREATE INDEX staff_chat_channel_members_user_id_idx ON staff_chat_channel_members(user_id);
CREATE INDEX staff_chat_channel_members_channel_id_idx ON staff_chat_channel_members(channel_id);
CREATE INDEX staff_chat_messages_channel_id_created_at_idx ON staff_chat_messages(channel_id, created_at);
CREATE INDEX staff_chat_messages_sender_id_idx ON staff_chat_messages(sender_id);

-- Seed default group channels for macalister tenant
INSERT INTO staff_chat_channels (tenant_id, name, type, created_by)
SELECT t.id, 'general', 'group', u.id
FROM tenants t, users u
WHERE t.slug = 'macalister' AND u.email = 'rainer@macalister.nz'
LIMIT 1;

INSERT INTO staff_chat_channels (tenant_id, name, type, created_by)
SELECT t.id, 'editing-updates', 'group', u.id
FROM tenants t, users u
WHERE t.slug = 'macalister' AND u.email = 'rainer@macalister.nz'
LIMIT 1;

-- Add all existing users to the general channel
INSERT INTO staff_chat_channel_members (channel_id, user_id)
SELECT c.id, u.id
FROM staff_chat_channels c
JOIN tenants t ON c.tenant_id = t.id
JOIN users u ON u.tenant_id = t.id
WHERE t.slug = 'macalister' AND c.name = 'general';

-- Add all existing users to editing-updates channel
INSERT INTO staff_chat_channel_members (channel_id, user_id)
SELECT c.id, u.id
FROM staff_chat_channels c
JOIN tenants t ON c.tenant_id = t.id
JOIN users u ON u.tenant_id = t.id
WHERE t.slug = 'macalister' AND c.name = 'editing-updates';

-- Enable realtime for staff chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE staff_chat_messages;
