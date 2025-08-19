import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Public analytics endpoints (for tracking)
router.post('/track', analyticsController.trackEvent);
router.post('/track/page-view', analyticsController.trackPageView);
router.post('/track/program/:programId/view', analyticsController.trackProgramView);
router.post('/track/search', analyticsController.trackSearch);

// Authenticated analytics endpoints
router.post('/track/application', authenticate, analyticsController.trackApplicationAction);
router.post('/track/chat', authenticate, analyticsController.trackChatInteraction);
router.get('/user', authenticate, analyticsController.getUserAnalytics);

// Admin analytics endpoints (would typically have admin auth middleware)
router.get('/dashboard', analyticsController.getDashboard);

export default router;
