"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTestData = seedTestData;
const database_1 = __importDefault(require("./database"));
async function seedTestData() {
    try {
        const existingPrograms = await database_1.default.query('SELECT COUNT(*) FROM business_programs');
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
            await database_1.default.query(`
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
        const userResult = await database_1.default.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['user']);
        if (userResult.rows.length === 0) {
            const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
            const hashedPassword = await bcrypt.hash('user123', 10);
            const newUser = await database_1.default.query(`
        INSERT INTO users (email, full_name, password, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, ['user@test.kz', 'Тест Пользователь', hashedPassword, 'user']);
            try {
                await database_1.default.query(`
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
            }
            catch (profileError) {
                console.log('⚠️ Could not create test user profile (optional):', profileError instanceof Error ? profileError.message : String(profileError));
            }
            console.log('✅ Test user created');
        }
        console.log('✅ Test data seeding completed');
    }
    catch (error) {
        console.error('Error seeding test data:', error);
        throw error;
    }
}
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
//# sourceMappingURL=seedTestData.js.map