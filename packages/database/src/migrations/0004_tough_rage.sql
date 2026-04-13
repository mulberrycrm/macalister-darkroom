CREATE TABLE "campaign_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"message_id" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	CONSTRAINT "campaign_sends_campaign_contact_unique" UNIQUE("campaign_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"segment_filter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"category" text DEFAULT 'gallery' NOT NULL,
	"variables" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"contact_id" uuid,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"on_complete_tag" text,
	"on_complete_tag_outoftown" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "contact_type" SET DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "staff_user_id" uuid;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "calendar_summary_template" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "confirmation_heading" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "confirmation_detail" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "email_intro" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "email_detail" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "notes_placeholder" text;--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD COLUMN "availability_label" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "suburb" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "price_list_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_sends_campaign_id_idx" ON "campaign_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_sends_contact_id_idx" ON "campaign_sends" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "campaign_sends_status_idx" ON "campaign_sends" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_templates_tenant_id_idx" ON "email_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "email_templates_tenant_slug_idx" ON "email_templates" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_questionnaire_id_idx" ON "questionnaire_responses" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_contact_id_idx" ON "questionnaire_responses" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "questionnaires_tenant_id_idx" ON "questionnaires" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "questionnaires_project_id_idx" ON "questionnaires" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaires_tenant_slug_idx" ON "questionnaires" USING btree ("tenant_id","slug");--> statement-breakpoint
ALTER TABLE "booking_appointment_types" ADD CONSTRAINT "booking_appointment_types_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_appointment_types_staff_user_id_idx" ON "booking_appointment_types" USING btree ("staff_user_id");