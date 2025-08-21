"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = createAdminUser;
const database_1 = __importDefault(require("./database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function createAdminUser() {
    try {
        const existingAdmin = await database_1.default.query('SELECT id FROM users WHERE email = $1', ['admin@businesssupport.kz']);
        if (existingAdmin.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
        const result = await database_1.default.query(`
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
        try {
            await database_1.default.query(`
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
        }
        catch (profileError) {
            console.log('⚠️ Could not create admin profile (optional):', profileError instanceof Error ? profileError.message : String(profileError));
        }
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
}
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
//# sourceMappingURL=createAdminUser.js.map