"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalyticsController_1 = require("../controllers/AnalyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const analyticsController = new AnalyticsController_1.AnalyticsController();
router.post('/track', analyticsController.trackEvent);
router.post('/track/page-view', analyticsController.trackPageView);
router.post('/track/program/:programId/view', analyticsController.trackProgramView);
router.post('/track/search', analyticsController.trackSearch);
router.post('/track/application', auth_1.authenticate, analyticsController.trackApplicationAction);
router.post('/track/chat', auth_1.authenticate, analyticsController.trackChatInteraction);
router.get('/user', auth_1.authenticate, analyticsController.getUserAnalytics);
router.get('/dashboard', analyticsController.getDashboard);
exports.default = router;
//# sourceMappingURL=analytics.js.map