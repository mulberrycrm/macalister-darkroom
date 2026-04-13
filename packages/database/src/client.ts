import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as core from "./schema/core";
import * as contactsSchema from "./schema/contacts";
import * as messagesSchema from "./schema/messages";
import * as projectsSchema from "./schema/projects";
import * as commerceSchema from "./schema/commerce";
import * as systemSchema from "./schema/system";
import * as bookingsSchema from "./schema/bookings";
import * as galleriesSchema from "./schema/galleries";
import * as knowledgeBaseSchema from "./schema/knowledge-base";
import * as accountingSchema from "./schema/accounting";
import * as ledgerSchema from "./schema/ledger";

const databaseUrl = process.env["DATABASE_URL"];
const connectionString = databaseUrl ?? "postgresql://crm_app:crm_app@localhost:5432/crm";

// Only log in development if DATABASE_URL is missing
if (!databaseUrl && process.env.NODE_ENV === "development") {
  console.warn('[database/client] ⚠ DATABASE_URL is not set, using localhost fallback (this will fail in production)');
}

export const schema = {
  ...core,
  ...contactsSchema,
  ...messagesSchema,
  ...projectsSchema,
  ...commerceSchema,
  ...systemSchema,
  ...bookingsSchema,
  ...galleriesSchema,
  ...knowledgeBaseSchema,
  ...accountingSchema,
  ...ledgerSchema,
};

// For Cloudflare Workers: create new client per-request
// For Node.js: use singleton for backwards compat
let globalDbInstance: ReturnType<typeof drizzle> | null = null;

function parseDbUrl(url: string) {
  // Manual parse to handle special chars in password that break decodeURIComponent
  const match = url.match(/^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/);
  if (match) {
    return { username: match[1], password: match[2], host: match[3], port: parseInt(match[4]), database: match[5] };
  }
  return null;
}

function createDatabase() {
  try {
    const parsed = parseDbUrl(connectionString);
    const client = parsed
      ? postgres({ ...parsed, prepare: false })
      : postgres(connectionString, { prepare: false });
    return drizzle(client, { schema });
  } catch (error) {
    console.error('[database/client] Failed to create database connection:', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getDb() {
  try {
    return createDatabase();
  } catch (error) {
    console.error('[getDb] Error initializing database:', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Deprecated: use getDb() instead. Kept for backwards compatibility.
// In Cloudflare Workers this creates a new instance; in Node.js it reuses the singleton
export const db = (() => {
  try {
    globalDbInstance = globalDbInstance || createDatabase();
    return globalDbInstance;
  } catch (error) {
    console.error('[database/client] Failed to initialize singleton:', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
})();
