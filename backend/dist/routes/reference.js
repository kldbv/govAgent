"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReferenceController_1 = require("../controllers/ReferenceController");
const router = (0, express_1.Router)();
const referenceController = new ReferenceController_1.ReferenceController();
router.get('/regions', referenceController.getRegions);
router.get('/oked-codes', referenceController.getOkedCodes);
router.get('/oked-hierarchy', referenceController.getOkedHierarchy);
router.get('/stats', referenceController.getProgramStats);
exports.default = router;
//# sourceMappingURL=reference.js.map