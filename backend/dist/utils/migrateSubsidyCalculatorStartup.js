"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSubsidyCalculatorColumns = addSubsidyCalculatorColumns;
const database_1 = __importDefault(require("./database"));
async function addSubsidyCalculatorColumns() {
    try {
        console.log('Running subsidy calculator migration...');
        await database_1.default.query(`
      ALTER TABLE business_programs
      ADD COLUMN IF NOT EXISTS bank_rate DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS subsidy_rate DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS max_loan_term_months INTEGER,
      ADD COLUMN IF NOT EXISTS calculator_enabled BOOLEAN DEFAULT false;
    `);
        console.log('✅ Subsidy calculator columns added successfully');
    }
    catch (error) {
        console.error('❌ Failed to add subsidy calculator columns:', error);
        throw error;
    }
}
//# sourceMappingURL=migrateSubsidyCalculatorStartup.js.map