"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GuidanceController_1 = require("../controllers/GuidanceController");
const InstructionController_1 = require("../controllers/InstructionController");
const router = (0, express_1.Router)();
const guidanceController = new GuidanceController_1.GuidanceController();
const instructionController = new InstructionController_1.InstructionController();
router.get('/analytics', guidanceController.getGuidanceAnalytics);
router.get('/instruction-analytics', instructionController.getInstructionAnalytics);
exports.default = router;
//# sourceMappingURL=guidance.js.map