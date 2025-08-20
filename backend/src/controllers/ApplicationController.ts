import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ApplicationService } from '../services/ApplicationService';
import pool from '../utils/database';
import Joi from 'joi';
import { createApplicationTables } from '../utils/migrateApplicationTables';

export class ApplicationController {
  private applicationService = new ApplicationService();
  getApplicationForm = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!programId || isNaN(Number(programId))) {
      throw new AppError('Valid program ID is required', 400);
    }

    try {
      // Get user profile
      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileResult.rows.length === 0) {
        throw new AppError('User profile not found. Please complete your profile first.', 400);
      }

      const userProfile = profileResult.rows[0];

      // Generate application form
      const form = await this.applicationService.generateApplicationForm(
        Number(programId),
        userProfile
      );

      // Check if there's an existing draft
      const existingApplication = await this.applicationService.getApplication(
        Number(programId),
        userId
      );

      res.json({
        success: true,
        data: { 
          form,
          existing_application: existingApplication
        }
      });

    } catch (error) {
      console.error('Error getting application form:', error);
      throw new AppError('Failed to generate application form', 500);
    }
  });
saveApplicationDraft = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Best-effort: ensure tables/columns exist in serverless cold starts
    try { await createApplicationTables(); } catch (e) { console.warn('ensure tables failed (non-fatal):', e); }

    // Validate request body
    const schema = Joi.object({
      form_data: Joi.object().required(),
      file_uploads: Joi.array().items(
        Joi.object({
          field_name: Joi.string().required(),
          original_name: Joi.string().required(),
          file_path: Joi.string().required(),
          file_size: Joi.number().required(),
          mime_type: Joi.string().required()
        })
      ).default([])
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { form_data, file_uploads } = value;

    try {
      // Ensure program exists (avoid FK violation 23503)
      const prog = await pool.query('SELECT id FROM business_programs WHERE id = $1 AND is_active = true', [Number(programId)]);
      if (prog.rows.length === 0) {
        throw new AppError('Программа не найдена', 404);
      }

      // Fetch user and profile to auto-fill related fields
      const userResult = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [userId]);
      const profileResult = await pool.query('SELECT bin, oked_code FROM user_profiles WHERE user_id = $1', [userId]);
      const user = userResult.rows[0] || {};
      const profile = profileResult.rows[0] || {};

      // Merge auto fields into form_data
      const autoEnrichedForm = {
        ...form_data,
        bin: form_data?.bin ?? profile.bin ?? null,
        oked_code: form_data?.oked_code ?? profile.oked_code ?? null,
        name: form_data?.name ?? form_data?.applicant?.company_name ?? user.full_name ?? null,
        phone: form_data?.phone ?? form_data?.applicant?.phone ?? null,
        contact_email: form_data?.contact_email ?? form_data?.applicant?.email ?? user.email ?? null,
      };

      const applicationData = {
        user_id: userId,
        program_id: Number(programId),
        form_data: autoEnrichedForm,
        file_uploads,
        status: 'draft' as const,
        last_updated: new Date()
      };

      const applicationId = await this.applicationService.saveApplicationDraft(applicationData);

      res.json({
        success: true,
        data: { 
          application_id: applicationId,
          message: 'Черновик сохранен'
        }
      });

    } catch (error) {
      const pgCode = (error as any)?.code;
      console.error('Error saving application draft:', { code: pgCode, error });
      // Common PG error codes
      if (pgCode === '23503') {
        // foreign_key_violation
        throw new AppError('Программа не найдена или недоступна', 400);
      }
      throw new AppError('Failed to save application draft', 500);
    }
  });

submitApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try { await createApplicationTables(); } catch (e) { console.warn('ensure tables failed (non-fatal):', e); }
    const { applicationId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!applicationId || isNaN(Number(applicationId))) {
      throw new AppError('Valid application ID is required', 400);
    }

    try {
      const result = await this.applicationService.submitApplication(
        Number(applicationId),
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          data: {
            reference: result.reference,
            message: result.message
          }
        });
      } else {
        throw new AppError(result.message, 400);
      }

    } catch (error) {
      const pgCode = (error as any)?.code;
      console.error('Error submitting application:', { code: pgCode, error });
      throw new AppError('Failed to submit application', 500);
    }
  });

  // Create or update draft for the given program, then submit in one call
submitApplicationForProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try { await createApplicationTables(); } catch (e) { console.warn('ensure tables failed (non-fatal):', e); }
    const { programId } = req.params;

    if (!userId) throw new AppError('Authentication required', 401);
    if (!programId || isNaN(Number(programId))) throw new AppError('Valid program ID is required', 400);

    // Accept same payload as draft
    const schema = Joi.object({
      form_data: Joi.object().required(),
      file_uploads: Joi.array().items(
        Joi.object({
          field_name: Joi.string().required(),
          original_name: Joi.string().required(),
          file_path: Joi.string().allow(null, ''),
          file_size: Joi.number().required(),
          mime_type: Joi.string().required()
        })
      ).default([])
    });
    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    try {
      // Ensure program exists
      const prog = await pool.query('SELECT id FROM business_programs WHERE id = $1 AND is_active = true', [Number(programId)]);
      if (prog.rows.length === 0) throw new AppError('Программа не найдена', 404);

      // Fetch user+profile for enrichment (same as in draft)
      const userResult = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [userId]);
      const profileResult = await pool.query('SELECT bin, oked_code FROM user_profiles WHERE user_id = $1', [userId]);
      const user = userResult.rows[0] || {};
      const profile = profileResult.rows[0] || {};

      const { form_data, file_uploads } = value;
      const autoEnrichedForm = {
        ...form_data,
        bin: form_data?.bin ?? profile.bin ?? null,
        oked_code: form_data?.oked_code ?? profile.oked_code ?? null,
        name: form_data?.name ?? form_data?.applicant?.company_name ?? user.full_name ?? null,
        phone: form_data?.phone ?? form_data?.applicant?.phone ?? null,
        contact_email: form_data?.contact_email ?? form_data?.applicant?.email ?? user.email ?? null,
      };

      // Upsert draft, get id
      const draftId = await this.applicationService.saveApplicationDraft({
        user_id: userId,
        program_id: Number(programId),
        form_data: autoEnrichedForm,
        file_uploads,
        status: 'draft',
        last_updated: new Date(),
      });

      // Submit
      const result = await this.applicationService.submitApplication(draftId, userId);
      if (!result.success) throw new AppError(result.message, 400);

      res.json({ success: true, data: { application_id: draftId, reference: result.reference, message: result.message } });
    } catch (err) {
      const pgCode = (err as any)?.code;
      console.error('Error submitApplicationForProgram:', { code: pgCode, err });
      if (pgCode === '23503') throw new AppError('Программа не найдена или недоступна', 400);
      throw new AppError('Failed to submit application', 500);
    }
  });

  getApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { page = 1, limit = 10, status } = req.query;

    try {
      let applications = await this.applicationService.getApplications(userId);

      // Filter by status if provided
      if (status && typeof status === 'string') {
        applications = applications.filter(app => app.status === status);
      }

      // Pagination
      const offset = (Number(page) - 1) * Number(limit);
      const paginatedApplications = applications.slice(offset, offset + Number(limit));

      res.json({
        success: true,
        data: {
          applications: paginatedApplications,
          pagination: {
            current_page: Number(page),
            per_page: Number(limit),
            total: applications.length,
            total_pages: Math.ceil(applications.length / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error getting applications:', error);
      throw new AppError('Failed to get applications', 500);
    }
  });

  getApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!applicationId || isNaN(Number(applicationId))) {
      throw new AppError('Valid application ID is required', 400);
    }

    try {
      const application = await this.applicationService.getApplication(
        Number(applicationId),
        userId
      );

      if (!application) {
        throw new AppError('Application not found', 404);
      }

      res.json({
        success: true,
        data: { application }
      });

    } catch (error) {
      console.error('Error getting application:', error);
      throw new AppError('Failed to get application', 500);
    }
  });

  getApplicationByProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!programId || isNaN(Number(programId))) {
      throw new AppError('Valid program ID is required', 400);
    }

    try {
      // Get application for specific program
      const result = await pool.query(
        `SELECT a.*, bp.title as program_title, bp.organization
         FROM applications a
         JOIN business_programs bp ON a.program_id = bp.id
         WHERE a.user_id = $1 AND a.program_id = $2`,
        [userId, Number(programId)]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: { application: null }
        });
      }

      const row = result.rows[0];
      const application = {
        id: row.id,
        user_id: row.user_id,
        program_id: row.program_id,
        form_data: JSON.parse(row.form_data || '{}'),
        file_uploads: JSON.parse(row.file_uploads || '[]'),
        status: row.status,
        submission_reference: row.submission_reference,
        submitted_at: row.submitted_at,
        last_updated: row.last_updated,
        notes: row.notes,
        program_title: row.program_title,
        organization: row.organization
      };

      res.json({
        success: true,
        data: { application }
      });

    } catch (error) {
      console.error('Error getting application by program:', error);
      throw new AppError('Failed to get application', 500);
    }
  });

  getApplicationStats = asyncHandler(async (req: Request, res: Response) => {
    // Admin endpoint for application statistics
    try {
      const stats = await this.applicationService.getApplicationStats();

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Error getting application stats:', error);
      throw new AppError('Failed to get statistics', 500);
    }
  });

  // Upload files to a draft application (ensures draft exists)
