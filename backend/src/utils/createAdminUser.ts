import pool from './database';
import bcrypt from 'bcrypt';

export async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@businesssupport.kz']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const result = await pool.query(`
      INSERT INTO users (email, full_name, password, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, full_name, role
    `, [
      'admin@businesssupport.kz',
      'System Administrator',
      hashedPassword,
      'admin'
    ]);

    console.log('✅ Admin user created:', result.rows[0]);
    
    // Try to create profile for admin user (optional)
    try {
      await pool.query(`
        INSERT INTO user_profiles (
          user_id, business_type, business_size, industry, region, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        result.rows[0].id,
        'Government',
        'Large',
        'Public Administration',
        'Almaty'
      ]);
      console.log('✅ Admin profile created');
    } catch (profileError) {
      console.log('⚠️ Could not create admin profile (optional):', profileError instanceof Error ? profileError.message : String(profileError));
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Admin user creation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to create admin user:', error);
      process.exit(1);
    });
}
