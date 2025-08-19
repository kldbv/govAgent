import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ConversationalAIService } from '../services/ConversationalAIService';
import pool from '../utils/database';
import Joi from 'joi';

export class ChatController {
  private aiService = new ConversationalAIService();

  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Validate request body
    const schema = Joi.object({
      message: Joi.string().min(1).max(1000).required(),
      include_history: Joi.boolean().default(true)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { message, include_history } = value;

    try {
      // Get user profile
      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      const userProfile = profileResult.rows[0] || null;

      // Get chat history if requested
      const chatHistory = include_history 
        ? await this.aiService.getChatHistory(userId) 
        : [];

      // Analyze user intent
      const intent = await this.aiService.analyzeUserIntent(message, userProfile);

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        message, 
        intent, 
        userProfile, 
        chatHistory
      );

      // Save the conversation
      await this.aiService.saveChatMessage(userId, message, aiResponse, intent);

      // Update user profile if we extracted useful information
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

    } catch (error) {
      console.error('Error in chat message processing:', error);
      throw new AppError('Failed to process message', 500);
    }
  });

  getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const result = await pool.query(
        `SELECT id, user_message, ai_response, intent, extracted_data, confidence, created_at
         FROM chat_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, Number(limit), offset]
      );

      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM chat_history WHERE user_id = $1',
        [userId]
      );
      
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

    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new AppError('Failed to fetch chat history', 500);
    }
  });

  clearChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      await pool.query(
        'DELETE FROM chat_history WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Chat history cleared successfully'
      });

    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new AppError('Failed to clear chat history', 500);
    }
  });

  generateSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Get user profile
      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      const userProfile = profileResult.rows[0];

      // Generate contextual suggestions based on profile completeness
      const suggestions: string[] = [];

      if (!userProfile) {
        suggestions.push(
          "Расскажите о своем бизнесе", 
          "Какая поддержка нужна вашему бизнесу?",
          "Help me find business programs"
        );
      } else {
        // Profile exists, generate more specific suggestions
        if (!userProfile.bin) {
          suggestions.push("Нужно ли указать БИН в профиле?");
        }
        
        if (!userProfile.oked_code) {
          suggestions.push("Помогите определить ОКЭД код");
        }
        
        if (!userProfile.desired_loan_amount) {
          suggestions.push("Какая сумма финансирования нужна?");
        }

        suggestions.push(
          "Найти подходящие программы поддержки",
          "Как подготовить документы для заявки?",
          "Показать программы для моей отрасли"
        );
      }

      res.json({
        success: true,
        data: { suggestions }
      });

    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new AppError('Failed to generate suggestions', 500);
    }
  });

  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Get chat analytics
      const analyticsResult = await pool.query(`
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

      // Get profile completeness from extracted data
      const extractedDataResult = await pool.query(`
        SELECT extracted_data 
        FROM chat_history 
        WHERE user_id = $1 AND extracted_data IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]);

      const extractedFields = new Set<string>();
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
          profile_completion_percentage: Math.min(100, extractedFields.size * 12.5) // Rough estimate
        }
      });

    } catch (error) {
      console.error('Error getting chat insights:', error);
      throw new AppError('Failed to get insights', 500);
    }
  });
}
