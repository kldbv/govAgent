"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatHistoryTable = createChatHistoryTable;
const database_1 = __importDefault(require("./database"));
async function createChatHistoryTable() {
    try {
        console.log('Creating chat_history table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        intent VARCHAR(50),
        extracted_data JSONB,
        confidence DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
    `);
        console.log('Chat history table created successfully!');
    }
    catch (error) {
        console.error('Error creating chat history table:', error);
        throw error;
    }
}
if (require.main === module) {
    createChatHistoryTable()
        .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateChatHistory.js.map