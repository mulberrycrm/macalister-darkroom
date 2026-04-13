export const JOB_TYPES = [
  "wedding",
  "family",
  "pets",
  "engagement",
  "newborn",
  "portrait",
  "commercial",
  "event",
  "other",
] as const;

export const JOURNEY_TYPES = ["lead", "shoot"] as const;

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "select",
  "multiselect",
  "checkbox",
  "url",
  "email",
  "phone",
  "tags",
  "currency",
] as const;

export const PROJECT_EVENT_TYPES = [
  "stage_changed",
  "field_updated",
  "note_added",
  "tag_added",
  "tag_removed",
  "created",
  "converted",
] as const;
