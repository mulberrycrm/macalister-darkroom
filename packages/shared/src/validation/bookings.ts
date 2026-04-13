import { z } from "zod";

// Appointment type management schemas
export const appointmentTypeInsertSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive(),
  slotIntervalMinutes: z.number().int().positive().default(30),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const appointmentTypeUpdateSchema = appointmentTypeInsertSchema.partial();

// Availability window schemas
export const availabilityWindowInsertSchema = z.object({
  appointmentTypeId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, etc.
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const availabilityWindowUpdateSchema = availabilityWindowInsertSchema.partial();

// Appointment creation schemas
export const appointmentCreateSchema = z.object({
  typeId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email(),
  clientPhone: z.string().max(20).optional(),
  clientNotes: z.string().optional().nullable(),
  timezone: z.string().default("Pacific/Auckland"),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "cancelled", "no-show"]).optional(),
  clientNotes: z.string().optional().nullable(),
});

// Availability query schemas
export const availabilityMonthQuerySchema = z.object({
  typeId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const availabilityDateQuerySchema = z.object({
  typeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

// Type exports
export type AppointmentTypeInsert = z.infer<typeof appointmentTypeInsertSchema>;
export type AppointmentTypeUpdate = z.infer<typeof appointmentTypeUpdateSchema>;

export type AvailabilityWindowInsert = z.infer<typeof availabilityWindowInsertSchema>;
export type AvailabilityWindowUpdate = z.infer<typeof availabilityWindowUpdateSchema>;

export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;

export type AvailabilityMonthQuery = z.infer<typeof availabilityMonthQuerySchema>;
export type AvailabilityDateQuery = z.infer<typeof availabilityDateQuerySchema>;
