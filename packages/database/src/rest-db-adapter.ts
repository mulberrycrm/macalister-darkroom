/**
 * Adapter layer for migrating from Drizzle ORM to Supabase REST API
 * Provides familiar methods that map to Supabase client operations
 */

import { supabase } from "./rest-client";

interface SelectOptions {
  columns?: string[];
  filters?: Record<string, unknown>;
  orderBy?: { column: string; order: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
}

interface UpdateOptions {
  filters: Record<string, unknown>;
}

interface InsertOptions {
  returning?: boolean;
}

/**
 * Adapter for migrations - converts drizzle queries to Supabase REST API calls
 * This is a thin wrapper to ease the migration process
 */
export class RestDbAdapter {
  /**
   * Select all records from a table
   * Example: db.select().from(contacts).where(eq(id, "123"))
   */
  static async selectAll<T>(
    table: string,
    options: SelectOptions = {}
  ): Promise<T[]> {
    let query = supabase.from(table).select(options.columns?.join(",") || "*");

    // Apply filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === "object") {
          // Handle complex filter objects (e.g., { $ilike: "%text%" })
          if ("$ilike" in value) {
            query = query.ilike(key, value.$ilike as string);
          } else if ("$gte" in value) {
            query = query.gte(key, value.$gte);
          } else if ("$lte" in value) {
            query = query.lte(key, value.$lte);
          } else if ("$gt" in value) {
            query = query.gt(key, value.$gt);
          } else if ("$lt" in value) {
            query = query.lt(key, value.$lt);
          } else if ("$ne" in value) {
            query = query.neq(key, value.$ne);
          }
        } else {
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (options.orderBy) {
      for (const { column, order } of options.orderBy) {
        query = query.order(column, { ascending: order === "asc" });
      }
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T[];
  }

  /**
   * Select a single record
   */
  static async selectOne<T>(
    table: string,
    filters: Record<string, unknown>,
    columns?: string
  ): Promise<T | null> {
    let query = supabase
      .from(table)
      .select(columns || "*")
      .limit(1);

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;
    if (error && (error as any).code === "PGRST116") return null;
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data?.[0] as T | null;
  }

  /**
   * Insert a record
   */
  static async insert<T>(
    table: string,
    data: Record<string, unknown>,
    options: InsertOptions = { returning: true }
  ): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    if (!result || result.length === 0) {
      throw new Error("Failed to insert record: no data returned");
    }
    return result[0] as T;
  }

  /**
   * Insert multiple records
   */
  static async insertMany<T>(
    table: string,
    data: Record<string, unknown>[],
    options: InsertOptions = { returning: true }
  ): Promise<T[]> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return (result as T[]) || [];
  }

  /**
   * Update records
   */
  static async update<T>(
    table: string,
    filters: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Promise<T[]> {
    let query = supabase.from(table).update(updates);

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query.select();
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return (data as T[]) || [];
  }

  /**
   * Delete records
   */
  static async delete(
    table: string,
    filters: Record<string, unknown>
  ): Promise<void> {
    let query = supabase.from(table).delete();

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }

    const { error } = await query;
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
  }

  /**
   * Call a stored procedure (RPC)
   */
  static async rpc<T>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T;
  }

  /**
   * Execute raw RPC query
   */
  static async rawRpc<T>(
    query: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    // For complex raw queries, use the SQL function
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: query,
      params: params || {},
    });
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T;
  }
}

/**
 * Helper functions for common patterns
 */

export async function selectWithSearch<T>(
  table: string,
  searchFields: string[],
  searchTerm: string,
  filters?: Record<string, unknown>
): Promise<T[]> {
  const terms = searchTerm
    .split(" ")
    .map((t) => `%${t.replace(/[%_\\]/g, "\\$&")}%`);

  // Build a WHERE clause that searches across multiple fields
  let query = supabase.from(table).select("*");

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  // Apply OR condition across search fields
  for (const field of searchFields) {
    for (const term of terms) {
      query = query.or(`${field}.ilike.${term}`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("[selectWithSearch] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }
  return data as T[];
}

/**
 * Convert Drizzle WHERE conditions to Supabase filter object
 * This helps with migration where complex WHERE clauses exist
 */
export function buildFilters(conditions: Record<string, unknown>) {
  return Object.entries(conditions).reduce(
    (acc, [key, value]) => {
      if (value === undefined || value === null) return acc;

      if (value === true) {
        acc[key] = true;
      } else if (value === false) {
        acc[key] = false;
      } else if (Array.isArray(value)) {
        acc[`${key}.$in`] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
}
