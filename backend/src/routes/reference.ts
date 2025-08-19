import { Router } from 'express';
import { ReferenceController } from '../controllers/ReferenceController';

const router = Router();
const referenceController = new ReferenceController();

// Reference data endpoints (public)
router.get('/regions', referenceController.getRegions);
router.get('/oked-codes', referenceController.getOkedCodes);
router.get('/oked-hierarchy', referenceController.getOkedHierarchy);
router.get('/stats', referenceController.getProgramStats);

export default router;
