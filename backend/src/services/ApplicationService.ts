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
  full_name?: string;
  phone?: string;
  email?: string;
}

interface BusinessProgram {
  id: number;
  title: string;
  description: string;
  organization: string;
  program_type: string;
  requirements: string;
  application_process: string;
  contact_info: string;
  application_deadline: string;
}

interface ApplicationFormField {
  field_name: string;
  field_type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  validation?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
    file_types?: string[];
    max_file_size?: number;
  };
  options?: string[]; // For select/radio fields
  default_value?: any;
  help_text?: string;
  depends_on?: string; // Field name that this field depends on
}

interface ApplicationForm {
  program_id: number;
  program_title: string;
  organization: string;
  form_sections: {
    section_name: string;
    section_title: string;
    description?: string;
    fields: ApplicationFormField[];
  }[];
  pre_filled_data: Record<string, any>;
  submission_instructions: string;
  required_attachments: string[];
}

interface ApplicationData {
  id?: number;
  user_id: number;
  program_id: number;
  form_data: Record<string, any>;
  file_uploads: {
    field_name: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }[];
  status: 'pending' | 'in_review' | 'under_review' | 'additional_info_required' | 'approved' | 'rejected' | 'draft' | 'submitted';
  submission_reference?: string;
  submitted_at?: Date;
  last_updated: Date;
  notes?: string;
  // Additional fields for display
  program_title?: string;
  organization?: string;
}

