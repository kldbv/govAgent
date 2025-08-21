import pool from './database';

const migrations = [
  // Users table
  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // User profiles table
  `
  CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('startup', 'sme', 'individual', 'ngo')),
    business_size VARCHAR(50) NOT NULL CHECK (business_size IN ('micro', 'small', 'medium', 'large')),
    industry VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    annual_revenue DECIMAL(15, 2),
    employee_count INTEGER CHECK (employee_count >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );
  `,

  // Business programs table
  `
  CREATE TABLE IF NOT EXISTS business_programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    organization VARCHAR(255) NOT NULL,
    program_type VARCHAR(100) NOT NULL,
    target_audience TEXT NOT NULL,
    funding_amount DECIMAL(15, 2),
    application_deadline DATE,
    requirements TEXT NOT NULL,
    benefits TEXT NOT NULL,
    application_process TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,

  // Applications table
  `
  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES business_programs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
    application_data JSONB NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, program_id)
  );
  `,

  // Add indexes for better performance
  `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_business_programs_active ON business_programs(is_active);
  CREATE INDEX IF NOT EXISTS idx_business_programs_type ON business_programs(program_type);
  CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
  CREATE INDEX IF NOT EXISTS idx_applications_program_id ON applications(program_id);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `,

  // Add updated_at trigger function
  `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
  `,

  // Add triggers for updated_at
  `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
      CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_programs_updated_at') THEN
      CREATE TRIGGER update_business_programs_updated_at BEFORE UPDATE ON business_programs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at') THEN
      CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END $$;
  `,
];

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await pool.query(migrations[i]);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations;
