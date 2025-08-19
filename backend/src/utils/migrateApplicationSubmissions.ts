import pool from './database';

async function createApplicationSubmissionsTable() {
  try {
    console.log('Creating application_submissions table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        submission_reference VARCHAR(100),
        notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, program_id)
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_application_submissions_user_program ON application_submissions(user_id, program_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_application_submissions_submitted_at ON application_submissions(submitted_at);
    `);

    console.log('Application submissions table created successfully!');

  } catch (error) {
    console.error('Error creating application submissions table:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createApplicationSubmissionsTable()
    .then(() => {
      console.log('Application submissions migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createApplicationSubmissionsTable };
