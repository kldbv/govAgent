import pool from './database';

async function createInstructionTables() {
  try {
    console.log('Creating program_instructions table...');

    // Table for caching application instructions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program_instructions (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        instructions_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(program_id, user_id)
      )
    `);

    console.log('Creating application_step_progress table...');

    // Table for tracking progress on application steps
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_step_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, program_id, step_number)
      )
    `);

    console.log('Creating instruction_usage table...');

    // Table for tracking instruction usage analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instruction_usage (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    console.log('Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_program_instructions_program_user ON program_instructions(program_id, user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_program_instructions_expires_at ON program_instructions(expires_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_application_step_progress_user_program ON application_step_progress(user_id, program_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_application_step_progress_status ON application_step_progress(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_instruction_usage_program_id ON instruction_usage(program_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_instruction_usage_created_at ON instruction_usage(created_at);
    `);

    console.log('Instruction tables created successfully!');

  } catch (error) {
    console.error('Error creating instruction tables:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createInstructionTables()
    .then(() => {
      console.log('Instruction tables migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createInstructionTables };
