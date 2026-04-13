CREATE TABLE "mobile_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"app_version" text,
	"device_info" jsonb,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_delivery_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"platform" text,
	"device_token_id" uuid,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"error_reason" text
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "url_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "mobile_device_tokens" ADD CONSTRAINT "mobile_device_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_device_tokens" ADD CONSTRAINT "mobile_device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_history" ADD CONSTRAINT "notification_delivery_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_history" ADD CONSTRAINT "notification_delivery_history_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_history" ADD CONSTRAINT "notification_delivery_history_device_token_id_mobile_device_tokens_id_fk" FOREIGN KEY ("device_token_id") REFERENCES "public"."mobile_device_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mobile_device_tokens_user_id_idx" ON "mobile_device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mobile_device_tokens_tenant_id_idx" ON "mobile_device_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mobile_device_tokens_platform_idx" ON "mobile_device_tokens" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "mobile_device_tokens_is_active_idx" ON "mobile_device_tokens" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "mobile_device_tokens_last_updated_idx" ON "mobile_device_tokens" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "notification_delivery_history_recipient_idx" ON "notification_delivery_history" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_history_tenant_idx" ON "notification_delivery_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_history_sent_at_idx" ON "notification_delivery_history" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notification_delivery_history_type_idx" ON "notification_delivery_history" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_delivery_history_delivery_status_idx" ON "notification_delivery_history" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "invoices_url_hash_idx" ON "invoices" USING btree ("url_hash");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_url_hash_unique" UNIQUE("url_hash");