export class ApplicationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateApplicationForm(
    programId: number,
    userProfile: UserProfile
  ): Promise<ApplicationForm> {
    // Get program details
    const program = await this.getProgramById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Check if we have cached form
    let form = await this.getCachedForm(programId);
    
    if (!form) {
      // Generate AI-powered form
      form = await this.generateAIForm(program, userProfile);
      
      // Cache the form
      await this.cacheForm(programId, form);
    }

    // Add pre-filled data from user profile
    form.pre_filled_data = this.getPreFilledData(userProfile);

    return form;
  }

  private async getProgramById(programId: number): Promise<BusinessProgram | null> {
    const result = await pool.query(
      `SELECT id, title, description, organization, program_type, requirements,
              application_process, contact_info, application_deadline
       FROM business_programs 
       WHERE id = $1 AND is_active = true`,
      [programId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async generateAIForm(
    program: BusinessProgram,
    userProfile: UserProfile
  ): Promise<ApplicationForm> {
    const systemPrompt = `
    You are an expert in Kazakhstan business program applications. Generate a comprehensive application form for the given program.

    Program Details:
    - Title: ${program.title}
    - Organization: ${program.organization}
    - Type: ${program.program_type}
    - Requirements: ${program.requirements}
    - Process: ${program.application_process}

    Generate a detailed application form with:
    1. Multiple logical sections (business info, project details, financials, documents)
    2. Appropriate field types and validation
    3. Kazakhstan-specific requirements
    4. Clear instructions and help text
    5. Required document attachments

    Consider common fields for Kazakhstan business applications:
    - BIN (Business Identification Number)
    - OKED codes
    - Legal entity information
    - Financial statements
    - Project descriptions
    - Funding requests

    Respond in JSON format matching the ApplicationForm interface.
    All text should be in Russian for Kazakhstan context.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Generate a comprehensive application form for this program.` 
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const form = JSON.parse(response) as ApplicationForm;
      
      // Ensure required fields are present
      form.program_id = program.id;
      form.program_title = program.title;
      form.organization = program.organization;

      return form;
    } catch (error) {
      console.error('Error generating AI form:', error);
      
      // Fallback form
      return this.generateFallbackForm(program);
    }
  }

  private generateFallbackForm(program: BusinessProgram): ApplicationForm {
    return {
      program_id: program.id,
      program_title: program.title,
      organization: program.organization,
      form_sections: [
        {
          section_name: 'business_info',
          section_title: 'Информация о предприятии',
          description: 'Основная информация о вашем бизнесе',
          fields: [
            {
              field_name: 'company_name',
              field_type: 'text',
              label: 'Наименование предприятия',
              required: true,
              validation: { min_length: 2, max_length: 200 }
            },
            {
              field_name: 'bin',
              field_type: 'text',
              label: 'БИН',
              required: true,
              validation: { pattern: '^[0-9]{12}$' },
              help_text: '12-значный бизнес-идентификационный номер'
            },
            {
              field_name: 'oked_code',
              field_type: 'text',
              label: 'ОКЭД код',
              required: true,
              help_text: 'Код вида экономической деятельности'
            },
            {
              field_name: 'legal_address',
              field_type: 'textarea',
              label: 'Юридический адрес',
              required: true,
              validation: { min_length: 10, max_length: 500 }
            }
          ]
        },
        {
          section_name: 'project_details',
          section_title: 'Описание проекта',
          description: 'Подробное описание вашего проекта или бизнеса',
          fields: [
            {
              field_name: 'project_name',
              field_type: 'text',
              label: 'Название проекта',
              required: true,
              validation: { min_length: 5, max_length: 200 }
            },
            {
              field_name: 'project_description',
              field_type: 'textarea',
              label: 'Описание проекта',
              required: true,
              validation: { min_length: 50, max_length: 2000 },
              help_text: 'Опишите суть проекта, цели, планируемые результаты'
            },
            {
              field_name: 'requested_amount',
              field_type: 'number',
              label: 'Запрашиваемая сумма (тенге)',
              required: true,
              validation: { min_value: 100000, max_value: 1000000000 }
            }
          ]
        },
        {
          section_name: 'documents',
          section_title: 'Документы',
          description: 'Загрузите необходимые документы',
          fields: [
            {
              field_name: 'business_plan',
              field_type: 'file',
              label: 'Бизнес-план',
              required: true,
              validation: { 
                file_types: ['.pdf', '.doc', '.docx'],
                max_file_size: 10485760 // 10MB
              }
            },
            {
              field_name: 'registration_certificate',
              field_type: 'file',
              label: 'Справка о государственной регистрации',
              required: true,
              validation: { 
                file_types: ['.pdf', '.jpg', '.jpeg', '.png'],
                max_file_size: 5242880 // 5MB
              }
            }
          ]
        }
      ],
      pre_filled_data: {},
      submission_instructions: 'После заполнения всех полей и загрузки документов нажмите "Подать заявку". Заявка будет рассмотрена в течение 10-15 рабочих дней.',
      required_attachments: ['Бизнес-план', 'Справка о государственной регистрации']
    };
  }

  private getPreFilledData(userProfile: UserProfile): Record<string, any> {
    return {
      company_name: userProfile.full_name || '',
      bin: userProfile.bin || '',
      oked_code: userProfile.oked_code || '',
      business_type: userProfile.business_type || '',
      industry: userProfile.industry || '',
      location: userProfile.location || '',
      annual_revenue: userProfile.annual_revenue || null,
      employee_count: userProfile.employee_count || null,
      contact_email: userProfile.email || '',
      contact_phone: userProfile.phone || '',
      requested_amount: userProfile.desired_loan_amount || null
    };
  }

  private async cacheForm(programId: number, form: ApplicationForm): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO program_forms (program_id, form_data, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')
         ON CONFLICT (program_id) 
         DO UPDATE SET form_data = EXCLUDED.form_data, 
                       created_at = NOW(),
                       expires_at = NOW() + INTERVAL '7 days'`,
        [programId, JSON.stringify(form)]
      );
    } catch (error) {
      console.error('Error caching form:', error);
    }
  }

  private async getCachedForm(programId: number): Promise<ApplicationForm | null> {
    try {
      const result = await pool.query(
        `SELECT form_data 
         FROM program_forms 
         WHERE program_id = $1 AND expires_at > NOW()`,
        [programId]
      );

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].form_data) as ApplicationForm;
      }
    } catch (error) {
      console.error('Error retrieving cached form:', error);
    }

    return null;
  }

  async saveApplicationDraft(applicationData: ApplicationData): Promise<number> {
    try {
      // Upsert without relying on a pre-existing UNIQUE index to avoid migration race conditions.
      // First try UPDATE; if no row affected, INSERT. Always return the id.
      const result = await pool.query(
        `WITH updated AS (
            UPDATE applications
               SET form_data = $3,
                   file_uploads = $4,
                   status = $5,
                   last_updated = NOW()
             WHERE user_id = $1 AND program_id = $2
         RETURNING id
         ), inserted AS (
           INSERT INTO applications (user_id, program_id, form_data, file_uploads, status, last_updated)
           SELECT $1, $2, $3, $4, $5, NOW()
            WHERE NOT EXISTS (SELECT 1 FROM updated)
         RETURNING id
        )
        SELECT id FROM updated
        UNION ALL
        SELECT id FROM inserted`,
        [
          applicationData.user_id,
          applicationData.program_id,
          JSON.stringify(applicationData.form_data),
          JSON.stringify(applicationData.file_uploads),
          'draft'
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error saving application draft:', error);
      throw error;
    }
  }

  async submitApplication(
    applicationId: number,
    userId: number
  ): Promise<{ success: boolean; reference?: string; message: string }> {
    try {
      // Before submission, enrich and persist auto fields
      const appRes = await pool.query(
        `SELECT form_data FROM applications WHERE id = $1 AND user_id = $2`,
        [applicationId, userId]
      );
      if (appRes.rows.length === 0) {
        throw new Error('Application not found');
      }
      const currentForm = appRes.rows[0].form_data || {};

      const userRes = await pool.query(`SELECT full_name, email FROM users WHERE id = $1`, [userId]);
      const profRes = await pool.query(`SELECT bin, oked_code FROM user_profiles WHERE user_id = $1`, [userId]);
      const user = userRes.rows[0] || {};
      const profile = profRes.rows[0] || {};

      const enrichedForm = {
        ...currentForm,
        bin: currentForm?.bin ?? profile.bin ?? null,
        oked_code: currentForm?.oked_code ?? profile.oked_code ?? null,
        name: currentForm?.name ?? currentForm?.applicant?.company_name ?? user.full_name ?? null,
        phone: currentForm?.phone ?? currentForm?.applicant?.phone ?? null,
        contact_email: currentForm?.contact_email ?? currentForm?.applicant?.email ?? user.email ?? null,
      };

      // Persist enriched form before marking submitted (write to both columns for compatibility)
      await pool.query(
        `UPDATE applications SET form_data = $1, last_updated = NOW() WHERE id = $2 AND user_id = $3`,
        [JSON.stringify(enrichedForm), applicationId, userId]
      );

      // Generate submission reference
      const reference = this.generateSubmissionReference();
      
      // Update application status to submitted
      const result = await pool.query(
        `UPDATE applications 
         SET status = $1, 
             submission_reference = $2,
             submitted_at = NOW(),
             last_updated = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING program_id`,
        ['under_review', reference, applicationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = result.rows[0];

      // Send notification (in real app, this would be email/API call)
      await this.sendSubmissionNotification(userId, application.program_id, reference);

      return {
        success: true,
        reference,
        message: 'Заявка успешно подана. Номер заявки: ' + reference
      };
    } catch (error) {
      console.error('Error submitting application:', error);
      return {
        success: false,
        message: 'Ошибка при подаче заявки. Попробуйте еще раз.'
      };
    }
  }

  async getApplications(userId: number): Promise<ApplicationData[]> {
    try {
      const result = await pool.query(
        `SELECT a.*, bp.title as program_title, bp.organization
         FROM applications a
         JOIN business_programs bp ON a.program_id = bp.id
         WHERE a.user_id = $1
         ORDER BY a.last_updated DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        program_id: row.program_id,
        form_data: row.form_data || {},
        file_uploads: row.file_uploads || [],
        status: row.status,
        submission_reference: row.submission_reference,
        submitted_at: row.submitted_at,
        last_updated: row.last_updated,
        notes: row.notes,
        // Additional fields for display
        program_title: row.program_title,
        organization: row.organization
      }));
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  async getApplication(applicationId: number, userId: number): Promise<ApplicationData | null> {
    try {
      const result = await pool.query(
        `SELECT a.*, bp.title as program_title, bp.organization
         FROM applications a
         JOIN business_programs bp ON a.program_id = bp.id
         WHERE a.id = $1 AND a.user_id = $2`,
        [applicationId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        program_id: row.program_id,
        form_data: row.form_data || {},
        file_uploads: row.file_uploads || [],
        status: row.status,
        submission_reference: row.submission_reference,
        submitted_at: row.submitted_at,
        last_updated: row.last_updated,
        notes: row.notes,
        program_title: row.program_title,
        organization: row.organization
      };
    } catch (error) {
      console.error('Error getting application:', error);
      return null;
    }
  }

  async updateApplicationStatus(
    applicationId: number,
    status: string,
    notes?: string
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE applications 
         SET status = $1, notes = $2, last_updated = NOW()
         WHERE id = $3`,
        [status, notes, applicationId]
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  private generateSubmissionReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APP-${timestamp}-${random}`;
  }

  private async sendSubmissionNotification(
    userId: number,
    programId: number,
    reference: string
  ): Promise<void> {
    try {
      // In a real application, this would send email or API notification
      console.log(`Sending submission notification for user ${userId}, program ${programId}, ref: ${reference}`);
      
      // Store notification in database
      await pool.query(
        `INSERT INTO application_notifications (user_id, program_id, reference, type, message, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          userId,
          programId,
          reference,
          'submission_confirmation',
          `Ваша заявка ${reference} успешно подана и находится на рассмотрении.`
        ]
      );
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notification failure shouldn't break submission
    }
  }

  async getApplicationStats(): Promise<{
    total_applications: number;
    by_status: Record<string, number>;
    by_program: { program_id: number; program_title: string; count: number }[];
    recent_submissions: number;
  }> {
    try {
      // Total applications
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM applications'
      );

      // By status
      const statusResult = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM applications
        GROUP BY status
        ORDER BY count DESC
      `);

      // By program
      const programResult = await pool.query(`
        SELECT a.program_id, bp.title as program_title, COUNT(*) as count
        FROM applications a
        JOIN business_programs bp ON a.program_id = bp.id
        GROUP BY a.program_id, bp.title
        ORDER BY count DESC
        LIMIT 10
      `);

      // Recent submissions (last 7 days)
      const recentResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM applications
        WHERE submitted_at >= NOW() - INTERVAL '7 days'
      `);

      const byStatus: Record<string, number> = {};
      statusResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count);
      });

      const byProgram = programResult.rows.map(row => ({
        program_id: row.program_id,
        program_title: row.program_title,
        count: parseInt(row.count)
      }));

      return {
        total_applications: parseInt(totalResult.rows[0].total),
        by_status: byStatus,
        by_program: byProgram,
        recent_submissions: parseInt(recentResult.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        total_applications: 0,
        by_status: {},
        by_program: [],
        recent_submissions: 0
      };
    }
  }
}
