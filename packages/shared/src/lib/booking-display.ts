/**
 * Display names for bookings.
 *
 * Title = "ClientName's AppointmentTypeName".
 * The appointment type name is always used as-is — genre info is shown
 * separately via the genre badge, not baked into the title.
 */

/**
 * Build the possessive form of a client name ("Sam & Kieran's", "James'").
 */
function possessive(name: string): string {
  const trimmed = name.trim();
  return trimmed.endsWith("s") ? `${trimmed}'` : `${trimmed}'s`;
}

/**
 * Kept for backward compatibility with notification code that calls this.
 * Returns null — genre is no longer used to override booking titles.
 */
export function getBookingGenreSuffix(_jobType?: string | null): string | null {
  return null;
}

/**
 * Resolve the display name for a booking.
 * e.g. "Sam & Kieran's Planning Call", "Danielle & Andrew's Portrait Session"
 */
export function getBookingDisplayName(
  appointmentTypeName: string,
  _jobType?: string | null,
  clientName?: string | null,
): string {
  if (!clientName) return appointmentTypeName;
  return `${possessive(clientName)} ${appointmentTypeName}`;
}
