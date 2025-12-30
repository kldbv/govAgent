import pool from './database';

/**
 * Добавляет колонки для калькулятора субсидий в таблицу business_programs
 * Идемпотентная миграция - безопасно запускать многократно
 */
export async function addSubsidyCalculatorColumns(): Promise<void> {
  try {
    console.log('Running subsidy calculator migration...');

    await pool.query(`
      ALTER TABLE business_programs
      ADD COLUMN IF NOT EXISTS bank_rate DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS subsidy_rate DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS max_loan_term_months INTEGER,
      ADD COLUMN IF NOT EXISTS calculator_enabled BOOLEAN DEFAULT false;
    `);

    console.log('✅ Subsidy calculator columns added successfully');
  } catch (error) {
    console.error('❌ Failed to add subsidy calculator columns:', error);
    throw error;
  }
}
