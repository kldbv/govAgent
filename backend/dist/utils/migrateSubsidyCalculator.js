"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const subsidyCalculatorMigrations = [
    `
  ALTER TABLE business_programs
  ADD COLUMN IF NOT EXISTS bank_rate DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS subsidy_rate DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS max_loan_term_months INTEGER,
  ADD COLUMN IF NOT EXISTS calculator_enabled BOOLEAN DEFAULT false;
  `,
    `
  COMMENT ON COLUMN business_programs.bank_rate IS 'Годовая ставка банка в процентах (например, 20.5)';
  `,
    `
  COMMENT ON COLUMN business_programs.subsidy_rate IS 'Ставка субсидии в процентных пунктах, которая вычитается из ставки банка (например, 8.2)';
  `,
    `
  COMMENT ON COLUMN business_programs.max_loan_term_months IS 'Максимальный срок кредита в месяцах';
  `,
    `
  COMMENT ON COLUMN business_programs.calculator_enabled IS 'Показывать ли калькулятор субсидий для этой программы';
  `,
];
async function runSubsidyCalculatorMigrations() {
    try {
        console.log('Starting Subsidy Calculator migrations...');
        for (let i = 0; i < subsidyCalculatorMigrations.length; i++) {
            console.log(`Running Subsidy Calculator migration ${i + 1}/${subsidyCalculatorMigrations.length}...`);
            await database_1.default.query(subsidyCalculatorMigrations[i]);
        }
        console.log('✅ Subsidy Calculator migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Subsidy Calculator Migration failed:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    runSubsidyCalculatorMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = runSubsidyCalculatorMigrations;
//# sourceMappingURL=migrateSubsidyCalculator.js.map