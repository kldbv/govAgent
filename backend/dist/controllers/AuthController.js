"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    full_name: joi_1.default.string().min(2).required(),
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
const profileSchema = joi_1.default.object({
    business_type: joi_1.default.string().valid('startup', 'sme', 'individual', 'ngo').required(),
    business_size: joi_1.default.string().valid('micro', 'small', 'medium', 'large').required(),
    industry: joi_1.default.string().required(),
    region: joi_1.default.string().required(),
    experience_years: joi_1.default.number().integer().min(0).required(),
    annual_revenue: joi_1.default.number().min(0).optional(),
    employee_count: joi_1.default.number().integer().min(0).optional(),
});
class AuthController {
    constructor() {
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { error } = registerSchema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { email, password, full_name } = req.body;
            const existingUser = await database_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                throw new errorHandler_1.AppError('User with this email already exists', 400);
            }
            const saltRounds = 12;
            const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
            const result = await database_1.default.query(`INSERT INTO users (email, password, full_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, full_name, created_at`, [email, hashedPassword, full_name]);
            const user = result.rows[0];
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new errorHandler_1.AppError('JWT secret not configured', 500);
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
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
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { error } = loginSchema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { email, password } = req.body;
            const result = await database_1.default.query('SELECT id, email, password, full_name FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            const user = result.rows[0];
            const isValidPassword = await bcrypt_1.default.compare(password, user.password);
            if (!isValidPassword) {
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new errorHandler_1.AppError('JWT secret not configured', 500);
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                    },
                    token,
                },
            });
        });
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const userResult = await database_1.default.query(`SELECT u.id, u.email, u.full_name, u.created_at,
              p.business_type, p.business_size, p.industry, p.region,
              p.experience_years, p.annual_revenue, p.employee_count
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = $1`, [userId]);
            const user = userResult.rows[0];
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                        created_at: user.created_at,
                        profile: user.business_type ? {
                            business_type: user.business_type,
                            business_size: user.business_size,
                            industry: user.industry,
                            region: user.region,
                            experience_years: user.experience_years,
                            annual_revenue: user.annual_revenue,
                            employee_count: user.employee_count,
                        } : null,
                    },
                },
            });
        });
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { error } = profileSchema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const userId = req.user?.id;
            const { business_type, business_size, industry, region, experience_years, annual_revenue, employee_count, } = req.body;
            const existingProfile = await database_1.default.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
            let result;
            if (existingProfile.rows.length > 0) {
                result = await database_1.default.query(`UPDATE user_profiles 
         SET business_type = $1, business_size = $2, industry = $3, region = $4,
             experience_years = $5, annual_revenue = $6, employee_count = $7, updated_at = NOW()
         WHERE user_id = $8
         RETURNING *`, [
                    business_type,
                    business_size,
                    industry,
                    region,
                    experience_years,
                    annual_revenue,
                    employee_count,
                    userId,
                ]);
            }
            else {
                result = await database_1.default.query(`INSERT INTO user_profiles 
         (user_id, business_type, business_size, industry, region, experience_years, annual_revenue, employee_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`, [
                    userId,
                    business_type,
                    business_size,
                    industry,
                    region,
                    experience_years,
                    annual_revenue,
                    employee_count,
                ]);
            }
            const profile = result.rows[0];
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { profile },
            });
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map