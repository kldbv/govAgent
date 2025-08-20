"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserRoles = addUserRoles;
const database_1 = __importDefault(require("./database"));
async function addUserRoles() {
    try {
        await database_1.default.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
      CHECK (role IN ('admin', 'manager', 'user'))
    `);
        await database_1.default.query(`
      UPDATE users 
      SET role = 'user' 
      WHERE role IS NULL
    `);
        const adminExists = await database_1.default.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);
        if (parseInt(adminExists.rows[0].count) === 0) {
            console.log('Creating default admin user...');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await database_1.default.query(`
        INSERT INTO users (full_name, email, password_hash, role, created_at)
        VALUES ('Admin User', 'admin@business-support.kz', $1, 'admin', NOW())
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
      `, [hashedPassword]);
            console.log('Default admin user created: admin@business-support.kz / admin123');
        }
        console.log('User roles migration completed successfully');
    }
    catch (error) {
        console.error('Error adding user roles:', error);
        throw error;
    }
}
//# sourceMappingURL=addUserRoles.js.map