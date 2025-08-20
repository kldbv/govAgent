"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const bpmMigrations = [
    `
  ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS bin VARCHAR(12),
  ADD COLUMN IF NOT EXISTS oked_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS desired_loan_amount DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS business_goals TEXT[],
  ADD COLUMN IF NOT EXISTS business_goals_comments TEXT;
  `,
    `
  ALTER TABLE business_programs 
  ADD COLUMN IF NOT EXISTS supported_regions TEXT[],
  ADD COLUMN IF NOT EXISTS min_loan_amount DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS max_loan_amount DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS oked_filters TEXT[],
  ADD COLUMN IF NOT EXISTS required_documents JSONB,
  ADD COLUMN IF NOT EXISTS application_steps JSONB,
  ADD COLUMN IF NOT EXISTS opens_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMP NULL;
  `,
    `
  CREATE TABLE IF NOT EXISTS oked_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_kz TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT,
    parent_code VARCHAR(10),
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
    `
  CREATE TABLE IF NOT EXISTS methodology_pages (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title_ru TEXT NOT NULL,
    body_ru TEXT NOT NULL,
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
    `
  CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_kz TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT,
    region_type VARCHAR(20) DEFAULT 'region', -- region, city, district
    parent_id INTEGER REFERENCES regions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
    `
  CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_data JSONB NOT NULL,
    extracted_goals TEXT[],
    recommended_filters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
    `
  CREATE INDEX IF NOT EXISTS idx_user_profiles_bin ON user_profiles(bin);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_oked ON user_profiles(oked_code);
  CREATE INDEX IF NOT EXISTS idx_business_programs_regions ON business_programs USING GIN(supported_regions);
  CREATE INDEX IF NOT EXISTS idx_business_programs_oked ON business_programs USING GIN(oked_filters);
  CREATE INDEX IF NOT EXISTS idx_oked_codes_code ON oked_codes(code);
  CREATE INDEX IF NOT EXISTS idx_oked_codes_parent ON oked_codes(parent_code);
  CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
  `,
];
async function runBPMMigrations() {
    try {
        console.log('Starting BPM-aligned database migrations...');
        for (let i = 0; i < bpmMigrations.length; i++) {
            console.log(`Running BPM migration ${i + 1}/${bpmMigrations.length}...`);
            await database_1.default.query(bpmMigrations[i]);
        }
        console.log('✅ All BPM migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ BPM Migration failed:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    runBPMMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = runBPMMigrations;
//# sourceMappingURL=migrateBPM.js.map