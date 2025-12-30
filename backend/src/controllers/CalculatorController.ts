import { Request, Response, NextFunction } from 'express';
import pool from '../utils/database';
import {
  subsidyCalculatorService,
  SubsidyCalculatorInput,
  ProgramCalculatorData,
} from '../services/SubsidyCalculatorService';

export class CalculatorController {
  /**
   * Базовый расчет субсидий (без привязки к программе)
   * POST /api/calculator/calculate
   */
  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanAmount, loanTermMonths, bankRate, subsidyRate } = req.body;

      // Валидация
      if (!loanAmount || !loanTermMonths || bankRate === undefined || subsidyRate === undefined) {
        return res.status(400).json({
          error: 'Необходимо указать все параметры: loanAmount, loanTermMonths, bankRate, subsidyRate',
        });
      }

      const input: SubsidyCalculatorInput = {
        loanAmount: Number(loanAmount),
        loanTermMonths: Number(loanTermMonths),
        bankRate: Number(bankRate),
        subsidyRate: Number(subsidyRate),
      };

      const result = subsidyCalculatorService.calculate(input);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Расчет субсидий с данными программы
   * POST /api/calculator/program/:programId
   */
  async calculateWithProgram(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId } = req.params;
      const { loanAmount, loanTermMonths, customBankRate, customSubsidyRate } = req.body;

      // Валидация
      if (!loanAmount || !loanTermMonths) {
        return res.status(400).json({
          error: 'Необходимо указать loanAmount и loanTermMonths',
        });
      }

      // Получаем данные программы
      const programResult = await pool.query(
        `SELECT
          id as "programId",
          title as "programTitle",
          bank_rate as "bankRate",
          subsidy_rate as "subsidyRate",
          max_loan_term_months as "maxLoanTermMonths",
          min_loan_amount as "minLoanAmount",
          max_loan_amount as "maxLoanAmount",
          calculator_enabled as "calculatorEnabled"
        FROM business_programs
        WHERE id = $1`,
        [programId]
      );

      if (programResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Программа не найдена',
        });
      }

      const programData: ProgramCalculatorData = {
        ...programResult.rows[0],
        bankRate: programResult.rows[0].bankRate ? parseFloat(programResult.rows[0].bankRate) : null,
        subsidyRate: programResult.rows[0].subsidyRate ? parseFloat(programResult.rows[0].subsidyRate) : null,
        maxLoanTermMonths: programResult.rows[0].maxLoanTermMonths ? parseInt(programResult.rows[0].maxLoanTermMonths) : null,
        minLoanAmount: programResult.rows[0].minLoanAmount ? parseFloat(programResult.rows[0].minLoanAmount) : null,
        maxLoanAmount: programResult.rows[0].maxLoanAmount ? parseFloat(programResult.rows[0].maxLoanAmount) : null,
      };

      if (!programData.calculatorEnabled) {
        return res.status(400).json({
          error: 'Калькулятор не доступен для данной программы',
        });
      }

      const result = subsidyCalculatorService.calculateWithProgramData(
        programData,
        Number(loanAmount),
        Number(loanTermMonths),
        customBankRate ? Number(customBankRate) : undefined,
        customSubsidyRate ? Number(customSubsidyRate) : undefined
      );

      res.json({
        success: true,
        data: {
          program: {
            id: programData.programId,
            title: programData.programTitle,
            defaultBankRate: programData.bankRate,
            defaultSubsidyRate: programData.subsidyRate,
            maxLoanTermMonths: programData.maxLoanTermMonths,
            minLoanAmount: programData.minLoanAmount,
            maxLoanAmount: programData.maxLoanAmount,
          },
          calculation: result,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Получение данных программы для калькулятора
   * GET /api/calculator/program/:programId/data
   */
  async getProgramCalculatorData(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId } = req.params;

      const result = await pool.query(
        `SELECT
          id,
          title,
          bank_rate as "bankRate",
          subsidy_rate as "subsidyRate",
          max_loan_term_months as "maxLoanTermMonths",
          min_loan_amount as "minLoanAmount",
          max_loan_amount as "maxLoanAmount",
          calculator_enabled as "calculatorEnabled"
        FROM business_programs
        WHERE id = $1`,
        [programId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Программа не найдена',
        });
      }

      const program = result.rows[0];

      res.json({
        success: true,
        data: {
          programId: program.id,
          programTitle: program.title,
          bankRate: program.bankRate ? parseFloat(program.bankRate) : null,
          subsidyRate: program.subsidyRate ? parseFloat(program.subsidyRate) : null,
          maxLoanTermMonths: program.maxLoanTermMonths ? parseInt(program.maxLoanTermMonths) : null,
          minLoanAmount: program.minLoanAmount ? parseFloat(program.minLoanAmount) : null,
          maxLoanAmount: program.maxLoanAmount ? parseFloat(program.maxLoanAmount) : null,
          calculatorEnabled: program.calculatorEnabled || false,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Генерация графика платежей
   * POST /api/calculator/schedule
   */
  async generateSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanAmount, loanTermMonths, bankRate, subsidyRate } = req.body;

      if (!loanAmount || !loanTermMonths || bankRate === undefined || subsidyRate === undefined) {
        return res.status(400).json({
          error: 'Необходимо указать все параметры: loanAmount, loanTermMonths, bankRate, subsidyRate',
        });
      }

      const input: SubsidyCalculatorInput = {
        loanAmount: Number(loanAmount),
        loanTermMonths: Number(loanTermMonths),
        bankRate: Number(bankRate),
        subsidyRate: Number(subsidyRate),
      };

      const schedule = subsidyCalculatorService.generateAmortizationSchedule(input);

      res.json({
        success: true,
        data: {
          schedule,
          summary: subsidyCalculatorService.calculate(input),
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const calculatorController = new CalculatorController();
