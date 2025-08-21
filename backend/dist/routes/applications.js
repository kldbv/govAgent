"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApplicationController_1 = require("../controllers/ApplicationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const applicationController = new ApplicationController_1.ApplicationController();
router.use(auth_1.authenticate);
router.post('/', applicationController.submitApplication);
router.get('/', applicationController.getUserApplications);
router.get('/:id', applicationController.getApplicationById);
exports.default = router;
//# sourceMappingURL=applications.js.map