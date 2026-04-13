const postgres = require('postgres');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

// Read the migration file
const migrationSql = fs.readFileSync(
  path.join(__dirname, 'src/migrations/0004_tough_rage.sql'),
  'utf-8'
);

// Split SQL statements by the arrow-breakpoint comments
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

// Execute each statement
async function applyMigration() {
  try {
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      await sql.unsafe(statement);
    }
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
