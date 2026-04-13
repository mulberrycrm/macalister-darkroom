ALTER TABLE "price_lists" ADD COLUMN "url_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "price_lists_url_hash_idx" ON "price_lists" USING btree ("url_hash");--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_url_hash_unique" UNIQUE("url_hash");--> statement-breakpoint
-- Note: url_hash should be populated separately after adding the column
-- Then run: ALTER TABLE "price_lists" ALTER COLUMN "url_hash" SET NOT NULL;