-- Migration: Add gallery_type column to galleries table
-- Gallery types: design_consultation, portrait, wedding, other

ALTER TABLE galleries
  ADD COLUMN IF NOT EXISTS gallery_type text NOT NULL DEFAULT 'other';

-- Add a check constraint to enforce valid values
ALTER TABLE galleries
  ADD CONSTRAINT galleries_gallery_type_check
  CHECK (gallery_type IN ('design_consultation', 'portrait', 'wedding', 'other'));

-- Index for filtering by type (useful for Design app queries)
CREATE INDEX IF NOT EXISTS galleries_gallery_type_idx ON galleries (gallery_type);

COMMENT ON COLUMN galleries.gallery_type IS 'Gallery type: design_consultation (Design app only, not publicly viewable), portrait, wedding, other';
