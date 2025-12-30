import pool from './database';

const subsidyCalculatorMigrations = [
  // Add subsidy calculator fields to business_programs table
  `
  ALTER TABLE business_programs
  ADD COLUMN IF NOT EXISTS bank_rate DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS subsidy_rate DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS max_loan_term_months INTEGER,
  ADD COLUMN IF NOT EXISTS calculator_enabled BOOLEAN DEFAULT false;
  `,

  // Add comments for clarity
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
      await pool.query(subsidyCalculatorMigrations[i]);
    }

    console.log('✅ Subsidy Calculator migrations completed successfully!');
  } catch (error) {
    console.error('❌ Subsidy Calculator Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runSubsidyCalculatorMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runSubsidyCalculatorMigrations;
