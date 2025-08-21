"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function resetDatabase() {
    try {
        console.log('Checking and resetting database...');
        const dropQueries = [
            'DROP TABLE IF EXISTS applications CASCADE;',
            'DROP TABLE IF EXISTS user_profiles CASCADE;',
            'DROP TABLE IF EXISTS business_programs CASCADE;',
            'DROP TABLE IF EXISTS users CASCADE;',
            'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
        ];
        for (const query of dropQueries) {
            await database_1.default.query(query);
        }
        console.log('✅ Database tables dropped successfully');
    }
    catch (error) {
        console.error('❌ Reset failed:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    resetDatabase()
        .then(() => {
        console.log('Database reset completed. Now run migrations.');
        process.exit(0);
    })
        .catch(() => process.exit(1));
}
exports.default = resetDatabase;
//# sourceMappingURL=resetDb.js.map