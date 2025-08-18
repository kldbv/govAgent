"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const kazakhstanRegions = [
    { code: 'AKM', name_kz: 'Ақмола облысы', name_ru: 'Акмолинская область' },
    { code: 'AKT', name_kz: 'Ақтөбе облысы', name_ru: 'Актюбинская область' },
    { code: 'ALA', name_kz: 'Алматы облысы', name_ru: 'Алматинская область' },
    { code: 'ATY', name_kz: 'Атырау облысы', name_ru: 'Атырауская область' },
    { code: 'VKO', name_kz: 'Шығыс Қазақстан облысы', name_ru: 'Восточно-Казахстанская область' },
    { code: 'ZHM', name_kz: 'Жамбыл облысы', name_ru: 'Жамбылская область' },
    { code: 'ZAP', name_kz: 'Батыс Қазақстан облысы', name_ru: 'Западно-Казахстанская область' },
    { code: 'KAR', name_kz: 'Қарағанды облысы', name_ru: 'Карагандинская область' },
    { code: 'KOS', name_kz: 'Қостанай облысы', name_ru: 'Костанайская область' },
    { code: 'KYZ', name_kz: 'Қызылорда облысы', name_ru: 'Кызылординская область' },
    { code: 'MAN', name_kz: 'Маңғыстау облысы', name_ru: 'Мангистауская область' },
    { code: 'YUK', name_kz: 'Түркістан облысы', name_ru: 'Туркестанская область' },
    { code: 'PAV', name_kz: 'Павлодар облысы', name_ru: 'Павлодарская область' },
    { code: 'SEV', name_kz: 'Солтүстік Қазақстан облысы', name_ru: 'Северо-Казахстанская область' },
    { code: 'ULY', name_kz: 'Ұлытау облысы', name_ru: 'Улытауская область' },
    { code: 'AST', name_kz: 'Астана қаласы', name_ru: 'г. Астана', region_type: 'city' },
    { code: 'ALA_CITY', name_kz: 'Алматы қаласы', name_ru: 'г. Алматы', region_type: 'city' },
    { code: 'SHY', name_kz: 'Шымкент қаласы', name_ru: 'г. Шымкент', region_type: 'city' },
];
const okedCodes = [
    { code: 'A', name_kz: 'Ауыл, орман және балық шаруашылығы', name_ru: 'Сельское, лесное и рыбное хозяйство', level: 1 },
    { code: '01', name_kz: 'Өсімдік және мал шаруашылығы, аңшылық және оларға байланысты қызмет көрсету', name_ru: 'Растениеводство и животноводство, охота и предоставление связанных с этим услуг', parent_code: 'A', level: 2 },
    { code: '01.1', name_kz: 'Жылдық дақылдар өсіру', name_ru: 'Выращивание однолетних культур', parent_code: '01', level: 3 },
    { code: 'B', name_kz: 'Тау-кен өндірісі', name_ru: 'Горнодобывающая промышленность и разработка карьеров', level: 1 },
    { code: '05', name_kz: 'Көмір және лигнит өндіру', name_ru: 'Добыча угля и лигнита', parent_code: 'B', level: 2 },
    { code: '06', name_kz: 'Сырой мұнай және табиғи газ өндіру', name_ru: 'Добыча сырой нефти и природного газа', parent_code: 'B', level: 2 },
    { code: 'C', name_kz: 'Өңдеуші өнеркәсіп', name_ru: 'Обрабатывающая промышленность', level: 1 },
    { code: '10', name_kz: 'Азық-түлік өнімдерін өндіру', name_ru: 'Производство пищевых продуктов', parent_code: 'C', level: 2 },
    { code: '11', name_kz: 'Сусындар өндіру', name_ru: 'Производство напитков', parent_code: 'C', level: 2 },
    { code: 'D', name_kz: 'Электр энергиясымен, газбен, бумен және ауа кондиционерімен жабдықтау', name_ru: 'Обеспечение электрической энергией, газом, паром и кондиционированным воздухом', level: 1 },
    { code: 'E', name_kz: 'Су жеткізу; кәрізге су жинау, қалдықтарды басқару және табиғатты қалпына келтіру', name_ru: 'Водоснабжение; водоотведение, организация сбора и утилизации отходов, деятельность по ликвидации загрязнений', level: 1 },
    { code: 'F', name_kz: 'Құрылыс', name_ru: 'Строительство', level: 1 },
    { code: '41', name_kz: 'Ғимараттарды салу', name_ru: 'Строительство зданий', parent_code: 'F', level: 2 },
    { code: '42', name_kz: 'Инженерлік құрылыс', name_ru: 'Инженерное строительство', parent_code: 'F', level: 2 },
    { code: 'G', name_kz: 'Көтерме және бөлшек сауда; автомобильдер мен мотоциклдерді жөндеу', name_ru: 'Торговля оптовая и розничная; ремонт автомобилей и мотоциклов', level: 1 },
    { code: '45', name_kz: 'Автомобильдер мен мотоциклдерді көтерме және бөлшек сауда және жөндеу', name_ru: 'Торговля оптовая и розничная автомобилями и мотоциклами и их ремонт', parent_code: 'G', level: 2 },
    { code: '46', name_kz: 'Көтерме сауда, автомобильдер мен мотоциклдерден басқа', name_ru: 'Торговля оптовая, кроме оптовой торговли автомобилями и мотоциклами', parent_code: 'G', level: 2 },
    { code: '47', name_kz: 'Бөлшек сауда, автомобильдер мен мотоциклдерден басқа', name_ru: 'Торговля розничная, кроме торговли автомобилями и мотоциклами', parent_code: 'G', level: 2 },
    { code: 'H', name_kz: 'Көлік және сақтау', name_ru: 'Транспортировка и хранение', level: 1 },
    { code: 'I', name_kz: 'Тамақтану және тұрақ орындарын ұсыну', name_ru: 'Деятельность гостиниц и предприятий общественного питания', level: 1 },
    { code: '55', name_kz: 'Тұрақ орындарын ұсыну', name_ru: 'Деятельность по предоставлению мест для временного проживания', parent_code: 'I', level: 2 },
    { code: '56', name_kz: 'Тамақтану қызметтері', name_ru: 'Деятельность по предоставлению продуктов питания и напитков', parent_code: 'I', level: 2 },
    { code: 'J', name_kz: 'Ақпарат және байланыс', name_ru: 'Информация и связь', level: 1 },
    { code: '58', name_kz: 'Баспа ісі', name_ru: 'Деятельность издательская', parent_code: 'J', level: 2 },
    { code: '62', name_kz: 'Компьютерлік бағдарламалауды және консалтинг қызметі', name_ru: 'Разработка компьютерного программного обеспечения, консультационные услуги в данной области и другие сопутствующие услуги', parent_code: 'J', level: 2 },
    { code: 'K', name_kz: 'Қаржылық және сақтандыру қызметі', name_ru: 'Финансовая и страховая деятельность', level: 1 },
    { code: 'L', name_kz: 'Жылжымайтын мүлік операциялары', name_ru: 'Операции с недвижимым имуществом', level: 1 },
    { code: 'M', name_kz: 'Кәсіби, ғылыми және техникалық қызмет', name_ru: 'Профессиональная, научная и техническая деятельность', level: 1 },
    { code: '70', name_kz: 'Басқару консалтингі қызметі', name_ru: 'Деятельность головных офисов; консультирование по вопросам управления', parent_code: 'M', level: 2 },
    { code: 'N', name_kz: 'Әкімшілік және қосымша қызмет көрсету', name_ru: 'Деятельность административная и сопутствующие дополнительные услуги', level: 1 },
    { code: 'O', name_kz: 'Мемлекеттік басқару және қорғаныс; міндетті әлеуметтік сақтандыру', name_ru: 'Государственное управление и обеспечение военной безопасности; социальное обеспечение', level: 1 },
    { code: 'P', name_kz: 'Білім беру', name_ru: 'Образование', level: 1 },
    { code: 'Q', name_kz: 'Адамның денсаулығын сақтау және әлеуметтік жұмыс', name_ru: 'Деятельность в области здравоохранения и социальных услуг', level: 1 },
    { code: 'R', name_kz: 'Өнер, ойын-сауық және демалыс', name_ru: 'Деятельность в области искусства, развлечений и отдыха', level: 1 },
    { code: 'S', name_kz: 'Басқа да қызмет түрлері', name_ru: 'Предоставление прочих видов услуг', level: 1 },
];
const enhancedProgramsData = [
    {
        id: 1,
        supported_regions: ['AST', 'ALA_CITY', 'ALA', 'KAR'],
        min_loan_amount: 1000000,
        max_loan_amount: 15000000,
        oked_filters: ['J', '62', 'M', '70'],
        required_documents: {
            main: ['Бизнес-план', 'Устав организации', 'Справка о налоговой задолженности'],
            additional: ['Прототип продукта', 'Техническое задание', 'Резюме команды'],
            deadlines: 'За 2 недели до подачи заявки'
        },
        application_steps: [
            { step: 1, title: 'Подготовка документов', description: 'Соберите все необходимые документы согласно списку', deadline: '2 недели' },
            { step: 2, title: 'Онлайн подача заявки', description: 'Заполните форму на портале digitalkz.gov.kz', deadline: '1 день' },
            { step: 3, title: 'Защита проекта', description: 'Презентация проекта перед экспертной комиссией', deadline: 'По приглашению' },
            { step: 4, title: 'Техническая экспертиза', description: 'Оценка технической составляющей проекта', deadline: '1 месяц' }
        ]
    }
];
async function seedBPMData() {
    try {
        console.log('Starting BPM data seeding...');
        const existingRegions = await database_1.default.query('SELECT COUNT(*) FROM regions');
        const regionCount = parseInt(existingRegions.rows[0].count);
        if (regionCount === 0) {
            console.log('Inserting Kazakhstan regions...');
            for (const region of kazakhstanRegions) {
                await database_1.default.query(`INSERT INTO regions (code, name_kz, name_ru, region_type)
           VALUES ($1, $2, $3, $4)`, [region.code, region.name_kz, region.name_ru, region.region_type || 'region']);
            }
            console.log(`✅ Inserted ${kazakhstanRegions.length} regions`);
        }
        else {
            console.log(`Regions already exist (${regionCount} records), skipping...`);
        }
        const existingOked = await database_1.default.query('SELECT COUNT(*) FROM oked_codes');
        const okedCount = parseInt(existingOked.rows[0].count);
        if (okedCount === 0) {
            console.log('Inserting OKED codes...');
            for (const oked of okedCodes) {
                await database_1.default.query(`INSERT INTO oked_codes (code, name_kz, name_ru, parent_code, level)
           VALUES ($1, $2, $3, $4, $5)`, [oked.code, oked.name_kz, oked.name_ru, oked.parent_code || null, oked.level]);
            }
            console.log(`✅ Inserted ${okedCodes.length} OKED codes`);
        }
        else {
            console.log(`OKED codes already exist (${okedCount} records), skipping...`);
        }
        console.log('Updating programs with BPM-aligned data...');
        const programData = enhancedProgramsData[0];
        await database_1.default.query(`UPDATE business_programs 
       SET supported_regions = $1, min_loan_amount = $2, max_loan_amount = $3, 
           oked_filters = $4, required_documents = $5, application_steps = $6
       WHERE id = $7`, [
            programData.supported_regions,
            programData.min_loan_amount,
            programData.max_loan_amount,
            programData.oked_filters,
            JSON.stringify(programData.required_documents),
            JSON.stringify(programData.application_steps),
            programData.id
        ]);
        console.log('✅ BPM data seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ BPM data seeding failed:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    seedBPMData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = seedBPMData;
//# sourceMappingURL=seedBPMData.js.map