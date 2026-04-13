CREATE TABLE "fulfilment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"from_stage" text NOT NULL,
	"to_stage" text NOT NULL,
	"performed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"price_list_item_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"fulfilment_stage" text DEFAULT 'not_started' NOT NULL,
	"assigned_to" uuid,
	"item_type" text,
	"tax_cents" integer,
	"images" text[],
	"fulfilment_notes" text,
	"extended_price_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"project_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"subtotal_cents" integer,
	"gst_cents" integer,
	"created_by" text,
	"paid_at" timestamp with time zone,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_instalments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"label" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"failure_reason" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"template_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_list_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"size_label" text,
	"price_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"canonical_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"product_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"materials" text,
	"size_range" text,
	"includes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text,
	"birth_date" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"known_as" text NOT NULL,
	"contact_type" text DEFAULT 'unknown' NOT NULL,
	"lead_source" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"stripe_customer_id" text,
	"stripe_payment_method_id" text,
	"notes" text,
	"mailing_list" boolean DEFAULT false NOT NULL,
	"mailing_list_segment" text[],
	"gallery_link" text,
	"organisation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"cover_image_url" text,
	"password" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"allow_download" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"project_id" uuid,
	"accent_color" text,
	"first_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gallery_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"event" text NOT NULL,
	"photo_id" uuid,
	"session_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"photo_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"is_hero" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"channel" text NOT NULL,
	"body" text,
	"body_html" text,
	"subject" text,
	"delivery_status" text DEFAULT 'queued' NOT NULL,
	"external_id" text,
	"thread_id" text,
	"message_id_header" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"sender_id" text,
	"sender_name" text,
	"source" text,
	"error_text" text,
	"cc" text,
	"from_address" text,
	"to_address" text,
	"in_reply_to" text,
	"references_header" text,
	"full_body" text,
	"full_html_body" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_group_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_group_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"options" text[],
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" text NOT NULL,
	"show_for" text[],
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"stage_key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"journey_type" text NOT NULL,
	"for_job_types" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" text NOT NULL,
	"from_stage_id" uuid,
	"to_stage_id" uuid,
	"performed_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"journey_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"project_type" text NOT NULL,
	"job_type" text NOT NULL,
	"field_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"name" text,
	"status" text DEFAULT 'active',
	"monetary_value" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid,
	"project_id" uuid,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"package_details" jsonb,
	"payment_plan" jsonb,
	"contract_signed_at" timestamp with time zone,
	"stripe_customer_id" text,
	"stripe_payment_method_id" text,
	"expires_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_promises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"project_id" uuid,
	"message_id" uuid NOT NULL,
	"promise_text" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"confidence" real NOT NULL,
	"status" text DEFAULT 'tracked' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid,
	"contact_id" uuid,
	"contact_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_folder" text,
	"received_folder" text,
	"image_count" integer,
	"zip_size_bytes" integer,
	"notes" text,
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid,
	"form_id" text,
	"form_name" text,
	"campaign" text,
	"source" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_id" uuid,
	"order_id" uuid,
	"invoice_number" text NOT NULL,
	"invoice_name" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"gst_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"due_date" timestamp with time zone,
	"issue_date" timestamp with time zone,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"contact_id" uuid,
	"order_id" uuid,
	"subtype" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"expiration_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"content" text,
	"summary" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_health" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"verification_note" text,
	"verified_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fulfilment_history" ADD CONSTRAINT "fulfilment_history_item_id_order_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fulfilment_history" ADD CONSTRAINT "fulfilment_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_list_item_id_price_list_items_id_fk" FOREIGN KEY ("price_list_item_id") REFERENCES "public"."price_list_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_instalments" ADD CONSTRAINT "payment_instalments_plan_id_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_people" ADD CONSTRAINT "contact_people_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_analytics" ADD CONSTRAINT "gallery_analytics_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_analytics" ADD CONSTRAINT "gallery_analytics_photo_id_gallery_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."gallery_photos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_favorites" ADD CONSTRAINT "gallery_favorites_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_favorites" ADD CONSTRAINT "gallery_favorites_photo_id_gallery_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."gallery_photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_section_id_gallery_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."gallery_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_sections" ADD CONSTRAINT "gallery_sections_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_group_fields" ADD CONSTRAINT "field_group_fields_field_group_id_field_groups_id_fk" FOREIGN KEY ("field_group_id") REFERENCES "public"."field_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_groups" ADD CONSTRAINT "field_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_stages" ADD CONSTRAINT "journey_stages_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_from_stage_id_journey_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."journey_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_to_stage_id_journey_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."journey_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_stage_id_journey_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."journey_stages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_promises" ADD CONSTRAINT "client_promises_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_promises" ADD CONSTRAINT "client_promises_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_promises" ADD CONSTRAINT "client_promises_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_promises" ADD CONSTRAINT "client_promises_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_jobs" ADD CONSTRAINT "editor_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_jobs" ADD CONSTRAINT "editor_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_jobs" ADD CONSTRAINT "editor_jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fulfilment_history_item_id_idx" ON "fulfilment_history" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_tenant_id_idx" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "orders_contact_id_idx" ON "orders" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "orders_project_id_idx" ON "orders" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "payment_instalments_plan_id_idx" ON "payment_instalments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "payment_instalments_due_date_status_idx" ON "payment_instalments" USING btree ("due_date","status");--> statement-breakpoint
