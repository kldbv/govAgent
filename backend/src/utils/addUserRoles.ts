import pool from './database';

export async function addUserRoles() {
  try {
    // Add role column to users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
      CHECK (role IN ('admin', 'manager', 'user'))
    `);

    // Update existing users to have 'user' role if role is null
    await pool.query(`
      UPDATE users 
      SET role = 'user' 
      WHERE role IS NULL
    `);

    // Create a default admin user if none exists
    const adminExists = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);

    if (parseInt(adminExists.rows[0].count) === 0) {
      console.log('Creating default admin user...');
      // Create admin user (password: admin123)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(`
        INSERT INTO users (full_name, email, password_hash, role, created_at)
        VALUES ('Admin User', 'admin@business-support.kz', $1, 'admin', NOW())
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
      `, [hashedPassword]);
      
      console.log('Default admin user created: admin@business-support.kz / admin123');
    }

    console.log('User roles migration completed successfully');
  } catch (error) {
    console.error('Error adding user roles:', error);
    throw error;
  }
}
