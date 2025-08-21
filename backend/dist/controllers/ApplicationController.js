"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationController = void 0;
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const applicationSchema = joi_1.default.object({
    program_id: joi_1.default.number().integer().positive().required(),
    application_data: joi_1.default.object({
        company_name: joi_1.default.string().required(),
        business_description: joi_1.default.string().required(),
        funding_requested: joi_1.default.number().positive().optional(),
        project_description: joi_1.default.string().required(),
        expected_outcomes: joi_1.default.string().required(),
        timeline: joi_1.default.string().required(),
        contact_person: joi_1.default.string().required(),
        contact_phone: joi_1.default.string().required(),
        additional_documents: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).required(),
});
class ApplicationController {
    constructor() {
        this.submitApplication = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { error } = applicationSchema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const userId = req.user?.id;
            const { program_id, application_data } = req.body;
            const programResult = await database_1.default.query('SELECT id, title FROM business_programs WHERE id = $1 AND is_active = true', [program_id]);
            if (programResult.rows.length === 0) {
                throw new errorHandler_1.AppError('Program not found or not active', 404);
            }
            const existingApplication = await database_1.default.query('SELECT id FROM applications WHERE user_id = $1 AND program_id = $2', [userId, program_id]);
            if (existingApplication.rows.length > 0) {
                throw new errorHandler_1.AppError('You have already applied to this program', 400);
            }
            const result = await database_1.default.query(`INSERT INTO applications (user_id, program_id, status, application_data)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`, [userId, program_id, JSON.stringify(application_data)]);
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
        this.getUserApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            const queryParams = [userId];
            let paramIndex = 2;
            if (status) {
                query += ` AND a.status = $${paramIndex}`;
                queryParams.push(status);
                paramIndex++;
            }
            query += ` ORDER BY a.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(Number(limit), offset);
            const result = await database_1.default.query(query, queryParams);
            let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE user_id = $1';
            const countParams = [userId];
            if (status) {
                countQuery += ' AND status = $2';
                countParams.push(status);
            }
            const countResult = await database_1.default.query(countQuery, countParams);
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
        this.getApplicationById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { id } = req.params;
            const result = await database_1.default.query(`SELECT a.*, p.title as program_title, p.organization, p.description as program_description
       FROM applications a
       JOIN business_programs p ON a.program_id = p.id
       WHERE a.id = $1 AND a.user_id = $2`, [id, userId]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Application not found', 404);
            }
            const application = result.rows[0];
            if (typeof application.application_data === 'string') {
                application.application_data = JSON.parse(application.application_data);
            }
            res.json({
                success: true,
                data: { application },
            });
        });
    }
}
exports.ApplicationController = ApplicationController;
//# sourceMappingURL=ApplicationController.js.map