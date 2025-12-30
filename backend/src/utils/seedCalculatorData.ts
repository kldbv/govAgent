import pool from './database';

/**
 * Обновляет тестовые программы с данными калькулятора субсидий
 */
export async function seedCalculatorData(): Promise<void> {
  try {
    console.log('Seeding calculator data for programs...');

    // Обновляем программу типа "Кредит" или "Субсидия" с данными калькулятора
    // Пример на основе документации: Ставка банка 20.5%, Субсидия 8.2%
    const updateResult = await pool.query(`
      UPDATE business_programs
      SET
        bank_rate = 20.5,
        subsidy_rate = 8.2,
        max_loan_term_months = 84,
        calculator_enabled = true
      WHERE program_type IN ('Кредит', 'Субсидия', 'Loan', 'Subsidy', 'Грант')
        AND calculator_enabled IS NOT TRUE
      RETURNING id, title
    `);

    if (updateResult.rowCount && updateResult.rowCount > 0) {
      console.log(`✅ Updated ${updateResult.rowCount} programs with calculator data:`);
      updateResult.rows.forEach(row => {
        console.log(`   - ${row.id}: ${row.title}`);
      });
    } else {
      console.log('ℹ️ No programs needed calculator data update');
    }

    // Если нет программ с калькулятором, создадим тестовую
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count FROM business_programs WHERE calculator_enabled = true
    `);

    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log('Creating sample program with calculator enabled...');
      await pool.query(`
        INSERT INTO business_programs (
          title,
          description,
          organization,
          program_type,
          target_audience,
          funding_amount,
          min_loan_amount,
          max_loan_amount,
          requirements,
          benefits,
          application_process,
          contact_info,
          is_active,
          bank_rate,
          subsidy_rate,
          max_loan_term_months,
          calculator_enabled,
          supported_regions
        ) VALUES (
          'Программа субсидирования процентной ставки для МСБ',
          'Государственная программа субсидирования процентной ставки по кредитам для субъектов малого и среднего предпринимательства. Программа позволяет снизить процентную нагрузку на бизнес за счет компенсации части процентной ставки из бюджета.',
          'АО «Фонд развития предпринимательства «Даму»',
          'Субсидия',
          'Субъекты малого и среднего предпринимательства',
          500000000,
          1000000,
          500000000,
          '• Юридическое лицо или ИП, зарегистрированное в РК
• Срок деятельности не менее 6 месяцев
• Отсутствие задолженности по налогам и обязательным платежам
• Наличие положительной кредитной истории
• Деятельность в приоритетных отраслях экономики',
          '• Снижение процентной ставки до 6% годовых
• Субсидирование до 8.2 п.п. от ставки банка
• Срок кредитования до 84 месяцев
• Возможность получить до 500 млн тенге
• Быстрое рассмотрение заявки',
          '1. Подать заявку через портал или банк-партнер
2. Предоставить необходимые документы
3. Дождаться рассмотрения заявки (до 10 рабочих дней)
4. При положительном решении - заключить договор
5. Получить кредит с субсидированной ставкой',
          'Телефон: +7 (727) 244-50-40
Email: info@damu.kz
Сайт: www.damu.kz',
          true,
          20.5,
          8.2,
          84,
          true,
          ARRAY['ALMATY', 'ASTANA', 'SHYMKENT', 'KARAGANDA', 'AKTOBE']
        )
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Created sample program with calculator');
    }
  } catch (error) {
    console.error('❌ Failed to seed calculator data:', error);
    // Non-critical, don't throw
  }
}

// Run if executed directly
if (require.main === module) {
  seedCalculatorData()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
