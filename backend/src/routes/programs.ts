import { Router } from 'express';
import { ProgramController } from '../controllers/ProgramController';
import { authenticate } from '../middleware/auth';

const router = Router();
const programController = new ProgramController();

router.get('/', programController.getPrograms);
router.get('/recommendations', authenticate, programController.getRecommendations);
router.get('/:id', programController.getProgramById);

export default router;
