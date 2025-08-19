import { Router } from 'express';
import { GuidanceController } from '../controllers/GuidanceController';
import { InstructionController } from '../controllers/InstructionController';

const router = Router();
const guidanceController = new GuidanceController();
const instructionController = new InstructionController();

// Analytics endpoints (can be used for admin dashboard)
router.get('/analytics', guidanceController.getGuidanceAnalytics);
router.get('/instruction-analytics', instructionController.getInstructionAnalytics);

export default router;
