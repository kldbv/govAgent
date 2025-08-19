"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionService = void 0;
const openai_1 = __importDefault(require("openai"));
const database_1 = __importDefault(require("../utils/database"));
class InstructionService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateApplicationInstructions(programId, userProfile) {
        const program = await this.getProgramById(programId);
        if (!program) {
            throw new Error('Program not found');
        }
        let instructions = await this.getCachedInstructions(programId, userProfile.user_id);
        if (!instructions) {
            instructions = await this.generateAIInstructions(program, userProfile);
            await this.cacheInstructions(programId, userProfile.user_id, instructions);
        }
        return instructions;
    }
    async getProgramById(programId) {
        const result = await database_1.default.query(`SELECT id, title, description, organization, program_type, requirements,
              application_process, application_deadline, contact_info
       FROM business_programs 
       WHERE id = $1 AND is_active = true`, [programId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async generateAIInstructions(program, userProfile) {
        const systemPrompt = `
    You are an expert consultant for Kazakhstan business support programs. Generate detailed, step-by-step application instructions for businesses.

    Program Details:
    - Title: ${program.title}
    - Organization: ${program.organization}
    - Type: ${program.program_type}
    - Requirements: ${program.requirements}
    - Process: ${program.application_process}
    - Deadline: ${program.application_deadline}
    - Contact: ${program.contact_info}

    User Business Profile:
    - Type: ${userProfile.business_type}
    - Size: ${userProfile.business_size}
    - Industry: ${userProfile.industry}
    - Location: ${userProfile.location}
    - BIN: ${userProfile.bin || 'Not provided'}
    - OKED: ${userProfile.oked_code || 'Not provided'}
    - Region: ${userProfile.region || userProfile.location}

    Generate comprehensive application instructions that include:
    1. Clear step-by-step process tailored to this business profile
    2. Realistic time estimates for each step
    3. Required documents and contact information
    4. Common mistakes to avoid
    5. Success tips and best practices
    6. Submission and follow-up procedures

    Focus on Kazakhstan-specific processes, legal requirements, and government procedures.
    Make instructions practical and actionable for the specific business type and size.

    Respond in JSON format matching the ApplicationInstructions interface.
    Ensure all text is in Russian where appropriate for Kazakhstan context.
    `;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Generate detailed application instructions for this program and business profile.`
                    }
                ],
                temperature: 0.2,
                max_tokens: 3000
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            const instructions = JSON.parse(response);
            instructions.program_id = program.id;
            instructions.program_title = program.title;
            instructions.organization = program.organization;
            return instructions;
        }
        catch (error) {
            console.error('Error generating AI instructions:', error);
            return this.generateFallbackInstructions(program, userProfile);
        }
    }
    generateFallbackInstructions(program, userProfile) {
        return {
            program_id: program.id,
            program_title: program.title,
            organization: program.organization,
            application_deadline: program.application_deadline || 'Уточните в организации',
            total_estimated_time: '2-4 недели',
            overview: `Пошаговая инструкция по подаче заявки на программу ${program.title}. Внимательно следуйте каждому шагу и соблюдайте указанные сроки.`,
            prerequisites: [
                'Действующая государственная регистрация бизнеса',
                'Актуальные учредительные документы',
                'Соответствие требованиям программы'
            ],
            steps: [
                {
                    step_number: 1,
                    title: 'Подготовка документов',
                    description: 'Соберите и подготовьте все необходимые документы',
                    required_documents: [
                        'Справка о государственной регистрации',
                        'Устав предприятия (нотариально заверенный)',
                        'Справка об отсутствии налоговой задолженности',
                        'Бизнес-план проекта'
                    ],
                    estimated_duration: '5-7 рабочих дней',
                    instructions: [
                        'Обратитесь в ЦОН или на портал egov.kz за справками',
                        'Подготовьте нотариально заверенные копии документов',
                        'Проверьте актуальность всех справок'
                    ],
                    tips: [
                        'Заказывайте справки заранее - процесс может занять время',
                        'Делайте несколько копий каждого документа',
                        'Сохраните электронные версии документов'
                    ],
                    common_errors: [
                        'Просроченные справки',
                        'Отсутствие нотариального заверения',
                        'Неполный пакет документов'
                    ]
                },
                {
                    step_number: 2,
                    title: 'Подача заявки',
                    description: 'Подача заявки через официальные каналы',
                    required_documents: ['Полный пакет документов из Шага 1'],
                    estimated_duration: '1-2 рабочих дня',
                    instructions: [
                        'Заполните заявку на официальном сайте или в офисе',
                        'Приложите все необходимые документы',
                        'Получите подтверждение подачи заявки'
                    ],
                    tips: [
                        'Сохраните номер заявки для отслеживания',
                        'Проверьте правильность указанных контактных данных'
                    ],
                    common_errors: [
                        'Неправильно заполненная форма заявки',
                        'Отсутствие обязательных документов'
                    ]
                }
            ],
            final_submission: {
                method: 'online',
                submission_portal: 'Портал организации или egov.kz',
                required_format: ['PDF документы', 'Электронная подпись']
            },
            follow_up: {
                review_time: '10-15 рабочих дней',
                notification_method: 'По электронной почте и SMS',
                contact_for_questions: {
                    phone: '+7 (727) 000-00-00',
                    email: 'support@program.gov.kz'
                }
            },
            success_metrics: {
                approval_rate: '60-80%',
                average_funding_amount: 'Зависит от программы',
                typical_processing_time: '15-30 дней'
            }
        };
    }
    async cacheInstructions(programId, userId, instructions) {
        try {
            await database_1.default.query(`INSERT INTO program_instructions (program_id, user_id, instructions_data, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 days')
         ON CONFLICT (program_id, user_id) 
         DO UPDATE SET instructions_data = EXCLUDED.instructions_data, 
                       created_at = NOW(),
                       expires_at = NOW() + INTERVAL '15 days'`, [programId, userId, JSON.stringify(instructions)]);
        }
        catch (error) {
            console.error('Error caching instructions:', error);
        }
    }
    async getCachedInstructions(programId, userId) {
        try {
            const result = await database_1.default.query(`SELECT instructions_data 
         FROM program_instructions 
         WHERE program_id = $1 AND user_id = $2 AND expires_at > NOW()`, [programId, userId]);
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].instructions_data);
            }
        }
        catch (error) {
            console.error('Error retrieving cached instructions:', error);
        }
        return null;
    }
    async updateStepStatus(programId, userId, stepNumber, status, notes) {
        try {
            await database_1.default.query(`INSERT INTO application_step_progress 
         (user_id, program_id, step_number, status, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, program_id, step_number)
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()`, [userId, programId, stepNumber, status, notes]);
        }
        catch (error) {
            console.error('Error updating step status:', error);
            throw error;
        }
    }
    async getApplicationProgress(programId, userId) {
        try {
            const result = await database_1.default.query(`SELECT step_number, status, notes, updated_at
         FROM application_step_progress
         WHERE user_id = $1 AND program_id = $2
         ORDER BY step_number`, [userId, programId]);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting application progress:', error);
            return [];
        }
    }
    async trackInstructionUsage(programId, userId, action) {
        try {
            await database_1.default.query(`INSERT INTO instruction_usage (program_id, user_id, action, created_at)
         VALUES ($1, $2, $3, NOW())`, [programId, userId, action]);
        }
        catch (error) {
            console.error('Error tracking instruction usage:', error);
        }
    }
}
exports.InstructionService = InstructionService;
//# sourceMappingURL=InstructionService.js.map