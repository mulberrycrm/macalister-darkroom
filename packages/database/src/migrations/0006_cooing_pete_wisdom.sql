ALTER TABLE "projects" DROP CONSTRAINT "projects_price_list_id_price_lists_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "price_list_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_price_list_id_price_lists_url_hash_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("url_hash") ON DELETE set null ON UPDATE no action;