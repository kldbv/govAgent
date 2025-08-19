"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const ConversationalAIService_1 = require("../services/ConversationalAIService");
const database_1 = __importDefault(require("../utils/database"));
const joi_1 = __importDefault(require("joi"));
class ChatController {
    constructor() {
        this.aiService = new ConversationalAIService_1.ConversationalAIService();
        this.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const schema = joi_1.default.object({
                message: joi_1.default.string().min(1).max(1000).required(),
                include_history: joi_1.default.boolean().default(true)
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            const { message, include_history } = value;
            try {
                const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
                const userProfile = profileResult.rows[0] || null;
                const chatHistory = include_history
                    ? await this.aiService.getChatHistory(userId)
                    : [];
                const intent = await this.aiService.analyzeUserIntent(message, userProfile);
                const aiResponse = await this.aiService.generateResponse(message, intent, userProfile, chatHistory);
                await this.aiService.saveChatMessage(userId, message, aiResponse, intent);
                if (intent.confidence > 0.7) {
                    await this.aiService.updateProfileFromIntent(userId, intent);
                }
                res.json({
                    success: true,
                    data: {
                        message: aiResponse,
                        intent: intent.intent,
                        extracted_data: intent.extracted_data,
                        confidence: intent.confidence,
                        suggested_actions: intent.suggested_actions
                    }
                });
            }
            catch (error) {
                console.error('Error in chat message processing:', error);
                throw new errorHandler_1.AppError('Failed to process message', 500);
            }
        });
        this.getChatHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            const { page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            try {
                const result = await database_1.default.query(`SELECT id, user_message, ai_response, intent, extracted_data, confidence, created_at
         FROM chat_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`, [userId, Number(limit), offset]);
                const countResult = await database_1.default.query('SELECT COUNT(*) as total FROM chat_history WHERE user_id = $1', [userId]);
                const total = parseInt(countResult.rows[0].total);
                res.json({
                    success: true,
                    data: {
                        messages: result.rows,
                        pagination: {
                            current_page: Number(page),
                            per_page: Number(limit),
                            total,
                            total_pages: Math.ceil(total / Number(limit))
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error fetching chat history:', error);
                throw new errorHandler_1.AppError('Failed to fetch chat history', 500);
            }
        });
        this.clearChatHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                await database_1.default.query('DELETE FROM chat_history WHERE user_id = $1', [userId]);
                res.json({
                    success: true,
                    message: 'Chat history cleared successfully'
                });
            }
            catch (error) {
                console.error('Error clearing chat history:', error);
                throw new errorHandler_1.AppError('Failed to clear chat history', 500);
            }
        });
        this.generateSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
                const userProfile = profileResult.rows[0];
                const suggestions = [];
                if (!userProfile) {
                    suggestions.push("Расскажите о своем бизнесе", "Какая поддержка нужна вашему бизнесу?", "Help me find business programs");
                }
                else {
                    if (!userProfile.bin) {
                        suggestions.push("Нужно ли указать БИН в профиле?");
                    }
                    if (!userProfile.oked_code) {
                        suggestions.push("Помогите определить ОКЭД код");
                    }
                    if (!userProfile.desired_loan_amount) {
                        suggestions.push("Какая сумма финансирования нужна?");
                    }
                    suggestions.push("Найти подходящие программы поддержки", "Как подготовить документы для заявки?", "Показать программы для моей отрасли");
                }
                res.json({
                    success: true,
                    data: { suggestions }
                });
            }
            catch (error) {
                console.error('Error generating suggestions:', error);
                throw new errorHandler_1.AppError('Failed to generate suggestions', 500);
            }
        });
        this.getInsights = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            try {
                const analyticsResult = await database_1.default.query(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT intent) as unique_intents,
          AVG(confidence) as avg_confidence,
          intent,
          COUNT(*) as intent_count
        FROM chat_history 
        WHERE user_id = $1 
        GROUP BY intent
        ORDER BY intent_count DESC
      `, [userId]);
                const extractedDataResult = await database_1.default.query(`
        SELECT extracted_data 
        FROM chat_history 
        WHERE user_id = $1 AND extracted_data IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]);
                const extractedFields = new Set();
                extractedDataResult.rows.forEach(row => {
                    if (row.extracted_data) {
                        Object.keys(row.extracted_data).forEach(key => {
                            if (row.extracted_data[key]) {
                                extractedFields.add(key);
                            }
                        });
                    }
                });
                res.json({
                    success: true,
                    data: {
                        total_messages: analyticsResult.rows.reduce((sum, row) => sum + parseInt(row.intent_count), 0),
                        unique_intents: analyticsResult.rows.length,
                        avg_confidence: parseFloat(analyticsResult.rows[0]?.avg_confidence || '0'),
                        intent_breakdown: analyticsResult.rows.map(row => ({
                            intent: row.intent,
                            count: parseInt(row.intent_count)
                        })),
                        extracted_fields: Array.from(extractedFields),
                        profile_completion_percentage: Math.min(100, extractedFields.size * 12.5)
                    }
                });
            }
            catch (error) {
                console.error('Error getting chat insights:', error);
                throw new errorHandler_1.AppError('Failed to get insights', 500);
            }
        });
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=ChatController.js.map