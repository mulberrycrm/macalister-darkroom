-- Add original_filename column to gallery_photos
-- Stores the camera/upload filename (e.g. DSC_1234.jpg) for download naming
ALTER TABLE gallery_photos ADD COLUMN original_filename text;

-- Backfill: for migrated photos (r2_key contains /orig/), extract the actual filename
UPDATE gallery_photos
SET original_filename = split_part(r2_key, '/', array_length(string_to_array(r2_key, '/'), 1))
WHERE r2_key LIKE '%/orig/%';

-- For new-format photos (r2_key ends in /original.jpg), filename is unknown
-- These will need the uploader to set original_filename going forward
