export const CONTACT_TYPES = [
  "individual",
  "couple",
  "family",
  "corporate",
  "candidate",
] as const;

export const CONTACT_PERSON_ROLES = [
  "primary",
  "partner",
  "child",
  "pet",
  "staff_member",
  "mum",
  "dad",
  "parent",
] as const;

/** Lead source is now free text. These are example values for UI suggestions only. */
export const LEAD_SOURCE_SUGGESTIONS = [
  "facebook",
  "instagram",
  "google",
  "referral",
  "website",
  "word_of_mouth",
  "returning",
  "other",
] as const;
