import { z } from "zod";
import { CONTACT_TYPES, CONTACT_PERSON_ROLES } from "../constants/contacts";

export const contactInsertSchema = z.object({
  knownAs: z.string().min(1).max(200),
  contactType: z.enum(CONTACT_TYPES),
  leadSource: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
  stripeCustomerId: z.string().nullable().optional(),
  stripePaymentMethodId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mailingList: z.boolean().optional(),
  mailingListSegment: z.array(z.string()).nullable().optional(),
  galleryLink: z.string().url().nullable().optional(),
  organisation: z.string().max(200).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  suburb: z.string().max(100).nullable().optional(),
});

export const contactUpdateSchema = contactInsertSchema.partial();

export const contactPersonInsertSchema = z.object({
  contactId: z.string().uuid(),
  role: z.enum(CONTACT_PERSON_ROLES),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const contactPersonUpdateSchema = contactPersonInsertSchema.partial().omit({ contactId: true });

export type ContactInsert = z.infer<typeof contactInsertSchema>;
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
export type ContactPersonInsert = z.infer<typeof contactPersonInsertSchema>;
export type ContactPersonUpdate = z.infer<typeof contactPersonUpdateSchema>;
