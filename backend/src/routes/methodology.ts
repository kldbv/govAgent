import { Router } from 'express';
import { MethodologyController } from '../controllers/MethodologyController';

const router = Router();
const methodologyController = new MethodologyController();

router.get('/:slug', methodologyController.getBySlug);

export default router;

