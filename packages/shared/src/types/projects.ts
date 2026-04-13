export type JourneyType = "lead" | "shoot";

export type JobType =
  | "wedding"
  | "family"
  | "pets"
  | "engagement"
  | "newborn"
  | "portrait"
  | "commercial"
  | "event"
  | "other";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "tags"
  | "currency";

export type ProjectEventType =
  | "stage_changed"
  | "field_updated"
  | "note_added"
  | "tag_added"
  | "tag_removed"
  | "created"
  | "converted";

export interface Journey {
  id: string;
  tenantId: string;
  name: string;
  journeyType: JourneyType;
  forJobTypes: JobType[] | null;
  isActive: boolean;
  createdAt: Date;
}

export interface JourneyStage {
  id: string;
  journeyId: string;
  stageKey: string;
  label: string;
  sortOrder: number;
}

export interface FieldGroup {
  id: string;
  tenantId: string;
  label: string;
  showFor: JobType[] | null;
  sortOrder: number;
}

export interface FieldGroupField {
  id: string;
  fieldGroupId: string;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  options: string[] | null;
  sortOrder: number;
}

export interface Project {
  id: string;
  tenantId: string;
  contactId: string;
  journeyId: string;
  stageId: string;
  projectType: JourneyType;
  jobType: JobType;
  fieldValues: Record<string, unknown>;
  name: string | null;
  status: string | null;
  monetaryValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  fromStageId: string | null;
  toStageId: string | null;
  performedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
