-- RPC function: get inbox contacts with latest message info
-- Replaces the two-query approach that overflows PostgREST URL limits with 400+ contacts

CREATE OR REPLACE FUNCTION get_inbox_contacts(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  known_as text,
  contact_type text,
  tags text[],
  created_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.known_as,
    c.contact_type,
    c.tags,
    c.created_at,
    latest.last_message_at,
    latest.last_message_preview,
    COALESCE(unread.cnt, 0) AS unread_count
  FROM contacts c
  LEFT JOIN LATERAL (
    SELECT
      m.created_at AS last_message_at,
      LEFT(m.body, 80) AS last_message_preview
    FROM messages m
    WHERE m.contact_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) latest ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM messages m
    WHERE m.contact_id = c.id
      AND m.direction = 'inbound'
      AND m.is_read = false
  ) unread ON true
  WHERE c.tenant_id = p_tenant_id
    AND c.contact_type IN ('supplier','vendor','partner','unknown','marketing','spam','candidate')
  ORDER BY latest.last_message_at DESC NULLS LAST;
$$;

--> statement-breakpoint

-- RPC function: get inbox unread count (contacts with inbound messages)
CREATE OR REPLACE FUNCTION get_inbox_unread_count(p_tenant_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(DISTINCT c.id)
  FROM contacts c
  INNER JOIN messages m ON m.contact_id = c.id AND m.direction = 'inbound'
  WHERE c.tenant_id = p_tenant_id
    AND c.contact_type IN ('supplier','vendor','partner','unknown','marketing','spam','candidate');
$$;
