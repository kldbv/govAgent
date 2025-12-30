"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CalculatorController_1 = require("../controllers/CalculatorController");
const router = (0, express_1.Router)();
router.post('/calculate', (req, res, next) => CalculatorController_1.calculatorController.calculate(req, res, next));
router.post('/program/:programId', (req, res, next) => CalculatorController_1.calculatorController.calculateWithProgram(req, res, next));
router.get('/program/:programId/data', (req, res, next) => CalculatorController_1.calculatorController.getProgramCalculatorData(req, res, next));
router.post('/schedule', (req, res, next) => CalculatorController_1.calculatorController.generateSchedule(req, res, next));
exports.default = router;
//# sourceMappingURL=calculator.js.map