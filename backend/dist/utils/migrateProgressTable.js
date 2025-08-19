"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressTable = createProgressTable;
const database_1 = __importDefault(require("./database"));
async function createProgressTable() {
    try {
        console.log('Creating user_guidance_progress table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS user_guidance_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER NOT NULL REFERENCES business_programs(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, program_id, step_number)
      )
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_user_guidance_progress_user_program ON user_guidance_progress(user_id, program_id);
    `);
        console.log('User guidance progress table created successfully!');
    }
    catch (error) {
        console.error('Error creating progress table:', error);
        throw error;
    }
}
if (require.main === module) {
    createProgressTable()
        .then(() => {
        console.log('Progress table migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateProgressTable.js.map