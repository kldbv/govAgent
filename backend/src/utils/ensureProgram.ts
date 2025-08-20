import pool from './database';

async function ensureProgram(programId: number) {
  try {
    console.log(`Ensuring business_programs has id=${programId} and is_active=true...`);

    // Check if program exists
    const existing = await pool.query('SELECT id FROM business_programs WHERE id = $1', [programId]);
    if (existing.rows.length === 0) {
      console.log('Program not found. Inserting a placeholder program...');
      await pool.query(
        `INSERT INTO business_programs (
          id, title, description, organization, program_type, target_audience,
          funding_amount, application_deadline, requirements, benefits,
          application_process, contact_info, is_active, created_at, updated_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          true,
          NOW(),
          NOW()
        )`,
        [
          programId,
          'Плейсхолдер программы (создан автоматически)',
          'Тестовая программа для отладки подачи заявок.',
          'Demo Org',
          'грант',
          'Тестовые пользователи',
          1000000,
          null,
          'Минимальные требования для теста',
          'Без преимуществ (тест)',
          'Заполните форму и отправьте заявку',
          'support@example.com'
        ]
      );

      // Fix sequence if necessary (in case explicit id is above current sequence)
      await pool.query(
        `SELECT setval(pg_get_serial_sequence('business_programs','id'), (SELECT GREATEST(MAX(id), 1) FROM business_programs))`
      );
      console.log('Inserted placeholder program and adjusted sequence.');
    } else {
      console.log('Program exists. Ensuring it is active...');
      await pool.query('UPDATE business_programs SET is_active = true, updated_at = NOW() WHERE id = $1', [programId]);
      console.log('Program set to active.');
    }

    console.log('Done.');
  } catch (error) {
    console.error('ensureProgram failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  const idArg = process.env.PROGRAM_ID || process.argv[2] || '11';
  const programId = parseInt(idArg, 10);
  if (!programId || Number.isNaN(programId)) {
    console.error('Invalid PROGRAM_ID');
    process.exit(1);
  }
  ensureProgram(programId);
}

export default ensureProgram;

