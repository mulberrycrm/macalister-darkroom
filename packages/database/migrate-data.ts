import postgres from "postgres";

const localDb = postgres("postgresql://crm_app:crm_app@localhost:5432/crm");
const remoteDb = postgres("postgresql://postgres.pmuqyodmqincefdolkcm:8W%25%21l5%5EuJ2tSlvMu@macalister-sm.db.supabase.co:5432/postgres?sslmode=require");

async function migrate() {
  try {
    console.log("Starting data migration...");

    // Get all tables
    const tables = await localDb`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`Found ${tables.length} tables\n`);

    for (const { tablename } of tables) {
      try {
        const data = await localDb`SELECT * FROM ${localDb(tablename)}`;
        if (data.length > 0) {
          console.log(`Migrating ${tablename}... (${data.length} rows)`);
          // Insert in batches of 100
          for (let i = 0; i < data.length; i += 100) {
            const batch = data.slice(i, i + 100);
            await remoteDb`INSERT INTO ${remoteDb(tablename)} ${remoteDb(batch)}`;
          }
        } else {
          console.log(`Skipping ${tablename} (empty)`);
        }
      } catch (err: any) {
        console.log(`⚠ ${tablename}: ${err.message}`);
      }
    }
    console.log("\n✓ Migration complete!");
  } catch (e: any) {
    console.error("Fatal error:", e.message);
    process.exit(1);
  } finally {
    await localDb.end();
    await remoteDb.end();
  }
}

migrate();
