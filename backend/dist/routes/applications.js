"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApplicationController_1 = require("../controllers/ApplicationController");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const applicationController = new ApplicationController_1.ApplicationController();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
router.use(auth_1.authenticate);
router.get('/', applicationController.getApplications);
router.get('/stats', applicationController.getApplicationStats);
router.get('/:applicationId', applicationController.getApplication);
router.get('/program/:programId/form', applicationController.getApplicationForm);
router.get('/program/:programId/application', applicationController.getApplicationByProgram);
router.post('/program/:programId/draft', applicationController.saveApplicationDraft);
router.post('/:applicationId/submit', applicationController.submitApplication);
router.post('/program/:programId/submit', applicationController.submitApplicationForProgram);
router.post('/program/:programId/files', upload.array('files'), applicationController.uploadFilesToDraft);
router.get('/:applicationId/files', applicationController.listFiles);
router.delete('/:applicationId/files/:fileId', applicationController.deleteFile);
exports.default = router;
//# sourceMappingURL=applications.js.map