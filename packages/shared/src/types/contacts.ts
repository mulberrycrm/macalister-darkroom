export type ContactType =
  | "individual"
  | "couple"
  | "family"
  | "corporate"
  | "candidate";

export type ContactPersonRole =
  | "primary"
  | "partner"
  | "child"
  | "pet"
  | "staff_member"
  | "mum"
  | "dad"
  | "parent";

/** Lead source is free text. No fixed union type. */
export type LeadSource = string;

export interface Contact {
  id: string;
  tenantId: string;
  knownAs: string;
  contactType: ContactType;
  leadSource: string | null;
  tags: string[];
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
  notes: string | null;
  mailingList: boolean;
  mailingListSegment: string[] | null;
  galleryLink: string | null;
  organisation: string | null;
  region: string | null;
  suburb: string | null;
  createdAt: Date;
}

export interface ContactPerson {
  id: string;
  contactId: string;
  role: ContactPersonRole;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  sortOrder: number;
  metadata: Record<string, unknown> | null;
}
