import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { tenants, users } from "./schema/core";
import { journeys, journeyStages, fieldGroups, fieldGroupFields } from "./schema/projects";
import { automationsTemplates } from "./schema/system";
import { expenseCategories } from "./schema/accounting";
import bcryptjs from "bcryptjs";
import { logger } from "@crm/shared/lib/logger";

// Use properly encoded connection string for postgres package
const rawConnectionString = process.env["DATABASE_URL"] ?? "postgresql://crm_app:crm_app@localhost:5432/crm";
// Encode special characters in password: % -> %25, ! -> %21, ^ -> %5E
const connectionString = rawConnectionString
  .replace(/%(?!25|21|5E)/g, '%25')  // % not followed by 25, 21, or 5E becomes %25
  .replace(/!/g, '%21')               // ! becomes %21
  .replace(/\^/g, '%5E');             // ^ becomes %5E
const client = postgres(connectionString);
const db = drizzle(client);

async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

async function seed() {
  logger.info("Seeding database...");

  // Create default tenant
  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Macalister Photography", slug: "macalister" })
    .onConflictDoNothing()
    .returning();

  const tenantId = tenant?.id;
  if (!tenantId) {
    logger.info("Tenant already exists, fetching...");
    const existing = await db.select().from(tenants).limit(1);
    if (existing.length === 0) throw new Error("No tenant found");
    await seedWithTenant(existing[0].id);
    return;
  }

  await seedWithTenant(tenantId);
}

