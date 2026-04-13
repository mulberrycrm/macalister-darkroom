-- Add star rating and portfolio flag to gallery_photos
-- star_rating: 0-5 from Lightroom XMP metadata (NULL = not read)
-- is_portfolio: auto-flagged true for 4-5★ photos at publish time
ALTER TABLE "gallery_photos" ADD COLUMN IF NOT EXISTS "star_rating" integer;
ALTER TABLE "gallery_photos" ADD COLUMN IF NOT EXISTS "is_portfolio" boolean NOT NULL DEFAULT false;

-- Index for finding portfolio candidates
CREATE INDEX IF NOT EXISTS "gallery_photos_is_portfolio_idx"
  ON "gallery_photos" ("is_portfolio")
  WHERE "is_portfolio" = true;
