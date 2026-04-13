-- RPC for cross-table contact search with relevance ranking
-- Searches contacts.known_as + contact_people.first_name/last_name/email/phone

CREATE OR REPLACE FUNCTION search_contacts(
  p_tenant_id uuid,
  p_search text,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  known_as text,
  contact_type text,
  tags text[],
  created_at timestamptz,
  total_count bigint
)
LANGUAGE sql STABLE
AS $$
  WITH matched AS (
    SELECT DISTINCT c.id,
      CASE
        WHEN c.known_as ILIKE p_search THEN 4
        WHEN c.known_as ILIKE p_search || '%' THEN 3
        WHEN c.known_as ILIKE '%' || p_search || '%' THEN 2
        ELSE 1
      END AS relevance
    FROM contacts c
    LEFT JOIN contact_people cp ON cp.contact_id = c.id
    WHERE c.tenant_id = p_tenant_id
      AND (
        c.known_as ILIKE '%' || p_search || '%'
        OR cp.first_name ILIKE '%' || p_search || '%'
        OR cp.last_name ILIKE '%' || p_search || '%'
        OR cp.email ILIKE '%' || p_search || '%'
        OR cp.phone ILIKE '%' || p_search || '%'
        OR (cp.first_name || ' ' || COALESCE(cp.last_name, '')) ILIKE '%' || p_search || '%'
      )
  ),
  cnt AS (
    SELECT COUNT(*) AS total_count FROM matched
  )
  SELECT
    c.id,
    c.known_as,
    c.contact_type,
    c.tags,
    c.created_at,
    cnt.total_count
  FROM contacts c
  INNER JOIN matched m ON m.id = c.id
  CROSS JOIN cnt
  ORDER BY m.relevance DESC, c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
