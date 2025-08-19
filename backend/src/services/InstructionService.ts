import OpenAI from 'openai';
import pool from '../utils/database';

interface UserProfile {
  id: number;
  user_id: number;
  business_type: string;
  business_size: string;
  industry: string;
  location: string;
  annual_revenue?: number;
  employee_count?: number;
  funding_stage: string;
  bin?: string;
  oked_code?: string;
  region?: string;
  desired_loan_amount?: number;
}

interface BusinessProgram {
  id: number;
  title: string;
  description: string;
  organization: string;
  program_type: string;
  requirements: string;
  application_process: string;
  application_deadline: string;
  contact_info: string;
}

interface ApplicationStep {
  step_number: number;
  title: string;
  description: string;
  required_documents: string[];
  estimated_duration: string;
  deadline?: string;
  responsible_contact?: {
    name?: string;
    phone?: string;
    email?: string;
    department?: string;
  };
  instructions: string[];
  tips: string[];
  common_errors: string[];
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies?: number[]; // Other step numbers this depends on
}

interface ApplicationInstructions {
  program_id: number;
  program_title: string;
  organization: string;
  application_deadline: string;
  total_estimated_time: string;
  overview: string;
  prerequisites: string[];
  steps: ApplicationStep[];
  final_submission: {
    method: string; // 'online' | 'email' | 'in_person' | 'mail'
    submission_address?: string;
    submission_email?: string;
    submission_portal?: string;
    required_format: string[];
  };
  follow_up: {
    review_time: string;
    notification_method: string;
    contact_for_questions: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };
  success_metrics: {
    approval_rate: string;
    average_funding_amount: string;
    typical_processing_time: string;
  };
}

export class InstructionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateApplicationInstructions(
    programId: number,
    userProfile: UserProfile
  ): Promise<ApplicationInstructions> {
    // Get program details
    const program = await this.getProgramById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Check if we have cached instructions
    let instructions = await this.getCachedInstructions(programId, userProfile.user_id);
    
    if (!instructions) {
      // Generate AI-powered instructions
      instructions = await this.generateAIInstructions(program, userProfile);
      
      // Cache the instructions
      await this.cacheInstructions(programId, userProfile.user_id, instructions);
    }

    return instructions;
  }

  private async getProgramById(programId: number): Promise<BusinessProgram | null> {
    const result = await pool.query(
      `SELECT id, title, description, organization, program_type, requirements,
              application_process, application_deadline, contact_info
       FROM business_programs 
       WHERE id = $1 AND is_active = true`,
      [programId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async generateAIInstructions(
    program: BusinessProgram,
    userProfile: UserProfile
  ): Promise<ApplicationInstructions> {
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

      const instructions = JSON.parse(response) as ApplicationInstructions;
      
      // Ensure required fields are present
      instructions.program_id = program.id;
      instructions.program_title = program.title;
      instructions.organization = program.organization;

      return instructions;
    } catch (error) {
      console.error('Error generating AI instructions:', error);
      
      // Fallback instructions
      return this.generateFallbackInstructions(program, userProfile);
    }
  }

  private generateFallbackInstructions(
    program: BusinessProgram,
    userProfile: UserProfile
  ): ApplicationInstructions {
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

  private async cacheInstructions(
    programId: number,
    userId: number,
    instructions: ApplicationInstructions
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO program_instructions (program_id, user_id, instructions_data, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 days')
         ON CONFLICT (program_id, user_id) 
         DO UPDATE SET instructions_data = EXCLUDED.instructions_data, 
                       created_at = NOW(),
                       expires_at = NOW() + INTERVAL '15 days'`,
        [programId, userId, JSON.stringify(instructions)]
      );
    } catch (error) {
      console.error('Error caching instructions:', error);
    }
  }

  private async getCachedInstructions(
    programId: number,
    userId: number
  ): Promise<ApplicationInstructions | null> {
    try {
      const result = await pool.query(
        `SELECT instructions_data 
         FROM program_instructions 
         WHERE program_id = $1 AND user_id = $2 AND expires_at > NOW()`,
        [programId, userId]
      );

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].instructions_data) as ApplicationInstructions;
      }
    } catch (error) {
      console.error('Error retrieving cached instructions:', error);
    }

    return null;
  }

  async updateStepStatus(
    programId: number,
    userId: number,
    stepNumber: number,
    status: 'pending' | 'in_progress' | 'completed' | 'blocked',
    notes?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO application_step_progress 
         (user_id, program_id, step_number, status, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, program_id, step_number)
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()`,
        [userId, programId, stepNumber, status, notes]
      );
    } catch (error) {
      console.error('Error updating step status:', error);
      throw error;
    }
  }

  async getApplicationProgress(
    programId: number,
    userId: number
  ): Promise<{ step_number: number; status: string; notes?: string; updated_at: Date }[]> {
    try {
      const result = await pool.query(
        `SELECT step_number, status, notes, updated_at
         FROM application_step_progress
         WHERE user_id = $1 AND program_id = $2
         ORDER BY step_number`,
        [userId, programId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting application progress:', error);
      return [];
    }
  }

  async trackInstructionUsage(
    programId: number,
    userId: number,
    action: 'viewed' | 'step_started' | 'step_completed' | 'application_submitted'
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO instruction_usage (program_id, user_id, action, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [programId, userId, action]
      );
    } catch (error) {
      console.error('Error tracking instruction usage:', error);
    }
  }
}
