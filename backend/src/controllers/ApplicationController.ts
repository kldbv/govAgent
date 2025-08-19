import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ApplicationService } from '../services/ApplicationService';
import pool from '../utils/database';
import Joi from 'joi';

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
      console.error('Error saving application draft:', error);
      throw new AppError('Failed to save application draft', 500);
    }
  });

  submitApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
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
      console.error('Error submitting application:', error);
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
}
