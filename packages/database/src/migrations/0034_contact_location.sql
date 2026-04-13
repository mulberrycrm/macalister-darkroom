-- Add region and suburb to contacts (was previously on project field_values)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS suburb text;

-- Migrate existing data from project field_values
UPDATE contacts c
SET
  region = COALESCE(c.region, sub.region),
  suburb = COALESCE(c.suburb, sub.suburb)
FROM (
  SELECT DISTINCT ON (contact_id)
    contact_id,
    field_values->>'region' as region,
    field_values->>'suburb' as suburb
  FROM projects
  WHERE contact_id IS NOT NULL
    AND (field_values->>'region' IS NOT NULL OR field_values->>'suburb' IS NOT NULL)
  ORDER BY contact_id, created_at DESC
) sub
WHERE c.id = sub.contact_id
  AND (c.region IS NULL OR c.suburb IS NULL);