async function seedWithTenant(tenantId: string) {
  // Create admin user
  const passwordHash = await hashPassword("changeme123");
  await db
    .insert(users)
    .values({
      tenantId,
      email: "rainer@macalister.nz",
      passwordHash,
      displayName: "Rainer",
      role: "admin",
    })
    .onConflictDoNothing();

  logger.info("Created admin user: rainer@macalister.nz (password: changeme123)");

  // Create Lead Pipeline
  const [leadPipeline] = await db
    .insert(journeys)
    .values({ tenantId, name: "Lead Pipeline", journeyType: "lead" })
    .returning();

  const leadStages = [
    { stageKey: "new_enquiry", label: "New Enquiry", sortOrder: 0 },
    { stageKey: "contacted", label: "Contacted", sortOrder: 1 },
    { stageKey: "qualifying", label: "Qualifying", sortOrder: 2 },
    { stageKey: "quote_sent", label: "Quote Sent", sortOrder: 3 },
    { stageKey: "follow_up", label: "Follow Up", sortOrder: 4 },
    { stageKey: "booked", label: "Booked", sortOrder: 5 },
    { stageKey: "lost", label: "Lost", sortOrder: 6 },
  ];

  await db.insert(journeyStages).values(
    leadStages.map((s) => ({ ...s, journeyId: leadPipeline.id })),
  );

  // Create Portrait Pipeline (lead)
  const [portraitPipeline] = await db
    .insert(journeys)
    .values({
      tenantId,
      name: "Portrait Pipeline",
      journeyType: "lead",
      forJobTypes: ["family", "pets", "newborn", "portrait"],
    })
    .returning();

  await db.insert(journeyStages).values(
    leadStages.map((s) => ({ ...s, journeyId: portraitPipeline.id })),
  );

  // Create Wedding Journey (shoot)
  const [weddingJourney] = await db
    .insert(journeys)
    .values({
      tenantId,
      name: "Wedding Journey",
      journeyType: "shoot",
      forJobTypes: ["wedding"],
    })
    .returning();

  const weddingShootStages = [
    { stageKey: "pre_planning", label: "Pre-Planning", sortOrder: 0 },
    { stageKey: "planning", label: "Planning", sortOrder: 1 },
    { stageKey: "ready_to_shoot", label: "Ready to Shoot", sortOrder: 2 },
    { stageKey: "shot", label: "Shot", sortOrder: 3 },
    { stageKey: "culling", label: "Culling", sortOrder: 4 },
    { stageKey: "editing", label: "Editing", sortOrder: 5 },
    { stageKey: "design_consultation", label: "Design Consultation", sortOrder: 6 },
    { stageKey: "ordering", label: "Ordering", sortOrder: 7 },
    { stageKey: "fulfilment", label: "Fulfilment", sortOrder: 8 },
    { stageKey: "complete", label: "Complete", sortOrder: 9 },
  ];

  await db.insert(journeyStages).values(
    weddingShootStages.map((s) => ({ ...s, journeyId: weddingJourney.id })),
  );

  // Create Portrait Journey (shoot)
  const [portraitJourney] = await db
    .insert(journeys)
    .values({
      tenantId,
      name: "Portrait Journey",
      journeyType: "shoot",
      forJobTypes: ["family", "pets", "newborn", "portrait"],
    })
    .returning();

  const portraitShootStages = [
    { stageKey: "pre_planning", label: "Pre-Planning", sortOrder: 0 },
    { stageKey: "ready_to_shoot", label: "Ready to Shoot", sortOrder: 1 },
    { stageKey: "shot", label: "Shot", sortOrder: 2 },
    { stageKey: "culling", label: "Culling", sortOrder: 3 },
    { stageKey: "editing", label: "Editing", sortOrder: 4 },
    { stageKey: "design_consultation", label: "Design Consultation", sortOrder: 5 },
    { stageKey: "ordering", label: "Ordering", sortOrder: 6 },
    { stageKey: "fulfilment", label: "Fulfilment", sortOrder: 7 },
    { stageKey: "complete", label: "Complete", sortOrder: 8 },
  ];

  await db.insert(journeyStages).values(
    portraitShootStages.map((s) => ({ ...s, journeyId: portraitJourney.id })),
  );

  // Create field groups
  const [weddingDetails] = await db
    .insert(fieldGroups)
    .values({ tenantId, label: "Wedding Details", showFor: ["wedding"], sortOrder: 0 })
    .returning();

  await db.insert(fieldGroupFields).values([
    { fieldGroupId: weddingDetails.id, fieldKey: "wedding_date", label: "Wedding Date", fieldType: "date" as const, sortOrder: 0 },
    { fieldGroupId: weddingDetails.id, fieldKey: "venue", label: "Venue", fieldType: "text" as const, sortOrder: 1 },
    { fieldGroupId: weddingDetails.id, fieldKey: "ceremony_time", label: "Ceremony Time", fieldType: "text" as const, sortOrder: 2 },
    { fieldGroupId: weddingDetails.id, fieldKey: "guest_count", label: "Guest Count", fieldType: "number" as const, sortOrder: 3 },
    { fieldGroupId: weddingDetails.id, fieldKey: "second_photographer", label: "Second Photographer", fieldType: "checkbox" as const, sortOrder: 4 },
  ]);

  const [sessionDetails] = await db
    .insert(fieldGroups)
    .values({ tenantId, label: "Session Details", sortOrder: 1 })
    .returning();

  await db.insert(fieldGroupFields).values([
    { fieldGroupId: sessionDetails.id, fieldKey: "session_date", label: "Session Date", fieldType: "date" as const, sortOrder: 0 },
    { fieldGroupId: sessionDetails.id, fieldKey: "location", label: "Location", fieldType: "text" as const, sortOrder: 1 },
    { fieldGroupId: sessionDetails.id, fieldKey: "session_time", label: "Session Time", fieldType: "text" as const, sortOrder: 2 },
    { fieldGroupId: sessionDetails.id, fieldKey: "notes", label: "Notes", fieldType: "textarea" as const, sortOrder: 3 },
  ]);

  logger.info("Created journeys: Lead Pipeline, Portrait Pipeline, Wedding Journey, Portrait Journey");
  logger.info("Created field groups: Wedding Details, Session Details");

  // Seed expense categories for NZ tax system
  const categories = [
    { name: "Office Supplies", description: "Pens, paper, ink, envelopes, and office stationery", taxCode: "4100" },
    { name: "Printing & Copying", description: "Business printing, copying, and bindery services", taxCode: "4105" },
    { name: "Postage & Courier", description: "Postage, couriers, and shipping expenses", taxCode: "4110" },
    { name: "Telephone & Internet", description: "Phone and internet services for business use", taxCode: "4115" },
    { name: "Travel - Airfare", description: "Flights for business travel", taxCode: "4200" },
    { name: "Travel - Accommodation", description: "Hotels and accommodation for business travel", taxCode: "4205" },
    { name: "Travel - Meals", description: "Meals while traveling for business", taxCode: "4210" },
    { name: "Travel - Vehicle", description: "Mileage and vehicle expenses for business travel", taxCode: "4215" },
    { name: "Local Transport", description: "Local taxi, bus, train fares and parking", taxCode: "4220" },
    { name: "Vehicle Fuel", description: "Petrol, diesel, and fuel for business vehicles", taxCode: "4225" },
    { name: "Vehicle Maintenance", description: "Car maintenance, servicing, tyres, and repairs", taxCode: "4230" },
    { name: "Vehicle Registration & Insurance", description: "Rego, WOF, and vehicle insurance", taxCode: "4235" },
    { name: "Accommodation - Studio Rent", description: "Studio or workspace rental", taxCode: "4300" },
    { name: "Utilities - Electricity", description: "Electricity for business premises", taxCode: "4310" },
    { name: "Utilities - Water & Sewerage", description: "Water and sewerage for business premises", taxCode: "4315" },
    { name: "Utilities - Gas", description: "Gas for business premises", taxCode: "4320" },
    { name: "Rates & Property Tax", description: "Council rates and property taxes", taxCode: "4325" },
    { name: "Equipment & Hardware", description: "Camera bodies, lenses, lighting, computers, and hardware", taxCode: "4400" },
    { name: "Software & Subscriptions", description: "Photography software, Creative Cloud, Lightroom, Capture One, etc", taxCode: "4405" },
    { name: "Repairs & Maintenance", description: "Equipment repairs and maintenance", taxCode: "4410" },
    { name: "Insurance - Professional Indemnity", description: "Professional indemnity insurance", taxCode: "4500" },
    { name: "Insurance - Business Property", description: "Buildings and contents insurance", taxCode: "4505" },
    { name: "Insurance - Liability", description: "Public and product liability insurance", taxCode: "4510" },
    { name: "Client Entertainment", description: "Meals and entertainment with clients (50% deductible)", taxCode: "4600" },
    { name: "Professional Development", description: "Courses, workshops, training, and professional fees", taxCode: "4700" },
    { name: "Subscriptions - Professional", description: "Professional body memberships and subscriptions", taxCode: "4705" },
    { name: "Advertising & Marketing", description: "Website, social media, prints, and marketing expenses", taxCode: "4800" },
    { name: "Sponsorships & Donations", description: "Business sponsorships and charitable donations", taxCode: "4805" },
    { name: "Subcontractors & Freelancers", description: "Payments to other photographers and service providers", taxCode: "4900" },
    { name: "Bank Fees & Interest", description: "Bank fees, credit card fees, and interest", taxCode: "5000" },
    { name: "Accounting & Legal", description: "Accountant fees, legal advice, and tax advice", taxCode: "5100" },
    { name: "Licensing & Permits", description: "Business licenses, permits, and registrations", taxCode: "5200" },
    { name: "Books & Publications", description: "Professional books, magazines, and publications", taxCode: "5300" },
    { name: "Other Business Expenses", description: "Miscellaneous business expenses not listed above", taxCode: "5900" },
  ];

  // TODO: Seed expense categories via migration script or API endpoint
  // (Drizzle/postgres connection issue preventing direct seeding)
  logger.info(`Skipping expense categories seeding - will seed via separate script or API`);
  logger.info("Seed complete!");

  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seed failed:", err);
  process.exit(1);
});
