import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const profileSchema = Joi.object({
  business_type: Joi.string().valid('startup', 'sme', 'individual', 'ngo').required(),
  business_size: Joi.string().valid('micro', 'small', 'medium', 'large').required(),
  industry: Joi.string().required(),
  region: Joi.string().required(),
  experience_years: Joi.number().integer().min(0).required(),
  annual_revenue: Joi.number().min(0).optional(),
  employee_count: Joi.number().integer().min(0).optional(),
  // New BPM fields
  bin: Joi.string().length(12).pattern(/^[0-9]+$/).optional(),
  oked_code: Joi.string().max(10).optional(),
  desired_loan_amount: Joi.number().min(0).optional(),
  business_goals: Joi.array().items(Joi.string()).optional(),
  business_goals_comments: Joi.string().max(2000).allow('', null).optional(),
}).unknown(false);

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password, full_name } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, full_name, created_at`,
      [email, hashedPassword, full_name]
    );

    const user = result.rows[0];

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
        },
        token,
      },
    });
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, email, password, full_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role || 'user',
        },
        token,
      },
    });
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Get user with profile
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.created_at, u.role,
              p.user_id AS profile_user_id,
              p.business_type, p.business_size, p.industry, p.region,
              p.experience_years, p.annual_revenue, p.employee_count,
              p.bin, p.oked_code, p.desired_loan_amount, p.business_goals, p.business_goals_comments
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = $1`,
      [userId]
    );

    const row = userResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          created_at: row.created_at,
          role: row.role || 'user',
          profile: row.profile_user_id ? {
            business_type: row.business_type,
            business_size: row.business_size,
            industry: row.industry,
            region: row.region,
            experience_years: row.experience_years,
            annual_revenue: row.annual_revenue,
            employee_count: row.employee_count,
            bin: row.bin,
            oked_code: row.oked_code,
            desired_loan_amount: row.desired_loan_amount,
            business_goals: row.business_goals,
            business_goals_comments: row.business_goals_comments,
          } : null,
        },
      },
    });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error } = profileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user?.id;
    const {
      business_type,
      business_size,
      industry,
      region,
      experience_years,
      annual_revenue,
      employee_count,
      bin,
      oked_code,
      desired_loan_amount,
      business_goals,
      business_goals_comments,
    } = req.body;

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await pool.query(
        `UPDATE user_profiles 
         SET business_type = $1, business_size = $2, industry = $3, region = $4,
             experience_years = $5, annual_revenue = $6, employee_count = $7,
             bin = $8, oked_code = $9, desired_loan_amount = $10, business_goals = $11,
             business_goals_comments = $12,
             updated_at = NOW()
         WHERE user_id = $13
         RETURNING *`,
        [
          business_type,
          business_size,
          industry,
          region,
          experience_years,
          annual_revenue,
          employee_count,
          bin,
          oked_code,
          desired_loan_amount,
          business_goals,
          business_goals_comments,
          userId,
        ]
      );
    } else {
      // Create new profile
      result = await pool.query(
        `INSERT INTO user_profiles 
         (user_id, business_type, business_size, industry, region, experience_years, annual_revenue, employee_count, bin, oked_code, desired_loan_amount, business_goals, business_goals_comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          userId,
          business_type,
          business_size,
          industry,
          region,
          experience_years,
          annual_revenue,
          employee_count,
          bin,
          oked_code,
          desired_loan_amount,
          business_goals,
          business_goals_comments,
        ]
      );
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    });
  });
}
