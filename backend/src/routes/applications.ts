import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate } from '../middleware/auth';

const router = Router();
const applicationController = new ApplicationController();

// All routes require authentication
router.use(authenticate);

// Application workflow routes
router.get('/', applicationController.getApplications);
router.get('/stats', applicationController.getApplicationStats); // Admin route
router.get('/:applicationId', applicationController.getApplication);

// Program-specific application routes
router.get('/program/:programId/form', applicationController.getApplicationForm);
router.get('/program/:programId/application', applicationController.getApplicationByProgram);
router.post('/program/:programId/draft', applicationController.saveApplicationDraft);

// Application submission
router.post('/:applicationId/submit', applicationController.submitApplication);

export default router;
