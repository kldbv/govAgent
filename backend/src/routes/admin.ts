import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireAdminOrManager } from '../middleware/roleAuth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication
router.use(authenticate);

// Dashboard stats - accessible by admin and manager
router.get('/dashboard/stats', requireAdminOrManager(), adminController.getDashboardStats);

// User management - admin only
router.get('/users', requireAdmin(), adminController.getAllUsers);
router.put('/users/:userId/role', requireAdmin(), adminController.updateUserRole);

// Program management - admin only for creation/deletion, admin+manager for viewing/editing
router.get('/programs', requireAdminOrManager(), adminController.getAllPrograms);
router.post('/programs', requireAdmin(), adminController.createProgram);
router.put('/programs/:programId', requireAdmin(), adminController.updateProgram);
router.patch('/programs/:programId/toggle', requireAdmin(), adminController.toggleProgramStatus);
router.patch('/programs/:programId/status', requireAdmin(), adminController.updateProgramStatus);
router.delete('/programs/:programId', requireAdmin(), adminController.deleteProgram);

// Application management - admin and manager can view/update
router.get('/applications', requireAdminOrManager(), adminController.getAllApplications);
router.get('/applications/:applicationId', requireAdminOrManager(), adminController.getApplicationDetails);
router.put('/applications/:applicationId/status', requireAdminOrManager(), adminController.updateApplicationStatus);

export default router;
