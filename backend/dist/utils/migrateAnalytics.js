"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsTable = createAnalyticsTable;
const database_1 = __importDefault(require("./database"));
async function createAnalyticsTable() {
    try {
        console.log('Creating analytics_events table...');
        await database_1.default.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(100) NOT NULL,
        event_data JSONB DEFAULT '{}'::jsonb,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON analytics_events(event_category);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
    `);
        await database_1.default.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_data ON analytics_events USING GIN(event_data);
    `);
        console.log('Analytics table created successfully!');
    }
    catch (error) {
        console.error('Error creating analytics table:', error);
        throw error;
    }
}
if (require.main === module) {
    createAnalyticsTable()
        .then(() => {
        console.log('Analytics migration completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrateAnalytics.js.map