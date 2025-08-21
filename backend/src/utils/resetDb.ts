import pool from './database';

async function resetDatabase() {
  try {
    console.log('Checking and resetting database...');
    
    // Drop all tables if they exist (in correct order due to foreign keys)
    const dropQueries = [
      'DROP TABLE IF EXISTS applications CASCADE;',
      'DROP TABLE IF EXISTS user_profiles CASCADE;',
      'DROP TABLE IF EXISTS business_programs CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
    ];
    
    for (const query of dropQueries) {
      await pool.query(query);
    }
    
    console.log('✅ Database tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('Database reset completed. Now run migrations.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

export default resetDatabase;
