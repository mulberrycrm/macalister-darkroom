import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  date,
  time,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./core";
import { contacts } from "./contacts";

/**
 * Appointment types (e.g., "phone-call", "ordering-session")
 * Defines what types of appointments can be booked
 */
export const bookingAppointmentTypes = pgTable(
  "booking_appointment_types",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Identification
    key: varchar({ length: 100 }).notNull(), // 'phone-call', 'ordering-session'
    name: varchar({ length: 255 }).notNull(),
    description: text(),

    // Scheduling
    durationMinutes: integer("duration_minutes").notNull(), // 20, 90, etc.
    slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30), // How often slots appear

    // Staff & Calendar
    staffUserId: uuid("staff_user_id").references(() => users.id), // Which staff member's calendar to check

    // Public booking page display config
    calendarSummaryTemplate: text("calendar_summary_template"), // e.g. "Phone Call — {name}"
    confirmationHeading: text("confirmation_heading"),
    confirmationDetail: text("confirmation_detail"),
    emailIntro: text("email_intro"),
    emailDetail: text("email_detail"),
    notesPlaceholder: text("notes_placeholder"),
    availabilityLabel: text("availability_label"),

    // Status
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("booking_appointment_types_tenant_key_idx").on(table.tenantId, table.key),
    index("booking_appointment_types_tenant_id_idx").on(table.tenantId),
    index("booking_appointment_types_is_active_idx").on(table.isActive),
    index("booking_appointment_types_staff_user_id_idx").on(table.staffUserId),
  ]
);

/**
 * Availability windows per day of week
 * Defines when appointments can be booked for each type
 */
export const bookingAvailabilityWindows = pgTable(
  "booking_availability_windows",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    appointmentTypeId: uuid("appointment_type_id")
      .notNull()
      .references(() => bookingAppointmentTypes.id, { onDelete: "cascade" }),

    // Day of week: 0-6 (0 = Sunday, 1 = Monday, ... 6 = Saturday)
    dayOfWeek: integer("day_of_week").notNull(),

    // Time window
    startTime: time("start_time").notNull(), // '10:00'
    endTime: time("end_time").notNull(), // '13:00'

    // Status
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("booking_availability_windows_tenant_id_idx").on(table.tenantId),
    index("booking_availability_windows_type_id_idx").on(table.appointmentTypeId),
    index("booking_availability_windows_day_idx").on(table.dayOfWeek),
  ]
);

/**
 * Individual appointment bookings by clients
 */
export const bookingAppointments = pgTable(
  "booking_appointments",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    appointmentTypeId: uuid("appointment_type_id")
      .notNull()
      .references(() => bookingAppointmentTypes.id),
    contactId: uuid("contact_id").references(() => contacts.id),

    // Date/Time
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(), // ISO 8601 datetime
    timezone: varchar({ length: 50 }).notNull().default("Pacific/Auckland"),

    // Client information
    clientName: varchar("client_name", { length: 255 }).notNull(),
    clientEmail: varchar("client_email", { length: 255 }).notNull(),
    clientPhone: varchar("client_phone", { length: 20 }),
    clientNotes: text("client_notes"),

    // External integrations
    googleEventId: text("google_event_id"),

    // Status: 'scheduled', 'confirmed', 'cancelled', 'no-show', 'pending_payment'
    status: varchar({ length: 50 })
      .notNull()
      .default("scheduled"),

    // Mini-session deposit tracking (pet mini-sessions)
    depositAmountCents: integer("deposit_amount_cents"),
    depositStripePiId: text("deposit_stripe_pi_id"),
    depositStatus: varchar("deposit_status", { length: 50 }), // 'pending' | 'paid' | 'refunded' | 'credited'
    petName: varchar("pet_name", { length: 255 }),
    petType: varchar("pet_type", { length: 50 }),
    sessionLocation: text("session_location"),

    // Shoot completion tracking
    // null = not yet asked, true = confirmed happened, false = cancelled/didn't happen
    shootConfirmed: boolean("shoot_confirmed"),
    shootNotes: text("shoot_notes"),
    shootConfirmedAt: timestamp("shoot_confirmed_at", { withTimezone: true }),

    // Tracking
    confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
  },
  (table) => [
    index("booking_appointments_tenant_id_idx").on(table.tenantId),
    index("booking_appointments_contact_id_idx").on(table.contactId),
    index("booking_appointments_type_id_idx").on(table.appointmentTypeId),
    index("booking_appointments_scheduled_at_idx").on(table.scheduledAt),
    index("booking_appointments_status_idx").on(table.status),
    index("booking_appointments_created_at_idx").on(table.createdAt),
    index("booking_appointments_client_email_idx").on(table.clientEmail),
    index("booking_appointments_google_event_id_idx").on(table.googleEventId),
    index("booking_appointments_deposit_pi_idx").on(table.depositStripePiId),
  ]
);

