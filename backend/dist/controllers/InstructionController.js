"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const InstructionService_1 = require("../services/InstructionService");
const database_1 = __importDefault(require("../utils/database"));
const joi_1 = __importDefault(require("joi"));
class InstructionController {
    constructor() {
        this.instructionService = new InstructionService_1.InstructionService();
        this.getInstructions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            if (!programId || isNaN(Number(programId))) {
                throw new errorHandler_1.AppError('Valid program ID is required', 400);
            }
            try {
                const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
                if (profileResult.rows.length === 0) {
                    throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
                }
                const userProfile = profileResult.rows[0];
                const instructions = await this.instructionService.generateApplicationInstructions(Number(programId), userProfile);
                const progress = await this.instructionService.getApplicationProgress(Number(programId), userId);
                await this.instructionService.trackInstructionUsage(Number(programId), userId, 'viewed');
                res.json({
                    success: true,
                    data: {
                        instructions,
                        progress
                    }
                });
            }
            catch (error) {
                console.error('Error getting instructions:', error);
                throw new errorHandler_1.AppError('Failed to generate instructions', 500);
            }
        });
        this.updateStepStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                step_number: joi_1.default.number().integer().min(1).required(),
                status: joi_1.default.string().valid('pending', 'in_progress', 'completed', 'blocked').required(),
                notes: joi_1.default.string().max(500).optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { step_number, status, notes } = value;
            try {
                await this.instructionService.updateStepStatus(Number(programId), userId, step_number, status, notes);
                if (status === 'in_progress') {
                    await this.instructionService.trackInstructionUsage(Number(programId), userId, 'step_started');
                }
                else if (status === 'completed') {
                    await this.instructionService.trackInstructionUsage(Number(programId), userId, 'step_completed');
                }
                res.json({
                    success: true,
                    message: 'Step status updated successfully'
                });
            }
            catch (error) {
                console.error('Error updating step status:', error);
                throw new errorHandler_1.AppError('Failed to update step status', 500);
            }
        });
        this.getProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                const progress = await this.instructionService.getApplicationProgress(Number(programId), userId);
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
            }
            catch (error) {
                console.error('Error getting progress:', error);
                throw new errorHandler_1.AppError('Failed to get progress', 500);
            }
        });
        this.getInstructionAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            try {
                const usageStatsResult = await database_1.default.query(`
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
                const completionStatsResult = await database_1.default.query(`
        SELECT 
          program_id,
          status,
          COUNT(*) as step_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM application_step_progress
        GROUP BY program_id, status
        ORDER BY program_id, status
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
                const usageAnalytics = usageStatsResult.rows.map(row => ({
                    program_id: row.program_id,
                    program_title: programMap[row.program_id] || 'Unknown Program',
                    action: row.action,
                    usage_count: parseInt(row.usage_count),
                    unique_users: parseInt(row.unique_users)
                }));
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
            }
            catch (error) {
                console.error('Error getting instruction analytics:', error);
                throw new errorHandler_1.AppError('Failed to get analytics', 500);
            }
        });
        this.markApplicationSubmitted = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                submission_reference: joi_1.default.string().max(100).optional(),
                notes: joi_1.default.string().max(500).optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { submission_reference, notes } = value;
            try {
                await database_1.default.query(`INSERT INTO application_submissions (user_id, program_id, submission_reference, notes, submitted_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, program_id) 
         DO UPDATE SET submission_reference = EXCLUDED.submission_reference,
                       notes = EXCLUDED.notes,
                       submitted_at = NOW()`, [userId, programId, submission_reference, notes]);
                await this.instructionService.trackInstructionUsage(Number(programId), userId, 'application_submitted');
                res.json({
                    success: true,
                    message: 'Application submission recorded successfully',
                    data: {
                        submission_reference,
                        submitted_at: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                console.error('Error marking application submitted:', error);
                throw new errorHandler_1.AppError('Failed to record application submission', 500);
            }
        });
    }
    async getTotalSteps(programId) {
        try {
            const result = await database_1.default.query(`SELECT instructions_data 
         FROM program_instructions 
         WHERE program_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`, [programId]);
            if (result.rows.length > 0) {
                const instructions = JSON.parse(result.rows[0].instructions_data);
                return instructions.steps ? instructions.steps.length : 0;
            }
            return 0;
        }
        catch (error) {
            console.error('Error getting total steps:', error);
            return 0;
        }
    }
}
exports.InstructionController = InstructionController;
//# sourceMappingURL=InstructionController.js.map