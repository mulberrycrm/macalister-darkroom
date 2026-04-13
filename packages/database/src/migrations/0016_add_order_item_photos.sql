-- Create order_item_photos table
CREATE TABLE "order_item_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add index for quick lookups
CREATE INDEX "order_item_photos_item_id_idx" ON "order_item_photos"("item_id");

-- Add constraint to order_items -> order_item_photos
ALTER TABLE "order_item_photos" ADD CONSTRAINT "order_item_photos_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "order_items"("id") ON DELETE CASCADE;