/**
 * Daily availability status per appointment type
 * Tracks which dates are open, full, or blocked
 */
export const bookingCalendarAvailability = pgTable(
  "booking_calendar_availability",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    appointmentTypeId: uuid("appointment_type_id")
      .notNull()
      .references(() => bookingAppointmentTypes.id, { onDelete: "cascade" }),

    // Date
    date: date().notNull(),

    // Availability info
    availableSlots: integer("available_slots"),
    status: varchar({ length: 50 }).notNull().default("open"), // 'open', 'full', 'blocked'
    blockedReason: varchar("blocked_reason", { length: 100 }), // 'holiday', 'event', 'manual', etc.

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("booking_calendar_availability_unique_idx").on(
      table.tenantId,
      table.appointmentTypeId,
      table.date
    ),
    index("booking_calendar_availability_tenant_id_idx").on(table.tenantId),
    index("booking_calendar_availability_type_id_idx").on(table.appointmentTypeId),
    index("booking_calendar_availability_date_idx").on(table.date),
    index("booking_calendar_availability_status_idx").on(table.status),
  ]
);

/**
 * Sync audit log for integration operations
 * Tracks Google Calendar sync, availability fetches, etc.
 */
export const bookingSyncLog = pgTable(
  "booking_sync_log",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),

    // Action details
    action: varchar({ length: 100 }).notNull(), // 'create_event', 'update_event', 'delete_event', 'fetch_availability'
    resourceType: varchar("resource_type", { length: 100 }).notNull(), // 'appointment', 'availability', 'calendar_sync'
    externalId: varchar("external_id", { length: 500 }), // Google event ID, etc.

    // Status tracking
    status: varchar({ length: 50 }).notNull(), // 'pending', 'completed', 'failed'
    errorMessage: text("error_message"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("booking_sync_log_tenant_id_idx").on(table.tenantId),
    index("booking_sync_log_status_idx").on(table.status),
    index("booking_sync_log_created_at_idx").on(table.createdAt),
    index("booking_sync_log_external_id_idx").on(table.externalId),
  ]
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BookingAppointmentType = typeof bookingAppointmentTypes.$inferSelect;
export type BookingAppointmentTypeInsert = typeof bookingAppointmentTypes.$inferInsert;

export type BookingAvailabilityWindow = typeof bookingAvailabilityWindows.$inferSelect;
export type BookingAvailabilityWindowInsert = typeof bookingAvailabilityWindows.$inferInsert;

export type BookingAppointment = typeof bookingAppointments.$inferSelect;
export type BookingAppointmentInsert = typeof bookingAppointments.$inferInsert;

export type BookingCalendarAvailability = typeof bookingCalendarAvailability.$inferSelect;
export type BookingCalendarAvailabilityInsert = typeof bookingCalendarAvailability.$inferInsert;

export type BookingSyncLog = typeof bookingSyncLog.$inferSelect;
export type BookingSyncLogInsert = typeof bookingSyncLog.$inferInsert;

// Appointment status enum
export enum BookingAppointmentStatus {
  Scheduled = "scheduled",
  Confirmed = "confirmed",
  Cancelled = "cancelled",
  NoShow = "no-show",
}

export enum BookingAvailabilityStatus {
  Open = "open",
  Full = "full",
  Blocked = "blocked",
}

export enum BookingSyncStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
}
