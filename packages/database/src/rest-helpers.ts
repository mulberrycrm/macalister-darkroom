/**
 * Helper functions for converting drizzle queries to Supabase REST API
 * These provide common patterns used throughout the codebase
 */

import { supabase } from "./rest-client";

interface SelectQuery<T> {
  select: (fields?: string[]) => SelectQuery<T>;
  from: (table: string) => SelectQuery<T>;
  where: (filter: Record<string, unknown>) => SelectQuery<T>;
  innerJoin?: (table: string, on: Record<string, unknown>) => SelectQuery<T>;
  leftJoin?: (table: string, on: Record<string, unknown>) => SelectQuery<T>;
  orderBy: (order: Array<{ column: string; direction: "asc" | "desc" }>) => SelectQuery<T>;
  limit: (limit: number) => SelectQuery<T>;
  offset: (offset: number) => SelectQuery<T>;
  execute: () => Promise<T[]>;
}

/**
 * Helper to select basic fields from a table
 */
export async function selectFrom<T>(
  table: string,
  columns?: string[]
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(columns?.join(",") || "*");

  if (error) {
    console.error("[selectFrom] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }
  return data as T[];
}

/**
 * Select a single record with filters
 */
export async function selectOne<T>(
  table: string,
  filters: Record<string, unknown>,
  columns?: string
): Promise<T | null> {
  let query = supabase
    .from(table)
    .select(columns || "*");

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query.limit(1);
  if (error) {
    console.error("[selectOne] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }

  return data?.[0] as T | null;
}

/**
 * Count records in a table
 */
export async function countFrom(
  table: string,
  filters?: Record<string, unknown>
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact" });

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  }

  const { count, error } = await query;
  if (error) {
    console.error("[countFrom] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }

  return count || 0;
}

/**
 * Insert a record
 */
export async function insertInto<T>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[insertInto] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }
  return result as T;
}

/**
 * Update records
 */
export async function updateTable<T>(
  table: string,
  filters: Record<string, unknown>,
  updates: Record<string, unknown>
): Promise<T[]> {
  let query = supabase.from(table).update(updates);

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query.select();
  if (error) {
    console.error("[updateTable] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }

  return data as T[];
}

/**
 * Delete records
 */
export async function deleteFrom(
  table: string,
  filters: Record<string, unknown>
): Promise<void> {
  let query = supabase.from(table).delete();

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }

  const { error } = await query;
  if (error) {
    console.error("[deleteFrom] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }
}

/**
 * Execute a stored procedure
 */
export async function callRpc<T>(
  name: string,
  params?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    console.error("[callRpc] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }
  return data as T;
}

/**
 * Helper for aggregate sum - often used for financial calculations
 */
export async function sumColumn(
  table: string,
  column: string,
  filters?: Record<string, unknown>
): Promise<number> {
  let query = supabase.from(table).select(column);

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("[sumColumn] Database operation failed:", error);
    throw new Error("Operation failed. Please try again.");
  }

  if (!data || data.length === 0) return 0;

  // Sum the column values
  return (data as any[]).reduce((sum, row) => sum + (Number(row[column]) || 0), 0);
}
