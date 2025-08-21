"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProgramController_1 = require("../controllers/ProgramController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const programController = new ProgramController_1.ProgramController();
router.get('/', programController.getPrograms);
router.get('/recommendations', auth_1.authenticate, programController.getRecommendations);
router.get('/:id', programController.getProgramById);
exports.default = router;
//# sourceMappingURL=programs.js.map