"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApplicationController_1 = require("../controllers/ApplicationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const applicationController = new ApplicationController_1.ApplicationController();
router.use(auth_1.authenticate);
router.get('/', applicationController.getApplications);
router.get('/stats', applicationController.getApplicationStats);
router.get('/:applicationId', applicationController.getApplication);
router.get('/program/:programId/form', applicationController.getApplicationForm);
router.get('/program/:programId/application', applicationController.getApplicationByProgram);
router.post('/program/:programId/draft', applicationController.saveApplicationDraft);
router.post('/:applicationId/submit', applicationController.submitApplication);
exports.default = router;
//# sourceMappingURL=applications.js.map