import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Warn during build if not configured, but don't fail
if ((!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV !== "development") {
  console.warn(
    "Warning: SUPABASE_URL and SUPABASE_ANON_KEY environment variables not fully configured"
  );
}

// Create Supabase client for REST API access
// May be undefined if environment variables are not set (e.g., during build)
const supabaseClient: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // No session persistence in server context
      },
    })
  : null;

// Re-export with non-null assertion for convenience in server contexts
// This will throw at runtime if supabase is not configured
export const supabase = supabaseClient as SupabaseClient;

// Type-safe query helpers for common operations
export const restClient = {
  // SELECT queries
  async select<T>(
    table: string,
    columns: string = "*",
    options?: { filters?: Record<string, unknown> }
  ): Promise<T[]> {
    if (!supabase) throw new Error("Supabase client not configured");
    let query = supabase.from(table).select(columns);

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T[];
  },

  // Single record select
  async selectOne<T>(
    table: string,
    filters: Record<string, unknown>,
    columns: string = "*"
  ): Promise<T | null> {
    if (!supabase) throw new Error("Supabase client not configured");
    let query = supabase.from(table).select(columns);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.limit(1).single();
    if (error && error.code === "PGRST116") return null; // No rows
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T;
  },

  // INSERT
  async insert<T>(table: string, data: unknown): Promise<T> {
    if (!supabase) throw new Error("Supabase client not configured");
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return result as T;
  },

  // UPSERT (insert or update)
  async upsert<T>(
    table: string,
    data: unknown,
    onConflict?: string
  ): Promise<T> {
    if (!supabase) throw new Error("Supabase client not configured");
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data)
      .select()
      .single();
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return result as T;
  },

  // UPDATE
  async update<T>(
    table: string,
    filters: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Promise<T[]> {
    if (!supabase) throw new Error("Supabase client not configured");
    let query = supabase.from(table).update(updates);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.select();
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T[];
  },

  // DELETE
  async delete(
    table: string,
    filters: Record<string, unknown>
  ): Promise<void> {
    if (!supabase) throw new Error("Supabase client not configured");
    let query = supabase.from(table).delete();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { error } = await query;
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
  },

  // Raw RPC calls for stored procedures
  async rpc<T>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    if (!supabase) throw new Error("Supabase client not configured");
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) {
      console.error("[unknown] Database operation failed:", error);
      throw new Error("Operation failed. Please try again.");
    }
    return data as T;
  },
};
