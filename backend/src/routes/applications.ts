import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const applicationController = new ApplicationController();

// Multer in-memory storage for uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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
router.post('/program/:programId/submit', applicationController.submitApplicationForProgram);

// File upload/list/delete for application drafts
router.post('/program/:programId/files', upload.array('files'), applicationController.uploadFilesToDraft);
router.get('/:applicationId/files', applicationController.listFiles);
router.delete('/:applicationId/files/:fileId', applicationController.deleteFile);

export default router;
