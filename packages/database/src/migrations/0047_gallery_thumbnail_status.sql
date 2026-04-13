-- Add thumbnail_status column to gallery_photos for async thumbnail processing
ALTER TABLE "gallery_photos" ADD COLUMN "thumbnail_status" text NOT NULL DEFAULT 'pending';

-- Backfill: mark existing photos with thumbnails as complete
UPDATE "gallery_photos" SET "thumbnail_status" = 'complete' WHERE "thumbnail_url" IS NOT NULL;

-- Index for finding photos that need thumbnail processing
CREATE INDEX "gallery_photos_thumbnail_status_idx" ON "gallery_photos" ("thumbnail_status");
