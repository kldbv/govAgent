"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuidanceTables = createGuidanceTables;
const database_1 = __importDefault(require("./database"));
async function createGuidanceTables() {
    try {
        console.log('Creating program_guidance table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS program_guidance (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guidance_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(program_id, user_id)
      )
    `);
        console.log('Creating guidance_usage table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS guidance_usage (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_program_guidance_program_user ON program_guidance(program_id, user_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_program_guidance_expires_at ON program_guidance(expires_at);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_guidance_usage_program_id ON guidance_usage(program_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_guidance_usage_created_at ON guidance_usage(created_at);
    `);
        console.log('Guidance tables created successfully!');
    }
    catch (error) {
        console.error('Error creating guidance tables:', error);
        throw error;
    }
}
if (require.main === module) {
    createGuidanceTables()
        .then(() => {
        console.log('Guidance tables migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateGuidanceTables.js.map