uploadFilesToDraft = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try { await createApplicationTables(); } catch (e) { console.warn('ensure tables failed (non-fatal):', e); }
    const { programId } = req.params;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }
    if (!programId || isNaN(Number(programId))) {
      throw new AppError('Valid program ID is required', 400);
    }

    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    try {
      // Ensure program exists (avoid FK violation 23503)
      const prog = await pool.query('SELECT id FROM business_programs WHERE id = $1 AND is_active = true', [Number(programId)]);
      if (prog.rows.length === 0) {
        throw new AppError('Программа не найдена', 404);
      }

      // Ensure draft exists and get id
      const draftId = await this.applicationService.saveApplicationDraft({
        user_id: userId,
        program_id: Number(programId),
        form_data: {},
        file_uploads: [],
        status: 'draft',
        last_updated: new Date(),
      });

      // Insert file rows with content in DB
      const values: any[] = [];
      const placeholders: string[] = [];
      files.forEach((f, idx) => {
        // Insert including file_content (BYTEA) for MVP storage in DB
        values.push(
          userId,
          draftId,
          f.fieldname || 'document',
          f.originalname,
          null, // file_path (nullable)
          f.size,
          f.mimetype,
          f.buffer
        );
        const base = idx * 8;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`);
      });

      const insert = await pool.query(
        `INSERT INTO file_uploads (user_id, application_id, field_name, original_name, file_path, file_size, mime_type, file_content)
         VALUES ${placeholders.join(', ')} RETURNING id, original_name, file_size, mime_type, field_name`,
        values
      );

      res.json({ success: true, data: { application_id: draftId, files: insert.rows } });
    } catch (error) {
      const pgCode = (error as any)?.code;
      console.error('Error uploading files:', { code: pgCode, error });
      if (pgCode === '23503') {
        throw new AppError('Программа не найдена или недоступна', 400);
      }
      throw new AppError('Failed to upload files', 500);
    }
  });

  listFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    if (!userId) throw new AppError('Authentication required', 401);
    if (!applicationId || isNaN(Number(applicationId))) throw new AppError('Valid application ID is required', 400);

    try {
      const result = await pool.query(
        `SELECT id, field_name, original_name, file_size, mime_type, uploaded_at FROM file_uploads WHERE application_id = $1 AND user_id = $2 ORDER BY uploaded_at DESC`,
        [Number(applicationId), userId]
      );
      res.json({ success: true, data: { files: result.rows } });
    } catch (error) {
      console.error('Error listing files:', error);
      throw new AppError('Failed to list files', 500);
    }
  });

  deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { applicationId, fileId } = req.params;
    if (!userId) throw new AppError('Authentication required', 401);
    if (!applicationId || isNaN(Number(applicationId))) throw new AppError('Valid application ID is required', 400);
    if (!fileId || isNaN(Number(fileId))) throw new AppError('Valid file ID is required', 400);

    try {
      await pool.query(`DELETE FROM file_uploads WHERE id = $1 AND application_id = $2 AND user_id = $3`, [Number(fileId), Number(applicationId), userId]);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new AppError('Failed to delete file', 500);
    }
  });
}
