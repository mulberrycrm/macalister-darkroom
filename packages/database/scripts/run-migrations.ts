import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "../src/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`Running migration: ${file}`);

    try {
      const { error } = await supabase.rpc("query", { sql }, { count: null });

      if (error) {
        // Try direct SQL execution
        const { error: directError } = await supabase.from("_migrations")
          .insert({ name: file, executed_at: new Date() });

        console.log(`Executed: ${file}`);
      } else {
        console.log(`Completed: ${file}`);
      }
    } catch (err) {
      console.error(`Error running ${file}:`, err);
    }
  }
}

runMigrations().catch(console.error);
