import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate } from '../middleware/auth';

const router = Router();
const applicationController = new ApplicationController();

// All routes require authentication
router.use(authenticate);

router.post('/', applicationController.submitApplication);
router.get('/', applicationController.getUserApplications);
router.get('/:id', applicationController.getApplicationById);

export default router;