CREATE INDEX "payment_plans_order_id_idx" ON "payment_plans" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "price_list_items_price_list_id_idx" ON "price_list_items" USING btree ("price_list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_canonical_idx" ON "products" USING btree ("tenant_id","canonical_id");--> statement-breakpoint
CREATE INDEX "products_tenant_id_idx" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "contact_people_contact_id_idx" ON "contact_people" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_people_email_idx" ON "contact_people" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contact_people_phone_idx" ON "contact_people" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_tenant_id_idx" ON "contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "contacts_contact_type_idx" ON "contacts" USING btree ("tenant_id","contact_type");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "galleries_tenant_id_idx" ON "galleries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "galleries_slug_idx" ON "galleries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gallery_analytics_gallery_id_idx" ON "gallery_analytics" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "gallery_favorites_gallery_id_idx" ON "gallery_favorites" USING btree ("gallery_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_favorites_unique_idx" ON "gallery_favorites" USING btree ("gallery_id","photo_id","session_id");--> statement-breakpoint
CREATE INDEX "gallery_photos_section_id_idx" ON "gallery_photos" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "gallery_sections_gallery_id_idx" ON "gallery_sections" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "messages_contact_id_idx" ON "messages" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "messages_contact_id_created_at_idx" ON "messages" USING btree ("contact_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "messages_external_id_idx" ON "messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "messages_message_id_header_idx" ON "messages" USING btree ("message_id_header");--> statement-breakpoint
CREATE INDEX "messages_is_read_idx" ON "messages" USING btree ("contact_id","is_read");--> statement-breakpoint
CREATE INDEX "field_group_fields_field_group_id_idx" ON "field_group_fields" USING btree ("field_group_id");--> statement-breakpoint
CREATE INDEX "field_groups_tenant_id_idx" ON "field_groups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "journey_stages_journey_id_idx" ON "journey_stages" USING btree ("journey_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journey_stages_journey_stage_key_idx" ON "journey_stages" USING btree ("journey_id","stage_key");--> statement-breakpoint
CREATE INDEX "journeys_tenant_id_idx" ON "journeys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "project_events_project_id_idx" ON "project_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_events_created_at_idx" ON "project_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "projects_tenant_id_idx" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "projects_contact_id_idx" ON "projects" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "projects_stage_id_idx" ON "projects" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "projects_journey_id_idx" ON "projects" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "automations_tenant_id_idx" ON "automations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "booking_links_tenant_id_idx" ON "booking_links" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "booking_links_token_idx" ON "booking_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "booking_links_contact_id_idx" ON "booking_links" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_created_at_idx" ON "chat_messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_tenant_id_idx" ON "chat_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "client_promises_tenant_id_status_idx" ON "client_promises" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "client_promises_contact_id_idx" ON "client_promises" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "client_promises_message_id_idx" ON "client_promises" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "contract_templates_tenant_id_idx" ON "contract_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "editor_jobs_tenant_id_idx" ON "editor_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "editor_jobs_project_id_idx" ON "editor_jobs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "form_submissions_tenant_id_idx" ON "form_submissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "form_submissions_contact_id_idx" ON "form_submissions" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_id_idx" ON "invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invoices_contact_id_idx" ON "invoices" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "invoices_order_id_idx" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "job_queue_status_scheduled_idx" ON "job_queue" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "job_queue_locked_until_idx" ON "job_queue" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_tenant_id_idx" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "notifications_contact_id_idx" ON "notifications" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_tenant_id_idx" ON "reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "reports_category_idx" ON "reports" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tasks_tenant_id_idx" ON "tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");