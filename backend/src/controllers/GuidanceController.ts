import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { GuidanceService } from '../services/GuidanceService';
import pool from '../utils/database';
import Joi from 'joi';

export class GuidanceController {
  private guidanceService = new GuidanceService();

  getGuidance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!programId || isNaN(Number(programId))) {
      throw new AppError('Valid program ID is required', 400);
    }

    try {
      // First try to get cached guidance
      let guidance = await this.guidanceService.getCachedGuidance(
        Number(programId), 
        userId
      );

      if (!guidance) {
        // Get user profile
        const profileResult = await pool.query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [userId]
        );

        if (profileResult.rows.length === 0) {
          throw new AppError('User profile not found. Please complete your profile first.', 400);
        }

        const userProfile = profileResult.rows[0];

        // Generate new guidance
        guidance = await this.guidanceService.generateDocumentGuidance(
          Number(programId),
          userProfile
        );
      }

      // Track usage
      await this.guidanceService.trackGuidanceUsage(
        Number(programId),
        userId,
        'viewed'
      );

      res.json({
        success: true,
        data: { guidance }
      });

    } catch (error) {
      console.error('Error getting guidance:', error);
      throw new AppError('Failed to generate guidance', 500);
    }
  });

  generateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Validate request body
    const schema = Joi.object({
      document_type: Joi.string().min(1).max(200).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { document_type } = value;

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

      // Get program details
      const programResult = await pool.query(
        `SELECT id, title, description, organization, program_type, requirements,
                application_process, contact_info
         FROM business_programs 
         WHERE id = $1 AND is_active = true`,
        [programId]
      );

      if (programResult.rows.length === 0) {
        throw new AppError('Program not found', 404);
      }

      const program = programResult.rows[0];

      // Generate template
      const template = await this.guidanceService.generateTemplateDocument(
        document_type,
        userProfile,
        program
      );

      // Track usage
      await this.guidanceService.trackGuidanceUsage(
        Number(programId),
        userId,
        'downloaded_template'
      );

      res.json({
        success: true,
        data: { 
          document_type,
          template,
          program_title: program.title
        }
      });

    } catch (error) {
      console.error('Error generating template:', error);
      throw new AppError('Failed to generate template', 500);
    }
  });

  markStepComplete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Validate request body
    const schema = Joi.object({
      step_number: Joi.number().integer().min(1).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { step_number } = value;

    try {
      // Track step completion
      await this.guidanceService.trackGuidanceUsage(
        Number(programId),
        userId,
        'completed_step'
      );

      // Store step progress
      await pool.query(
        `INSERT INTO user_guidance_progress (user_id, program_id, step_number, completed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, program_id, step_number)
         DO UPDATE SET completed_at = NOW()`,
        [userId, programId, step_number]
      );

      res.json({
        success: true,
        message: 'Step marked as complete'
      });

    } catch (error) {
      console.error('Error marking step complete:', error);
      throw new AppError('Failed to mark step complete', 500);
    }
  });

  getProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Get completed steps
      const progressResult = await pool.query(
        `SELECT step_number, completed_at
         FROM user_guidance_progress
         WHERE user_id = $1 AND program_id = $2
         ORDER BY step_number`,
        [userId, programId]
      );

      const completedSteps = progressResult.rows.map(row => ({
        step_number: row.step_number,
        completed_at: row.completed_at
      }));

      res.json({
        success: true,
        data: { 
          program_id: Number(programId),
          completed_steps: completedSteps
        }
      });

    } catch (error) {
      console.error('Error getting progress:', error);
      throw new AppError('Failed to get progress', 500);
    }
  });

  getGuidanceAnalytics = asyncHandler(async (req: Request, res: Response) => {
    // This endpoint can be used by admins to get guidance usage analytics
    try {
      // Get usage statistics
      const usageStatsResult = await pool.query(`
        SELECT 
          program_id,
          action,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM guidance_usage 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY program_id, action
        ORDER BY program_id, action
      `);

      // Get program names
      const programsResult = await pool.query(`
        SELECT id, title 
        FROM business_programs 
        WHERE is_active = true
      `);

      const programMap = programsResult.rows.reduce((acc: any, row) => {
        acc[row.id] = row.title;
        return acc;
      }, {});

      // Format results
      const analytics = usageStatsResult.rows.map(row => ({
        program_id: row.program_id,
        program_title: programMap[row.program_id] || 'Unknown Program',
        action: row.action,
        usage_count: parseInt(row.usage_count),
        unique_users: parseInt(row.unique_users)
      }));

      res.json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      console.error('Error getting guidance analytics:', error);
      throw new AppError('Failed to get analytics', 500);
    }
  });
}
