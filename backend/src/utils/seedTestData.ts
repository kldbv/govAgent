import pool from './database';

export async function seedTestData() {
  try {
    // Check if test data already exists
    const existingPrograms = await pool.query('SELECT COUNT(*) FROM business_programs');
    
    if (parseInt(existingPrograms.rows[0].count) > 0) {
      console.log('Test programs already exist');
      return;
    }

    console.log('Creating test business programs...');

    const testPrograms = [
      {
        title: 'Государственная программа поддержки МСБ',
        description: 'Программа финансовой поддержки для малого и среднего бизнеса в Казахстане',
        organization: 'Министерство национальной экономики РК',
        program_type: 'grant',
        requirements: 'Малый или средний бизнес, зарегистрированный в Казахстане. Наличие бизнес-плана.',
        funding_amount: 'до 5 000 000 тенге',
        application_deadline: '2024-12-31',
        benefits: 'Безвозмездное финансирование, консультационная поддержка',
        application_process: 'Подача заявки через единое окно электронного правительства',
        eligible_regions: ['Астана', 'Алматы', 'Шымкент'],
        required_documents: ['Бизнес-план', 'Справка о регистрации', 'Финансовая отчетность'],
        contact_info: '+7 (7172) 74-22-22',
        is_active: true
      },
      {
        title: 'Программа "Даму" для стартапов',
        description: 'Поддержка инновационных стартапов и технологических проектов',
        organization: 'Фонд развития предпринимательства "Даму"',
        program_type: 'loan',
        requirements: 'Инновационный проект, команда с опытом, готовый MVP',
        funding_amount: 'до 10 000 000 тенге',
        application_deadline: '2024-11-30',
        benefits: 'Льготное кредитование под 6% годовых, менторская поддержка',
        application_process: 'Подача заявки через сайт фонда "Даму"',
        eligible_regions: ['Астана', 'Алматы'],
        required_documents: ['Техническое задание', 'Презентация проекта', 'Резюме команды'],
        contact_info: '+7 (7172) 79-26-00',
        is_active: true
      },
      {
        title: 'Субсидирование процентной ставки',
        description: 'Частичное покрытие процентной ставки по кредитам для МСБ',
        organization: 'АО "Казахстанский фонд гарантирования"',
        program_type: 'subsidy',
        requirements: 'Действующий бизнес от 1 года, отсутствие просроченной задолженности',
        funding_amount: 'субсидирование до 7% от ставки',
        application_deadline: '2024-10-31',
        benefits: 'Снижение процентной ставки по кредиту',
        application_process: 'Обращение в банки-партнеры программы',
        eligible_regions: ['Все регионы Казахстана'],
        required_documents: ['Заявление', 'Бизнес-план', 'Финансовая отчетность'],
        contact_info: '+7 (7172) 79-15-15',
        is_active: true
      }
    ];

    for (const program of testPrograms) {
      await pool.query(`
        INSERT INTO business_programs (
          title, description, organization, program_type, requirements,
          funding_amount, application_deadline, benefits, application_process,
          eligible_regions, required_documents, contact_info, is_active,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
      `, [
        program.title,
        program.description,
        program.organization,
        program.program_type,
        program.requirements,
        program.funding_amount,
        program.application_deadline,
        program.benefits,
        program.application_process,
        program.eligible_regions,
        program.required_documents,
        program.contact_info,
        program.is_active
      ]);
    }

    console.log('✅ Test programs created successfully');

    // Create some test applications
    const userResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['user']);
    if (userResult.rows.length === 0) {
      // Create a test user first
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('user123', 10);
      
      const newUser = await pool.query(`
        INSERT INTO users (email, full_name, password, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, ['user@test.kz', 'Тест Пользователь', hashedPassword, 'user']);

      // Try to create profile for test user (optional)
      try {
        await pool.query(`
          INSERT INTO user_profiles (
            user_id, business_type, business_size, industry, region, created_at
          )
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          newUser.rows[0].id,
          'ТОО',
          'Small',
          'IT',
          'Алматы'
        ]);
      } catch (profileError) {
        console.log('⚠️ Could not create test user profile (optional):', profileError instanceof Error ? profileError.message : String(profileError));
      }

      console.log('✅ Test user created');
    }

    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('Test data seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to seed test data:', error);
      process.exit(1);
    });
}
