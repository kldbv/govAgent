"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MethodologyController_1 = require("../controllers/MethodologyController");
const router = (0, express_1.Router)();
const methodologyController = new MethodologyController_1.MethodologyController();
router.get('/:slug', methodologyController.getBySlug);
exports.default = router;
//# sourceMappingURL=methodology.js.map