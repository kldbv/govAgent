import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { InstructionService } from '../services/InstructionService';
import pool from '../utils/database';
import Joi from 'joi';

export class InstructionController {
  private instructionService = new InstructionService();

  getInstructions = asyncHandler(async (req: AuthRequest, res: Response) => {
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

      // Generate instructions
      const instructions = await this.instructionService.generateApplicationInstructions(
        Number(programId),
        userProfile
      );

      // Get current progress
      const progress = await this.instructionService.getApplicationProgress(
        Number(programId),
        userId
      );

      // Track usage
      await this.instructionService.trackInstructionUsage(
        Number(programId),
        userId,
        'viewed'
      );

      res.json({
        success: true,
        data: { 
          instructions,
          progress 
        }
      });

    } catch (error) {
      console.error('Error getting instructions:', error);
      throw new AppError('Failed to generate instructions', 500);
    }
  });

  updateStepStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Validate request body
    const schema = Joi.object({
      step_number: Joi.number().integer().min(1).required(),
      status: Joi.string().valid('pending', 'in_progress', 'completed', 'blocked').required(),
      notes: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { step_number, status, notes } = value;

    try {
      await this.instructionService.updateStepStatus(
        Number(programId),
        userId,
        step_number,
        status,
        notes
      );

      // Track step actions
      if (status === 'in_progress') {
        await this.instructionService.trackInstructionUsage(
          Number(programId),
          userId,
          'step_started'
        );
      } else if (status === 'completed') {
        await this.instructionService.trackInstructionUsage(
          Number(programId),
          userId,
          'step_completed'
        );
      }

      res.json({
        success: true,
        message: 'Step status updated successfully'
      });

    } catch (error) {
      console.error('Error updating step status:', error);
      throw new AppError('Failed to update step status', 500);
    }
  });

  getProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      const progress = await this.instructionService.getApplicationProgress(
        Number(programId),
        userId
      );

      // Calculate completion percentage
      const totalSteps = await this.getTotalSteps(Number(programId));
      const completedSteps = progress.filter(p => p.status === 'completed').length;
      const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      res.json({
        success: true,
        data: { 
          program_id: Number(programId),
          progress,
          completion_stats: {
            total_steps: totalSteps,
            completed_steps: completedSteps,
            completion_percentage: completionPercentage
          }
        }
      });

    } catch (error) {
      console.error('Error getting progress:', error);
      throw new AppError('Failed to get progress', 500);
    }
  });

  private async getTotalSteps(programId: number): Promise<number> {
    try {
      // Try to get from cached instructions first
      const result = await pool.query(
        `SELECT instructions_data 
         FROM program_instructions 
         WHERE program_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [programId]
      );

      if (result.rows.length > 0) {
        const instructions = JSON.parse(result.rows[0].instructions_data);
        return instructions.steps ? instructions.steps.length : 0;
      }

      // Default fallback
      return 0;
    } catch (error) {
      console.error('Error getting total steps:', error);
      return 0;
    }
  }

  getInstructionAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get usage statistics
      const usageStatsResult = await pool.query(`
        SELECT 
          program_id,
          action,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM instruction_usage 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY program_id, action
        ORDER BY program_id, action
      `);

      // Get completion statistics
      const completionStatsResult = await pool.query(`
        SELECT 
          program_id,
          status,
          COUNT(*) as step_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM application_step_progress
        GROUP BY program_id, status
        ORDER BY program_id, status
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

      // Format usage results
      const usageAnalytics = usageStatsResult.rows.map(row => ({
        program_id: row.program_id,
        program_title: programMap[row.program_id] || 'Unknown Program',
        action: row.action,
        usage_count: parseInt(row.usage_count),
        unique_users: parseInt(row.unique_users)
      }));

      // Format completion results
      const completionAnalytics = completionStatsResult.rows.map(row => ({
        program_id: row.program_id,
        program_title: programMap[row.program_id] || 'Unknown Program',
        status: row.status,
        step_count: parseInt(row.step_count),
        unique_users: parseInt(row.unique_users)
      }));

      res.json({
        success: true,
        data: { 
          usage_analytics: usageAnalytics,
          completion_analytics: completionAnalytics
        }
      });

    } catch (error) {
      console.error('Error getting instruction analytics:', error);
      throw new AppError('Failed to get analytics', 500);
    }
  });

  markApplicationSubmitted = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Validate request body
    const schema = Joi.object({
      submission_reference: Joi.string().max(100).optional(),
      notes: Joi.string().max(500).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { submission_reference, notes } = value;

    try {
      // Record the application submission
      await pool.query(
        `INSERT INTO application_submissions (user_id, program_id, submission_reference, notes, submitted_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, program_id) 
         DO UPDATE SET submission_reference = EXCLUDED.submission_reference,
                       notes = EXCLUDED.notes,
                       submitted_at = NOW()`,
        [userId, programId, submission_reference, notes]
      );

      // Track the submission
      await this.instructionService.trackInstructionUsage(
        Number(programId),
        userId,
        'application_submitted'
      );

      res.json({
        success: true,
        message: 'Application submission recorded successfully',
        data: {
          submission_reference,
          submitted_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error marking application submitted:', error);
      throw new AppError('Failed to record application submission', 500);
    }
  });
}
