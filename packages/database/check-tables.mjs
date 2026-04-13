import postgres from 'postgres';

async function checkTables() {
  const dbUrl = "postgresql://postgres:8W%25%21l5%5EuJ2tSlvMu@db.pmuqyodmqincefdolkcm.supabase.co:5432/postgres";
  const sql = postgres(dbUrl);
  
  try {
    const result = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('expense_categories', 'transaction_categorizations')
    `;
    console.log('Tables found:');
    result.forEach(row => console.log(`  - ${row.tablename}`));
    
    if (result.length === 0) {
      console.log('⚠ No tables found!');
      // Check what tables do exist related to accounting
      const allTables = await sql`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `;
      console.log('\nAll public tables:');
      allTables.filter(t => t.tablename.includes('bank') || t.tablename.includes('transaction') || t.tablename.includes('expense')).forEach(row => console.log(`  - ${row.tablename}`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
