import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import pool from '../utils/database';
import Joi from 'joi';
import bcrypt from 'bcrypt';

export class AdminController {
  // Dashboard Statistics
  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const [
        totalUsers,
        totalPrograms,
        totalApplications,
        activeApplications,
        recentUsers,
        applicationsByStatus,
        programsByType
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM business_programs WHERE is_active = true'),
        pool.query('SELECT COUNT(*) as count FROM applications'),
        pool.query("SELECT COUNT(*) as count FROM applications WHERE status = 'under_review'"),
        pool.query(`
          SELECT COUNT(*) as count FROM users 
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `),
        pool.query(`
          SELECT status, COUNT(*) as count 
          FROM applications 
          GROUP BY status 
          ORDER BY count DESC
        `),
        pool.query(`
          SELECT program_type, COUNT(*) as count 
          FROM business_programs 
          WHERE is_active = true 
          GROUP BY program_type 
          ORDER BY count DESC
        `)
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            total_users: parseInt(totalUsers.rows[0].count),
            total_programs: parseInt(totalPrograms.rows[0].count),
            total_applications: parseInt(totalApplications.rows[0].count),
            active_applications: parseInt(activeApplications.rows[0].count),
            new_users_30d: parseInt(recentUsers.rows[0].count)
          },
          applications_by_status: applicationsByStatus.rows.map(row => ({
            status: row.status,
            count: parseInt(row.count)
          })),
          programs_by_type: programsByType.rows.map(row => ({
            type: row.program_type,
            count: parseInt(row.count)
          }))
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new AppError('Failed to get dashboard statistics', 500);
    }
  });

  // User Management
  getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, role } = req.query;

    try {
      let query = `
        SELECT u.id, u.email, u.full_name, u.role, u.created_at,
               p.business_type, p.business_size, p.industry, p.region
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (role) {
        query += ` AND u.role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      query += ` ORDER BY u.created_at DESC`;

      // Get total count
      const countQuery = query.replace(
        'SELECT u.id, u.email, u.full_name, u.role, u.created_at, p.business_type, p.business_size, p.industry, p.region',
        'SELECT COUNT(*)'
      );
      const totalResult = await pool.query(countQuery, params);
      const total = parseInt(totalResult.rows[0].count);

      // Add pagination
      const offset = (Number(page) - 1) * Number(limit);
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(limit), offset);

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            current_page: Number(page),
            per_page: Number(limit),
            total,
            total_pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      throw new AppError('Failed to get users', 500);
    }
  });

  updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    const schema = Joi.object({
      role: Joi.string().valid('admin', 'manager', 'user').required()
    });

    const { error } = schema.validate({ role });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    try {
      const result = await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
        [role, userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new AppError('Failed to update user role', 500);
    }
  });

  // Program Management  
  getAllPrograms = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, type, status } = req.query;

    try {
      let query = `
        SELECT id, title as name, description, organization, program_type, funding_amount, 
               application_deadline, requirements as eligibility_criteria, is_active, 
               created_at, updated_at,
               CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status
        FROM business_programs
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (title ILIKE $${paramIndex} OR organization ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (type) {
        query += ` AND program_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (status === 'active') {
        query += ` AND is_active = true`;
      } else if (status === 'inactive') {
        query += ` AND is_active = false`;
      }

      query += ` ORDER BY created_at DESC`;

      // Get total count
      let countQuery = query.replace(/ORDER BY.*$/, '');
      countQuery = countQuery.replace(
        /SELECT.*?FROM/,
        'SELECT COUNT(*) FROM'
      );
      const totalResult = await pool.query(countQuery, params);
      const total = parseInt(totalResult.rows[0].count);

      // Add pagination
      const offset = (Number(page) - 1) * Number(limit);
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(limit), offset);

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          programs: result.rows,
          pagination: {
            current_page: Number(page),
            per_page: Number(limit),
            total,
            total_pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting programs:', error);
      throw new AppError('Failed to get programs', 500);
    }
  });

  toggleProgramStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { programId } = req.params;

    try {
      const result = await pool.query(
        'UPDATE business_programs SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, title, is_active',
        [programId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Program not found', 404);
      }

      res.json({
        success: true,
        message: `Program ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
        data: { program: result.rows[0] }
      });
    } catch (error) {
      console.error('Error toggling program status:', error);
      throw new AppError('Failed to update program status', 500);
    }
  });

  updateProgramStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { programId } = req.params;
    const { status } = req.body;

    const schema = Joi.object({
      status: Joi.string().valid('active', 'inactive', 'draft').required()
    });

    const { error } = schema.validate({ status });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    try {
      // Map frontend status to backend is_active field
      const isActive = status === 'active';
      
      const result = await pool.query(
        'UPDATE business_programs SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, is_active',
        [isActive, programId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Program not found', 404);
      }

      res.json({
        success: true,
        message: 'Program status updated successfully',
        data: { program: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating program status:', error);
      throw new AppError('Failed to update program status', 500);
    }
  });

  // Application Management
  getAllApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status, program_id } = req.query;

    try {
      let query = `
        SELECT a.id, a.user_id, a.program_id, a.status, a.submitted_at, a.last_updated,
               a.submission_reference, a.notes, a.form_data,
               u.full_name as user_name, u.email as user_email,
               bp.title as program_name, bp.organization,
               COALESCE(a.form_data->>'business_plan_summary', '') as business_plan_summary,
               COALESCE(a.form_data->>'funding_request', '') as funding_request,
               COALESCE(a.form_data->>'expected_roi', '') as expected_roi
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN business_programs bp ON a.program_id = bp.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (program_id) {
        query += ` AND a.program_id = $${paramIndex}`;
        params.push(program_id);
        paramIndex++;
      }

      query += ` ORDER BY a.last_updated DESC`;

      // Get total count
      let countQuery = query.replace(/ORDER BY.*$/, '');
      countQuery = countQuery.replace(
        /SELECT.*?FROM/,
        'SELECT COUNT(*) FROM'
      );
      const totalResult = await pool.query(countQuery, params);
      const total = parseInt(totalResult.rows[0].count);

      // Add pagination
      const offset = (Number(page) - 1) * Number(limit);
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(limit), offset);

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          applications: result.rows,
          pagination: {
            current_page: Number(page),
            per_page: Number(limit),
            total,
            total_pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting applications:', error);
      throw new AppError('Failed to get applications', 500);
    }
  });

  updateApplicationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const schema = Joi.object({
      status: Joi.string().valid('pending', 'draft', 'under_review', 'approved', 'rejected').required(),
      notes: Joi.string().max(1000).allow('', null).optional()
    });

    const { error } = schema.validate({ status, notes });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    try {
      const result = await pool.query(
        `UPDATE applications 
         SET status = $1, notes = $2, last_updated = NOW() 
         WHERE id = $3 
         RETURNING id, status, notes`,
        [status, notes || null, applicationId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Application not found', 404);
      }

      res.json({
        success: true,
        message: 'Application status updated successfully',
        data: { application: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new AppError('Failed to update application status', 500);
    }
  });

  getApplicationDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.params;

    try {
      const result = await pool.query(`
        SELECT a.*, 
               u.full_name as user_name, u.email as user_email,
               bp.title as program_name, bp.organization,
               p.business_type, p.business_size, p.industry, p.region,
               p.current_revenue, p.employees_count,
               COALESCE(a.form_data->>'business_plan_summary', '') as business_plan_summary,
               COALESCE(a.form_data->>'funding_request', '') as funding_request,
               COALESCE(a.form_data->>'expected_roi', '') as expected_roi,
               COALESCE(a.form_data->>'timeline', '') as timeline,
               COALESCE(
                 (SELECT json_agg(
                   json_build_object(
                     'id', f.id,
                     'field_name', f.field_name,
                     'original_name', f.original_name,
                     'file_size', f.file_size,
                     'mime_type', f.mime_type,
                     'uploaded_at', f.uploaded_at
                   )
                 ) FROM file_uploads f WHERE f.application_id = a.id),
                 '[]'::json
               ) as files
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        JOIN business_programs bp ON a.program_id = bp.id
        WHERE a.id = $1
      `, [applicationId]);

      if (result.rows.length === 0) {
        throw new AppError('Application not found', 404);
      }

      res.json({
        success: true,
        data: { application: result.rows[0] }
      });
    } catch (error) {
      console.error('Error getting application details:', error);
      throw new AppError('Failed to get application details', 500);
    }
  });

  // Program Management
  createProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      eligibility_criteria: Joi.string().required(),
      funding_amount: Joi.string().required(),
      application_deadline: Joi.date().iso().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    try {
      const result = await pool.query(`
        INSERT INTO business_programs 
        (title, description, organization, program_type, funding_amount, 
         application_deadline, requirements, benefits, application_process, 
         eligible_regions, required_documents, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
        value.name, // Map name to title
        value.description, 
        'Government Program', // Default organization
        'grant', // Default program_type
        value.funding_amount, 
        value.application_deadline, 
        value.eligibility_criteria, // Map eligibility_criteria to requirements
        'Financial support for business development', // Default benefits
        'Submit application through the platform', // Default application_process
        [], // Default eligible_regions
        [], // Default required_documents
        true // Default is_active
      ]);

      res.status(201).json({
        success: true,
        message: 'Program created successfully',
        data: { program: result.rows[0] }
      });
    } catch (error) {
      console.error('Error creating program:', error);
      throw new AppError('Failed to create program', 500);
    }
  });

  updateProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { programId } = req.params;
    
    const schema = Joi.object({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      eligibility_criteria: Joi.string().optional(),
      funding_amount: Joi.string().optional(),
      application_deadline: Joi.date().iso().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    try {
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      // Map frontend fields to backend fields
      const fieldMapping: {[key: string]: string} = {
        name: 'title',
        eligibility_criteria: 'requirements'
      };

      Object.entries(value).forEach(([key, val]) => {
        const dbField = fieldMapping[key] || key;
        updateFields.push(`${dbField} = $${paramIndex}`);
        params.push(val);
        paramIndex++;
      });

      if (updateFields.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(programId);

      const result = await pool.query(`
        UPDATE business_programs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        throw new AppError('Program not found', 404);
      }

      res.json({
        success: true,
        message: 'Program updated successfully',
        data: { program: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating program:', error);
      throw new AppError('Failed to update program', 500);
    }
  });

  deleteProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { programId } = req.params;

    try {
      // Check if program has applications
      const applicationsResult = await pool.query(
        'SELECT COUNT(*) as count FROM applications WHERE program_id = $1',
        [programId]
      );

      const hasApplications = parseInt(applicationsResult.rows[0].count) > 0;

      if (hasApplications) {
        // Don't delete, just deactivate
        await pool.query(
          'UPDATE business_programs SET is_active = false WHERE id = $1',
          [programId]
        );

        res.json({
          success: true,
          message: 'Program deactivated (has existing applications)'
        });
      } else {
        // Safe to delete
        const result = await pool.query(
          'DELETE FROM business_programs WHERE id = $1 RETURNING id',
          [programId]
        );

        if (result.rows.length === 0) {
          throw new AppError('Program not found', 404);
        }

        res.json({
          success: true,
          message: 'Program deleted successfully'
        });
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      throw new AppError('Failed to delete program', 500);
    }
  });
}
