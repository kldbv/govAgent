import { Router } from 'express';
import { calculatorController } from '../controllers/CalculatorController';

const router = Router();

// Базовый расчет субсидий (публичный)
router.post('/calculate', (req, res, next) => calculatorController.calculate(req, res, next));

// Расчет с данными программы
router.post('/program/:programId', (req, res, next) => calculatorController.calculateWithProgram(req, res, next));

// Получение данных программы для калькулятора
router.get('/program/:programId/data', (req, res, next) => calculatorController.getProgramCalculatorData(req, res, next));

// Генерация графика платежей
router.post('/schedule', (req, res, next) => calculatorController.generateSchedule(req, res, next));

export default router;
