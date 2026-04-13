import { z } from "zod";
import { JOB_TYPES, JOURNEY_TYPES, FIELD_TYPES } from "../constants/projects";

export const journeyInsertSchema = z.object({
  name: z.string().min(1).max(200),
  journeyType: z.enum(JOURNEY_TYPES),
  forJobTypes: z.array(z.enum(JOB_TYPES)).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const journeyStageInsertSchema = z.object({
  journeyId: z.string().uuid(),
  stageKey: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0),
});

export const fieldGroupInsertSchema = z.object({
  label: z.string().min(1).max(200),
  showFor: z.array(z.enum(JOB_TYPES)).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const fieldGroupFieldInsertSchema = z.object({
  fieldGroupId: z.string().uuid(),
  fieldKey: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(200),
  fieldType: z.enum(FIELD_TYPES),
  options: z.array(z.string()).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const projectInsertSchema = z.object({
  contactId: z.string().uuid(),
  journeyId: z.string().uuid(),
  stageId: z.string().uuid(),
  projectType: z.enum(JOURNEY_TYPES),
  jobType: z.enum(JOB_TYPES),
  fieldValues: z.record(z.string(), z.unknown()).optional(),
  name: z.string().max(200).nullable().optional(),
  status: z.string().max(50).nullable().optional(),
  monetaryValue: z.number().int().min(0).nullable().optional(),
  priceListId: z.string().nullable().optional(),
});

export const projectUpdateSchema = z.object({
  stageId: z.string().uuid().optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  fieldValues: z.record(z.string(), z.unknown()).optional(),
  name: z.string().max(200).nullable().optional(),
  status: z.string().max(50).nullable().optional(),
  monetaryValue: z.number().int().min(0).nullable().optional(),
});

export type JourneyInsert = z.infer<typeof journeyInsertSchema>;
export type JourneyStageInsert = z.infer<typeof journeyStageInsertSchema>;
export type FieldGroupInsert = z.infer<typeof fieldGroupInsertSchema>;
export type FieldGroupFieldInsert = z.infer<typeof fieldGroupFieldInsertSchema>;
export type ProjectInsert = z.infer<typeof projectInsertSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
