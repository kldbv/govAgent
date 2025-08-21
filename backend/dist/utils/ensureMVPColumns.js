"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMVPColumns = ensureMVPColumns;
const database_1 = __importDefault(require("./database"));
async function ensureMVPColumns() {
    try {
        await database_1.default.query(`ALTER TABLE IF EXISTS file_uploads
         ADD COLUMN IF NOT EXISTS file_content BYTEA`);
        console.log('Checking business_programs table structure...');
        await database_1.default.query(`
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
        await database_1.default.query(`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    `);
        console.log('✅ MVP columns ensured successfully');
    }
    catch (err) {
        console.error('ensureMVPColumns: failed to ensure columns', err);
    }
}
//# sourceMappingURL=ensureMVPColumns.js.map