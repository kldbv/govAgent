"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPerformanceIndexes = addPerformanceIndexes;
const database_1 = __importDefault(require("./database"));
async function addPerformanceIndexes() {
    try {
        console.log('Adding performance indexes...');
        await database_1.default.query(`
      -- Индекс для быстрого поиска заявок пользователя по программе
      CREATE INDEX IF NOT EXISTS idx_applications_user_program
        ON applications(user_id, program_id);

      -- Индекс для фильтрации заявок по статусу
      CREATE INDEX IF NOT EXISTS idx_applications_status
        ON applications(status);

      -- Индекс для сортировки заявок по дате подачи
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_at
        ON applications(submitted_at DESC NULLS LAST);

      -- Индекс для очистки истекших форм
      CREATE INDEX IF NOT EXISTS idx_program_forms_expires
        ON program_forms(expires_at);

      -- Индекс для фильтрации пользователей по роли
      CREATE INDEX IF NOT EXISTS idx_users_role
        ON users(role);

      -- Полнотекстовый индекс для поиска программ
      CREATE INDEX IF NOT EXISTS idx_programs_fulltext
        ON business_programs
        USING gin(to_tsvector('russian', title || ' ' || description));

      -- Индекс для фильтрации активных программ по типу
      CREATE INDEX IF NOT EXISTS idx_programs_type_active
        ON business_programs(program_type)
        WHERE is_active = true;

      -- Индекс для фильтрации по дедлайну
      CREATE INDEX IF NOT EXISTS idx_programs_deadline
        ON business_programs(application_deadline)
        WHERE is_active = true AND application_deadline IS NOT NULL;

      -- Составной индекс для notification/progress tracking
      CREATE INDEX IF NOT EXISTS idx_guidance_progress_user_program
        ON user_guidance_progress(user_id, program_id);
    `);
        console.log('✅ Performance indexes added successfully');
    }
    catch (error) {
        console.error('❌ Failed to add performance indexes:', error);
    }
}
//# sourceMappingURL=migratePerformanceIndexes.js.map