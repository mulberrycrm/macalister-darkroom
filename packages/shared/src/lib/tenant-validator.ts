import { logger } from "@crm/shared/lib/logger";

/**
 * Validates user has access to a specific tenant
 * Returns tenantId or throws 403
 */
export function validateTenant(user: any): string {
  if (!user) {
    throw new Error("Unauthorized: No user");
  }

  const tenantId = user.tenantId || user.id;
  if (!tenantId) {
    throw new Error("Forbidden: No tenant context");
  }

  return tenantId;
}

/**
 * Validates user can access a record in their tenant
 * Checks record exists and belongs to user's tenant
 */
export async function validateRecordOwnership(
  db: any,
  table: string,
  recordId: string,
  tenantId: string,
  columnName: string = "id"
): Promise<boolean> {
  try {
    const result = await db
      .select({ id: db.schema[table][columnName] })
      .from(db.schema[table])
      .where(
        db.and(
          db.eq(db.schema[table][columnName], recordId),
          db.eq(db.schema[table]["tenant_id"], tenantId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    logger.error("[tenant-validator] Error checking record ownership", {
      table,
      recordId,
      error,
    });
    return false;
  }
}

/**
 * Safely extract and validate pagination parameters
 */
export function validatePagination(limit: any, offset: any) {
  const parsedLimit = Math.min(Math.max(parseInt(limit || "100"), 1), 500);
  const parsedOffset = Math.max(parseInt(offset || "0"), 0);
  return { limit: parsedLimit, offset: parsedOffset };
}

/**
 * Safely validate and parse date strings
 */
export function validateDateRange(from: string | undefined, to: string | undefined) {
  const now = new Date();
  const maxDaysBack = 730; // 2 years max

  let fromDate = from;
  if (from) {
    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new Error("Invalid from date format. Use YYYY-MM-DD");
    }
    // Check not too far in past
    const parsed = new Date(from);
    const daysDiff = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDaysBack) {
      throw new Error(`Cannot query more than ${maxDaysBack} days in past`);
    }
  }

  let toDate = to;
  if (to) {
    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new Error("Invalid to date format. Use YYYY-MM-DD");
    }
    // Check not in future
    const parsed = new Date(to);
    if (parsed > now) {
      throw new Error("End date cannot be in the future");
    }
  }

  return { from: fromDate, to: toDate };
}
