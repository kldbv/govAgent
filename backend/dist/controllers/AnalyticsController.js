"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const AnalyticsService_1 = require("../services/AnalyticsService");
const joi_1 = __importDefault(require("joi"));
class AnalyticsController {
    constructor() {
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
        this.trackEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const schema = joi_1.default.object({
                event_type: joi_1.default.string().max(100).required(),
                event_category: joi_1.default.string().max(100).required(),
                event_data: joi_1.default.object().optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { event_type, event_category, event_data } = value;
            try {
                await this.analyticsService.trackEvent({
                    user_id: userId || null,
                    event_type,
                    event_category,
                    event_data,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });
                res.json({
                    success: true,
                    message: 'Event tracked successfully'
                });
            }
            catch (error) {
                console.error('Error tracking event:', error);
                throw new errorHandler_1.AppError('Failed to track event', 500);
            }
        });
        this.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            try {
                const metrics = await this.analyticsService.getDashboardMetrics();
                res.json({
                    success: true,
                    data: metrics
                });
            }
            catch (error) {
                console.error('Error getting dashboard metrics:', error);
                throw new errorHandler_1.AppError('Failed to get dashboard metrics', 500);
            }
        });
        this.getUserAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                const analytics = await this.analyticsService.getUserAnalytics(userId);
                res.json({
                    success: true,
                    data: analytics
                });
            }
            catch (error) {
                console.error('Error getting user analytics:', error);
                throw new errorHandler_1.AppError('Failed to get user analytics', 500);
            }
        });
        this.trackPageView = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const schema = joi_1.default.object({
                page: joi_1.default.string().required(),
                additional_data: joi_1.default.object().optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { page, additional_data } = value;
            try {
                await this.analyticsService.trackPageView(userId || null, page, additional_data);
                res.json({
                    success: true,
                    message: 'Page view tracked'
                });
            }
            catch (error) {
                console.error('Error tracking page view:', error);
                res.json({
                    success: true,
                    message: 'Event received'
                });
            }
        });
        this.trackProgramView = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const { programId } = req.params;
            if (!programId || isNaN(Number(programId))) {
                throw new errorHandler_1.AppError('Valid program ID is required', 400);
            }
            const schema = joi_1.default.object({
                program_title: joi_1.default.string().required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { program_title } = value;
            try {
                await this.analyticsService.trackProgramView(userId || null, Number(programId), program_title);
                res.json({
                    success: true,
                    message: 'Program view tracked'
                });
            }
            catch (error) {
                console.error('Error tracking program view:', error);
                res.json({
                    success: true,
                    message: 'Event received'
                });
            }
        });
        this.trackApplicationAction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                program_id: joi_1.default.number().integer().required(),
                action: joi_1.default.string().valid('draft_saved', 'submitted', 'viewed_instructions', 'downloaded_template').required(),
                additional_data: joi_1.default.object().optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { program_id, action, additional_data } = value;
            try {
                await this.analyticsService.trackApplicationAction(userId, program_id, action, additional_data);
                res.json({
                    success: true,
                    message: 'Application action tracked'
                });
            }
            catch (error) {
                console.error('Error tracking application action:', error);
                res.json({
                    success: true,
                    message: 'Event received'
                });
            }
        });
        this.trackChatInteraction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                intent: joi_1.default.string().required(),
                confidence: joi_1.default.number().min(0).max(1).required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { intent, confidence } = value;
            try {
                await this.analyticsService.trackChatInteraction(userId, intent, confidence);
                res.json({
                    success: true,
                    message: 'Chat interaction tracked'
                });
            }
            catch (error) {
                console.error('Error tracking chat interaction:', error);
                res.json({
                    success: true,
                    message: 'Event received'
                });
            }
        });
        this.trackSearch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const schema = joi_1.default.object({
                query: joi_1.default.string().required(),
                results_count: joi_1.default.number().integer().min(0).required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { query, results_count } = value;
            try {
                await this.analyticsService.trackSearch(userId || null, query, results_count);
                res.json({
                    success: true,
                    message: 'Search tracked'
                });
            }
            catch (error) {
                console.error('Error tracking search:', error);
                res.json({
                    success: true,
                    message: 'Event received'
                });
            }
        });
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=AnalyticsController.js.map