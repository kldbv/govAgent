"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidanceController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const GuidanceService_1 = require("../services/GuidanceService");
const database_1 = __importDefault(require("../utils/database"));
const joi_1 = __importDefault(require("joi"));
class GuidanceController {
    constructor() {
        this.guidanceService = new GuidanceService_1.GuidanceService();
        this.getGuidance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            if (!programId || isNaN(Number(programId))) {
                throw new errorHandler_1.AppError('Valid program ID is required', 400);
            }
            try {
                let guidance = await this.guidanceService.getCachedGuidance(Number(programId), userId);
                if (!guidance) {
                    const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
                    if (profileResult.rows.length === 0) {
                        throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
                    }
                    const userProfile = profileResult.rows[0];
                    guidance = await this.guidanceService.generateDocumentGuidance(Number(programId), userProfile);
                }
                await this.guidanceService.trackGuidanceUsage(Number(programId), userId, 'viewed');
                res.json({
                    success: true,
                    data: { guidance }
                });
            }
            catch (error) {
                console.error('Error getting guidance:', error);
                throw new errorHandler_1.AppError('Failed to generate guidance', 500);
            }
        });
        this.generateTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                document_type: joi_1.default.string().min(1).max(200).required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { document_type } = value;
            try {
                const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
                if (profileResult.rows.length === 0) {
                    throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
                }
                const userProfile = profileResult.rows[0];
                const programResult = await database_1.default.query(`SELECT id, title, description, organization, program_type, requirements,
                application_process, contact_info
         FROM business_programs 
         WHERE id = $1 AND is_active = true`, [programId]);
                if (programResult.rows.length === 0) {
                    throw new errorHandler_1.AppError('Program not found', 404);
                }
                const program = programResult.rows[0];
                const template = await this.guidanceService.generateTemplateDocument(document_type, userProfile, program);
                await this.guidanceService.trackGuidanceUsage(Number(programId), userId, 'downloaded_template');
                res.json({
                    success: true,
                    data: {
                        document_type,
                        template,
                        program_title: program.title
                    }
                });
            }
            catch (error) {
                console.error('Error generating template:', error);
                throw new errorHandler_1.AppError('Failed to generate template', 500);
            }
        });
        this.markStepComplete = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                step_number: joi_1.default.number().integer().min(1).required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { step_number } = value;
            try {
                await this.guidanceService.trackGuidanceUsage(Number(programId), userId, 'completed_step');
                await database_1.default.query(`INSERT INTO user_guidance_progress (user_id, program_id, step_number, completed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, program_id, step_number)
         DO UPDATE SET completed_at = NOW()`, [userId, programId, step_number]);
                res.json({
                    success: true,
                    message: 'Step marked as complete'
                });
            }
            catch (error) {
                console.error('Error marking step complete:', error);
                throw new errorHandler_1.AppError('Failed to mark step complete', 500);
            }
        });
        this.getProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                const progressResult = await database_1.default.query(`SELECT step_number, completed_at
         FROM user_guidance_progress
         WHERE user_id = $1 AND program_id = $2
         ORDER BY step_number`, [userId, programId]);
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
            }
            catch (error) {
                console.error('Error getting progress:', error);
                throw new errorHandler_1.AppError('Failed to get progress', 500);
            }
        });
        this.getGuidanceAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            try {
                const usageStatsResult = await database_1.default.query(`
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
                const programsResult = await database_1.default.query(`
        SELECT id, title 
        FROM business_programs 
        WHERE is_active = true
      `);
                const programMap = programsResult.rows.reduce((acc, row) => {
                    acc[row.id] = row.title;
                    return acc;
                }, {});
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
            }
            catch (error) {
                console.error('Error getting guidance analytics:', error);
                throw new errorHandler_1.AppError('Failed to get analytics', 500);
            }
        });
    }
}
exports.GuidanceController = GuidanceController;
//# sourceMappingURL=GuidanceController.js.map