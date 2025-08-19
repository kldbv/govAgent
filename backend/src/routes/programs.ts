import { Router } from 'express';
import { ProgramController } from '../controllers/ProgramController';
import { GuidanceController } from '../controllers/GuidanceController';
import { InstructionController } from '../controllers/InstructionController';
import { authenticate } from '../middleware/auth';

const router = Router();
const programController = new ProgramController();
const guidanceController = new GuidanceController();
const instructionController = new InstructionController();

router.get('/', programController.getPrograms);
router.get('/search', programController.searchPrograms);
router.get('/stats', programController.getProgramStats);
router.get('/recommendations', authenticate, programController.getRecommendations);
router.get('/:id', programController.getProgramById);

// Guidance routes
router.get('/:programId/guidance', authenticate, guidanceController.getGuidance);
router.post('/:programId/guidance/template', authenticate, guidanceController.generateTemplate);
router.post('/:programId/guidance/step-complete', authenticate, guidanceController.markStepComplete);
router.get('/:programId/guidance/progress', authenticate, guidanceController.getProgress);

// Instruction routes
router.get('/:programId/instructions', authenticate, instructionController.getInstructions);
router.post('/:programId/instructions/step-status', authenticate, instructionController.updateStepStatus);
router.get('/:programId/instructions/progress', authenticate, instructionController.getProgress);
router.post('/:programId/instructions/submit', authenticate, instructionController.markApplicationSubmitted);

export default router;
