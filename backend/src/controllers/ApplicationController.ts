import { Response } from 'express';
import Joi from 'joi';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const applicationSchema = Joi.object({
  program_id: Joi.number().integer().positive().required(),
  application_data: Joi.object({
    company_name: Joi.string().required(),
    business_description: Joi.string().required(),
    funding_requested: Joi.number().positive().optional(),
    project_description: Joi.string().required(),
    expected_outcomes: Joi.string().required(),
    timeline: Joi.string().required(),
    contact_person: Joi.string().required(),
    contact_phone: Joi.string().required(),
    additional_documents: Joi.array().items(Joi.string()).optional(),
  }).required(),
});

export class ApplicationController {
  submitApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = applicationSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user?.id;
    const { program_id, application_data } = req.body;

    // Check if program exists and is active
    const programResult = await pool.query(
      'SELECT id, title FROM business_programs WHERE id = $1 AND is_active = true',
      [program_id]
    );

    if (programResult.rows.length === 0) {
      throw new AppError('Program not found or not active', 404);
    }

    // Check if user has already applied to this program
    const existingApplication = await pool.query(
      'SELECT id FROM applications WHERE user_id = $1 AND program_id = $2',
      [userId, program_id]
    );

    if (existingApplication.rows.length > 0) {
      throw new AppError('You have already applied to this program', 400);
    }

    // Create application
    const result = await pool.query(
      `INSERT INTO applications (user_id, program_id, status, application_data)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [userId, program_id, JSON.stringify(application_data)]
    );

    const application = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { 
        application: {
          id: application.id,
          program_id: application.program_id,
          status: application.status,
          submitted_at: application.submitted_at,
        }
      },
    });
  });

  getUserApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT a.id, a.program_id, a.status, a.submitted_at, a.updated_at,
             p.title as program_title, p.organization
      FROM applications a
      JOIN business_programs p ON a.program_id = p.id
      WHERE a.user_id = $1
    `;
    
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE user_id = $1';
    const countParams: any[] = [userId];

    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        applications: result.rows,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  getApplicationById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, p.title as program_title, p.organization, p.description as program_description
       FROM applications a
       JOIN business_programs p ON a.program_id = p.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Application not found', 404);
    }

    const application = result.rows[0];
    
    // Parse application_data if it's a string
    if (typeof application.application_data === 'string') {
      application.application_data = JSON.parse(application.application_data);
    }

    res.json({
      success: true,
      data: { application },
    });
  });
}
