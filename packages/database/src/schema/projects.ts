import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { contacts } from "./contacts";
import { priceLists } from "./commerce";

export const journeys = pgTable("journeys", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: text().notNull(),
  journeyType: text("journey_type", { enum: ["lead", "shoot"] }).notNull(),
  forJobTypes: text("for_job_types").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("journeys_tenant_id_idx").on(table.tenantId),
]);

export const journeyStages = pgTable("journey_stages", {
  id: uuid().defaultRandom().primaryKey(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  stageKey: text("stage_key").notNull(),
  label: text().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("journey_stages_journey_id_idx").on(table.journeyId),
  uniqueIndex("journey_stages_journey_stage_key_idx").on(table.journeyId, table.stageKey),
]);

export const fieldGroups = pgTable("field_groups", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  label: text().notNull(),
  showFor: text("show_for").array(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("field_groups_tenant_id_idx").on(table.tenantId),
]);

export const fieldGroupFields = pgTable("field_group_fields", {
  id: uuid().defaultRandom().primaryKey(),
  fieldGroupId: uuid("field_group_id").notNull().references(() => fieldGroups.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  label: text().notNull(),
  fieldType: text("field_type", {
    enum: ["text", "textarea", "number", "date", "datetime", "select", "multiselect", "checkbox", "url", "email", "phone", "tags", "currency"],
  }).notNull(),
  options: text().array(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("field_group_fields_field_group_id_idx").on(table.fieldGroupId),
]);

export const projects = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "restrict" }),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "restrict" }),
  stageId: uuid("stage_id").notNull().references(() => journeyStages.id, { onDelete: "restrict" }),
  projectType: text("project_type", { enum: ["lead", "shoot"] }).notNull(),
  jobType: text("job_type", {
    enum: ["wedding", "family", "pets", "engagement", "newborn", "portrait", "commercial", "event", "other"],
  }).notNull(),
  priceListId: text("price_list_id").references(() => priceLists.urlHash, { onDelete: "set null" }),
  fieldValues: jsonb("field_values").notNull().default({}),
  name: text("name"),
  status: text("status").default("active"),
  monetaryValue: integer("monetary_value"),
  transcript: jsonb("transcript"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("projects_tenant_id_idx").on(table.tenantId),
  index("projects_contact_id_idx").on(table.contactId),
  index("projects_stage_id_idx").on(table.stageId),
  index("projects_journey_id_idx").on(table.journeyId),
]);

export const projectEvents = pgTable("project_events", {
  id: uuid().defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text({
    enum: ["stage_changed", "field_updated", "note_added", "tag_added", "tag_removed", "created", "converted"],
  }).notNull(),
  fromStageId: uuid("from_stage_id").references(() => journeyStages.id, { onDelete: "set null" }),
  toStageId: uuid("to_stage_id").references(() => journeyStages.id, { onDelete: "set null" }),
  performedBy: uuid("performed_by").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("project_events_project_id_idx").on(table.projectId),
  index("project_events_created_at_idx").on(table.createdAt),
]);

export const publicBookingLinks = pgTable("public_booking_links", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  token: text().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("public_booking_links_tenant_id_idx").on(table.tenantId),
  index("public_booking_links_project_id_idx").on(table.projectId),
  index("public_booking_links_token_idx").on(table.token),
  uniqueIndex("public_booking_links_token_unique").on(table.token),
]);

export const questionnaires = pgTable("questionnaires", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  slug: text().notNull(),
  title: text().notNull(),
  description: text(),
  questions: jsonb().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  // Tag to apply to the contact when this questionnaire is submitted.
  // If onCompleteTagOutoftown is also set, Wellington-area contacts get onCompleteTag
  // and everyone else gets onCompleteTagOutoftown.
  onCompleteTag: text("on_complete_tag"),
  onCompleteTagOutoftown: text("on_complete_tag_outoftown"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("questionnaires_tenant_id_idx").on(table.tenantId),
  index("questionnaires_project_id_idx").on(table.projectId),
  uniqueIndex("questionnaires_tenant_slug_idx").on(table.tenantId, table.slug),
]);

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: uuid().defaultRandom().primaryKey(),
  questionnaireId: uuid("questionnaire_id").notNull().references(() => questionnaires.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  responses: jsonb().notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("questionnaire_responses_questionnaire_id_idx").on(table.questionnaireId),
  index("questionnaire_responses_contact_id_idx").on(table.contactId),
]);

export const emailTemplates = pgTable("email_templates", {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  slug: text().notNull(),
  name: text().notNull(),
  subject: text().notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  category: text().notNull().default("gallery"),
  variables: text("variables").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("email_templates_tenant_id_idx").on(table.tenantId),
  index("email_templates_category_idx").on(table.category),
  uniqueIndex("email_templates_tenant_slug_idx").on(table.tenantId, table.slug),
]);
