import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AnalyticsService } from '../services/AnalyticsService';
import Joi from 'joi';

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  trackEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Validate request body
    const schema = Joi.object({
      event_type: Joi.string().max(100).required(),
      event_category: Joi.string().max(100).required(),
      event_data: Joi.object().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
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

    } catch (error) {
      console.error('Error tracking event:', error);
      throw new AppError('Failed to track event', 500);
    }
  });

  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    // This would typically require admin authentication
    try {
      const metrics = await this.analyticsService.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw new AppError('Failed to get dashboard metrics', 500);
    }
  });

  getUserAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    try {
      const analytics = await this.analyticsService.getUserAnalytics(userId);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw new AppError('Failed to get user analytics', 500);
    }
  });

  trackPageView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const schema = Joi.object({
      page: Joi.string().required(),
      additional_data: Joi.object().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { page, additional_data } = value;

    try {
      await this.analyticsService.trackPageView(userId || null, page, additional_data);

      res.json({
        success: true,
        message: 'Page view tracked'
      });

    } catch (error) {
      console.error('Error tracking page view:', error);
      // Don't throw error for analytics - it shouldn't break user experience
      res.json({
        success: true,
        message: 'Event received'
      });
    }
  });

  trackProgramView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { programId } = req.params;

    if (!programId || isNaN(Number(programId))) {
      throw new AppError('Valid program ID is required', 400);
    }

    const schema = Joi.object({
      program_title: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { program_title } = value;

    try {
      await this.analyticsService.trackProgramView(userId || null, Number(programId), program_title);

      res.json({
        success: true,
        message: 'Program view tracked'
      });

    } catch (error) {
      console.error('Error tracking program view:', error);
      res.json({
        success: true,
        message: 'Event received'
      });
    }
  });

  trackApplicationAction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const schema = Joi.object({
      program_id: Joi.number().integer().required(),
      action: Joi.string().valid('draft_saved', 'submitted', 'viewed_instructions', 'downloaded_template').required(),
      additional_data: Joi.object().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { program_id, action, additional_data } = value;

    try {
      await this.analyticsService.trackApplicationAction(userId, program_id, action, additional_data);

      res.json({
        success: true,
        message: 'Application action tracked'
      });

    } catch (error) {
      console.error('Error tracking application action:', error);
      res.json({
        success: true,
        message: 'Event received'
      });
    }
  });

  trackChatInteraction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const schema = Joi.object({
      intent: Joi.string().required(),
      confidence: Joi.number().min(0).max(1).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { intent, confidence } = value;

    try {
      await this.analyticsService.trackChatInteraction(userId, intent, confidence);

      res.json({
        success: true,
        message: 'Chat interaction tracked'
      });

    } catch (error) {
      console.error('Error tracking chat interaction:', error);
      res.json({
        success: true,
        message: 'Event received'
      });
    }
  });

  trackSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const schema = Joi.object({
      query: Joi.string().required(),
      results_count: Joi.number().integer().min(0).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { query, results_count } = value;

    try {
      await this.analyticsService.trackSearch(userId || null, query, results_count);

      res.json({
        success: true,
        message: 'Search tracked'
      });

    } catch (error) {
      console.error('Error tracking search:', error);
      res.json({
        success: true,
        message: 'Event received'
      });
    }
  });
}
