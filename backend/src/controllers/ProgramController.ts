import { Request, Response } from 'express';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { RecommendationService } from '../services/RecommendationService';

export class ProgramController {
  private recommendationService = new RecommendationService();

  getPrograms = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      program_type, 
      target_audience, 
      organization, 
      search 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT id, title, description, organization, program_type, target_audience,
             funding_amount, application_deadline, requirements, benefits,
             application_process, contact_info, created_at
      FROM business_programs 
      WHERE is_active = true
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (program_type) {
      query += ` AND program_type = $${paramIndex}`;
      queryParams.push(program_type);
      paramIndex++;
    }

    if (target_audience) {
      query += ` AND target_audience ILIKE $${paramIndex}`;
      queryParams.push(`%${target_audience}%`);
      paramIndex++;
    }

    if (organization) {
      query += ` AND organization ILIKE $${paramIndex}`;
      queryParams.push(`%${organization}%`);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs 
      WHERE is_active = true
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (program_type) {
      countQuery += ` AND program_type = $${countParamIndex}`;
      countParams.push(program_type);
      countParamIndex++;
    }

    if (target_audience) {
      countQuery += ` AND target_audience ILIKE $${countParamIndex}`;
      countParams.push(`%${target_audience}%`);
      countParamIndex++;
    }

    if (organization) {
      countQuery += ` AND organization ILIKE $${countParamIndex}`;
      countParams.push(`%${organization}%`);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        programs: result.rows,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  getProgramById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    res.json({
      success: true,
      data: { program: result.rows[0] },
    });
  });

  getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Get user profile
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new AppError('User profile not found. Please complete your profile first.', 400);
    }

    const userProfile = profileResult.rows[0];

    // Get all active programs
    const programsResult = await pool.query(
      `SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    const programs = programsResult.rows;
    
    // Get recommendations using the recommendation service
    const recommendations = await this.recommendationService.getRecommendations(
      userProfile,
      programs
    );

    res.json({
      success: true,
      data: { recommendations },
    });
  });
}
