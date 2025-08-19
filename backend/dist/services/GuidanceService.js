"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidanceService = void 0;
const openai_1 = __importDefault(require("openai"));
const database_1 = __importDefault(require("../utils/database"));
class GuidanceService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateDocumentGuidance(programId, userProfile) {
        const program = await this.getProgramById(programId);
        if (!program) {
            throw new Error('Program not found');
        }
        const guidance = await this.generateAIGuidance(program, userProfile);
        await this.cacheGuidance(programId, userProfile.user_id, guidance);
        return guidance;
    }
    async getProgramById(programId) {
        const result = await database_1.default.query(`SELECT id, title, description, organization, program_type, requirements,
              required_documents, application_process, contact_info
       FROM business_programs 
       WHERE id = $1 AND is_active = true`, [programId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    async generateAIGuidance(program, userProfile) {
        const systemPrompt = `
    You are an expert consultant for Kazakhstan business support programs. Generate detailed document preparation guidance for businesses applying to government programs.

    Program Details:
    - Title: ${program.title}
    - Organization: ${program.organization}
    - Type: ${program.program_type}
    - Requirements: ${program.requirements}
    - Process: ${program.application_process}

    User Business Profile:
    - Type: ${userProfile.business_type}
    - Size: ${userProfile.business_size}
    - Industry: ${userProfile.industry}
    - Location: ${userProfile.location}
    - BIN: ${userProfile.bin || 'Not provided'}
    - OKED: ${userProfile.oked_code || 'Not provided'}
    - Funding Stage: ${userProfile.funding_stage}

    Generate a comprehensive document preparation guide with:
    1. Overview and success tips
    2. Complete document requirements list
    3. Step-by-step preparation process
    4. Time estimates and difficulty assessment
    5. Common mistakes to avoid
    6. Contact information

    Focus on Kazakhstan-specific requirements, legal documents, and business regulations.
    Provide practical, actionable advice tailored to the user's business profile.

    Respond in JSON format matching the DocumentGuidance interface.
    `;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Generate detailed document preparation guidance for this program and business profile.`
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            const guidance = JSON.parse(response);
            guidance.program_id = program.id;
            guidance.program_title = program.title;
            return guidance;
        }
        catch (error) {
            console.error('Error generating AI guidance:', error);
            return this.generateFallbackGuidance(program, userProfile);
        }
    }
    generateFallbackGuidance(program, userProfile) {
        return {
            program_id: program.id,
            program_title: program.title,
            overview: `Подготовка документов для программы ${program.title}. Рекомендуем внимательно изучить требования и подготовить все необходимые документы заранее.`,
            total_estimated_time: '2-4 недели',
            difficulty_level: 'Medium',
            success_rate: '60-80%',
            document_requirements: [
                {
                    name: 'Справка о государственной регистрации',
                    description: 'Справка из ЦОН или портала egov.kz',
                    required: true,
                    examples: ['Выписка из государственного реестра юридических лиц']
                },
                {
                    name: 'Устав предприятия',
                    description: 'Нотариально заверенная копия устава',
                    required: true
                },
                {
                    name: 'Бизнес-план',
                    description: 'Подробный бизнес-план проекта',
                    required: true,
                    examples: ['Описание проекта', 'Финансовые прогнозы', 'Анализ рынка']
                }
            ],
            preparation_steps: [
                {
                    step_number: 1,
                    title: 'Подготовка базовых документов',
                    description: 'Соберите основные документы предприятия',
                    documents_needed: ['Справка о регистрации', 'Устав', 'ИИН/БИН'],
                    estimated_time: '3-5 дней',
                    tips: ['Проверьте актуальность всех документов', 'Сделайте нотариальные копии'],
                    common_mistakes: ['Просроченные документы', 'Отсутствие нотариального заверения']
                }
            ],
            final_checklist: [
                'Все документы собраны и актуальны',
                'Бизнес-план соответствует требованиям программы',
                'Контактная информация указана корректно'
            ],
            contacts: {
                support_phone: '+7 (727) 000-00-00',
                support_email: 'support@program.gov.kz',
                consultation_hours: 'Пн-Пт: 9:00-18:00'
            }
        };
    }
    async cacheGuidance(programId, userId, guidance) {
        try {
            await database_1.default.query(`INSERT INTO program_guidance (program_id, user_id, guidance_data, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT (program_id, user_id) 
         DO UPDATE SET guidance_data = EXCLUDED.guidance_data, 
                       created_at = NOW(),
                       expires_at = NOW() + INTERVAL '30 days'`, [programId, userId, JSON.stringify(guidance)]);
        }
        catch (error) {
            console.error('Error caching guidance:', error);
        }
    }
    async getCachedGuidance(programId, userId) {
        try {
            const result = await database_1.default.query(`SELECT guidance_data 
         FROM program_guidance 
         WHERE program_id = $1 AND user_id = $2 AND expires_at > NOW()`, [programId, userId]);
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].guidance_data);
            }
        }
        catch (error) {
            console.error('Error retrieving cached guidance:', error);
        }
        return null;
    }
    async generateTemplateDocument(documentType, userProfile, program) {
        const systemPrompt = `
    You are a document template generator for Kazakhstan business applications. Create a template for the requested document type.

    Document Type: ${documentType}
    Business Profile: ${JSON.stringify(userProfile, null, 2)}
    Program: ${program.title} (${program.organization})

    Generate a professional document template in Russian that includes:
    1. Proper formatting and structure
    2. Placeholder fields marked with [FIELD_NAME]
    3. Kazakhstan-specific legal requirements
    4. Professional business language
    5. All necessary sections and details

    Return only the document template text, ready to use.
    `;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: `Generate a ${documentType} template for this business and program.`
                    }
                ],
                temperature: 0.2,
                max_tokens: 1500
            });
            return completion.choices[0]?.message?.content || 'Шаблон не может быть сгенерирован в данный момент.';
        }
        catch (error) {
            console.error('Error generating template:', error);
            return 'Шаблон не может быть сгенерирован в данный момент. Обратитесь в службу поддержки.';
        }
    }
    async trackGuidanceUsage(programId, userId, action) {
        try {
            await database_1.default.query(`INSERT INTO guidance_usage (program_id, user_id, action, created_at)
         VALUES ($1, $2, $3, NOW())`, [programId, userId, action]);
        }
        catch (error) {
            console.error('Error tracking guidance usage:', error);
        }
    }
}
exports.GuidanceService = GuidanceService;
//# sourceMappingURL=GuidanceService.js.map