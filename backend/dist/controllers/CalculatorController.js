"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorController = exports.CalculatorController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const SubsidyCalculatorService_1 = require("../services/SubsidyCalculatorService");
class CalculatorController {
    async calculate(req, res, next) {
        try {
            const { loanAmount, loanTermMonths, bankRate, subsidyRate } = req.body;
            if (!loanAmount || !loanTermMonths || bankRate === undefined || subsidyRate === undefined) {
                return res.status(400).json({
                    error: 'Необходимо указать все параметры: loanAmount, loanTermMonths, bankRate, subsidyRate',
                });
            }
            const input = {
                loanAmount: Number(loanAmount),
                loanTermMonths: Number(loanTermMonths),
                bankRate: Number(bankRate),
                subsidyRate: Number(subsidyRate),
            };
            const result = SubsidyCalculatorService_1.subsidyCalculatorService.calculate(input);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    async calculateWithProgram(req, res, next) {
        try {
            const { programId } = req.params;
            const { loanAmount, loanTermMonths, customBankRate, customSubsidyRate } = req.body;
            if (!loanAmount || !loanTermMonths) {
                return res.status(400).json({
                    error: 'Необходимо указать loanAmount и loanTermMonths',
                });
            }
            const programResult = await database_1.default.query(`SELECT
          id as "programId",
          title as "programTitle",
          bank_rate as "bankRate",
          subsidy_rate as "subsidyRate",
          max_loan_term_months as "maxLoanTermMonths",
          min_loan_amount as "minLoanAmount",
          max_loan_amount as "maxLoanAmount",
          calculator_enabled as "calculatorEnabled"
        FROM business_programs
        WHERE id = $1`, [programId]);
            if (programResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Программа не найдена',
                });
            }
            const programData = {
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
            const result = SubsidyCalculatorService_1.subsidyCalculatorService.calculateWithProgramData(programData, Number(loanAmount), Number(loanTermMonths), customBankRate ? Number(customBankRate) : undefined, customSubsidyRate ? Number(customSubsidyRate) : undefined);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    async getProgramCalculatorData(req, res, next) {
        try {
            const { programId } = req.params;
            const result = await database_1.default.query(`SELECT
          id,
          title,
          bank_rate as "bankRate",
          subsidy_rate as "subsidyRate",
          max_loan_term_months as "maxLoanTermMonths",
          min_loan_amount as "minLoanAmount",
          max_loan_amount as "maxLoanAmount",
          calculator_enabled as "calculatorEnabled"
        FROM business_programs
        WHERE id = $1`, [programId]);
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
        }
        catch (error) {
            next(error);
        }
    }
    async generateSchedule(req, res, next) {
        try {
            const { loanAmount, loanTermMonths, bankRate, subsidyRate } = req.body;
            if (!loanAmount || !loanTermMonths || bankRate === undefined || subsidyRate === undefined) {
                return res.status(400).json({
                    error: 'Необходимо указать все параметры: loanAmount, loanTermMonths, bankRate, subsidyRate',
                });
            }
            const input = {
                loanAmount: Number(loanAmount),
                loanTermMonths: Number(loanTermMonths),
                bankRate: Number(bankRate),
                subsidyRate: Number(subsidyRate),
            };
            const schedule = SubsidyCalculatorService_1.subsidyCalculatorService.generateAmortizationSchedule(input);
            res.json({
                success: true,
                data: {
                    schedule,
                    summary: SubsidyCalculatorService_1.subsidyCalculatorService.calculate(input),
                },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
}
exports.CalculatorController = CalculatorController;
exports.calculatorController = new CalculatorController();
//# sourceMappingURL=CalculatorController.js.map