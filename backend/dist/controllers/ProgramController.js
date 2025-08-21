"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const RecommendationService_1 = require("../services/RecommendationService");
class ProgramController {
    constructor() {
        this.recommendationService = new RecommendationService_1.RecommendationService();
        this.getPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, program_type, target_audience, organization, search } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = `
      SELECT id, title, description, organization, program_type, target_audience,
             funding_amount, application_deadline, requirements, benefits,
             application_process, contact_info, created_at
      FROM business_programs 
      WHERE is_active = true
    `;
            const queryParams = [];
            let paramIndex = 1;
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
            query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(Number(limit), offset);
            const result = await database_1.default.query(query, queryParams);
            let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs 
      WHERE is_active = true
    `;
            const countParams = [];
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
            const countResult = await database_1.default.query(countQuery, countParams);
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
        this.getProgramById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const result = await database_1.default.query(`SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE id = $1 AND is_active = true`, [id]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Program not found', 404);
            }
            res.json({
                success: true,
                data: { program: result.rows[0] },
            });
        });
        this.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
            if (profileResult.rows.length === 0) {
                throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
            }
            const userProfile = profileResult.rows[0];
            const programsResult = await database_1.default.query(`SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE is_active = true
       ORDER BY created_at DESC`);
            const programs = programsResult.rows;
            const recommendations = await this.recommendationService.getRecommendations(userProfile, programs);
            res.json({
                success: true,
                data: { recommendations },
            });
        });
    }
}
exports.ProgramController = ProgramController;
//# sourceMappingURL=ProgramController.js.map