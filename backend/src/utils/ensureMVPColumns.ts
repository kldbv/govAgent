import pool from './database';

export async function ensureMVPColumns() {
  try {
    // Ensure file_content column exists for storing binary file data in MVP
    await pool.query(
      `ALTER TABLE IF EXISTS file_uploads
         ADD COLUMN IF NOT EXISTS file_content BYTEA`
    );

    // Ensure business_programs has all required columns for admin interface
    console.log('Checking business_programs table structure...');
    
    // Check if business_programs table exists and add missing columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_programs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        organization VARCHAR(255),
        program_type VARCHAR(100),
        requirements TEXT,
        funding_amount VARCHAR(100),
        application_deadline DATE,
        benefits TEXT,
        application_process TEXT,
        eligible_regions TEXT[],
        required_documents TEXT[],
        contact_info TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure users table has role column
    await pool.query(`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    `);

    console.log('✅ MVP columns ensured successfully');
  } catch (err) {
    console.error('ensureMVPColumns: failed to ensure columns', err);
  }
}
