"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subsidyCalculatorService = void 0;
class SubsidyCalculatorService {
    calculateAnnuityPayment(principal, annualRate, termMonths) {
        if (annualRate === 0) {
            return principal / termMonths;
        }
        const monthlyRate = annualRate / 12 / 100;
        const compoundFactor = Math.pow(1 + monthlyRate, termMonths);
        const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
        return payment;
    }
    calculate(input) {
        const { loanAmount, loanTermMonths, bankRate, subsidyRate } = input;
        if (loanAmount <= 0) {
            throw new Error('Сумма кредита должна быть положительной');
        }
        if (loanTermMonths <= 0 || loanTermMonths > 360) {
            throw new Error('Срок кредита должен быть от 1 до 360 месяцев');
        }
        if (bankRate < 0 || bankRate > 100) {
            throw new Error('Ставка банка должна быть от 0 до 100%');
        }
        if (subsidyRate < 0) {
            throw new Error('Ставка субсидии не может быть отрицательной');
        }
        if (subsidyRate > bankRate) {
            throw new Error('Ставка субсидии не может превышать ставку банка');
        }
        const effectiveRate = bankRate - subsidyRate;
        const monthlyPaymentBefore = this.calculateAnnuityPayment(loanAmount, bankRate, loanTermMonths);
        const monthlyPaymentAfter = this.calculateAnnuityPayment(loanAmount, effectiveRate, loanTermMonths);
        const monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter;
        const totalSavings = monthlySavings * loanTermMonths;
        const totalPaymentBefore = monthlyPaymentBefore * loanTermMonths;
        const totalPaymentAfter = monthlyPaymentAfter * loanTermMonths;
        const totalInterestBefore = totalPaymentBefore - loanAmount;
        const totalInterestAfter = totalPaymentAfter - loanAmount;
        return {
            input,
            effectiveRate: this.roundToTwoDecimals(effectiveRate),
            monthlyPaymentBefore: this.roundToTwoDecimals(monthlyPaymentBefore),
            monthlyPaymentAfter: this.roundToTwoDecimals(monthlyPaymentAfter),
            monthlySavings: this.roundToTwoDecimals(monthlySavings),
            totalSavings: this.roundToTwoDecimals(totalSavings),
            totalPaymentBefore: this.roundToTwoDecimals(totalPaymentBefore),
            totalPaymentAfter: this.roundToTwoDecimals(totalPaymentAfter),
            totalInterestBefore: this.roundToTwoDecimals(totalInterestBefore),
            totalInterestAfter: this.roundToTwoDecimals(totalInterestAfter),
        };
    }
    calculateWithProgramData(programData, loanAmount, loanTermMonths, customBankRate, customSubsidyRate) {
        const bankRate = customBankRate ?? programData.bankRate;
        const subsidyRate = customSubsidyRate ?? programData.subsidyRate;
        if (bankRate === null || subsidyRate === null) {
            throw new Error('Для данной программы не указаны ставки кредитования');
        }
        if (programData.minLoanAmount && loanAmount < programData.minLoanAmount) {
            throw new Error(`Минимальная сумма кредита: ${this.formatCurrency(programData.minLoanAmount)}`);
        }
        if (programData.maxLoanAmount && loanAmount > programData.maxLoanAmount) {
            throw new Error(`Максимальная сумма кредита: ${this.formatCurrency(programData.maxLoanAmount)}`);
        }
        if (programData.maxLoanTermMonths && loanTermMonths > programData.maxLoanTermMonths) {
            throw new Error(`Максимальный срок кредита: ${programData.maxLoanTermMonths} месяцев`);
        }
        return this.calculate({
            loanAmount,
            loanTermMonths,
            bankRate,
            subsidyRate,
        });
    }
    generateAmortizationSchedule(input) {
        const { loanAmount, loanTermMonths, bankRate, subsidyRate } = input;
        const effectiveRate = bankRate - subsidyRate;
        const monthlyPaymentBefore = this.calculateAnnuityPayment(loanAmount, bankRate, loanTermMonths);
        const monthlyPaymentAfter = this.calculateAnnuityPayment(loanAmount, effectiveRate, loanTermMonths);
        const monthlyRateBefore = bankRate / 12 / 100;
        const monthlyRateAfter = effectiveRate / 12 / 100;
        let balanceBefore = loanAmount;
        let balanceAfter = loanAmount;
        const schedule = [];
        for (let month = 1; month <= loanTermMonths; month++) {
            const interestBefore = balanceBefore * monthlyRateBefore;
            const interestAfter = balanceAfter * monthlyRateAfter;
            const principalBefore = monthlyPaymentBefore - interestBefore;
            const principalAfter = monthlyPaymentAfter - interestAfter;
            balanceBefore = Math.max(0, balanceBefore - principalBefore);
            balanceAfter = Math.max(0, balanceAfter - principalAfter);
            schedule.push({
                month,
                paymentBefore: this.roundToTwoDecimals(monthlyPaymentBefore),
                paymentAfter: this.roundToTwoDecimals(monthlyPaymentAfter),
                principalBefore: this.roundToTwoDecimals(principalBefore),
                principalAfter: this.roundToTwoDecimals(principalAfter),
                interestBefore: this.roundToTwoDecimals(interestBefore),
                interestAfter: this.roundToTwoDecimals(interestAfter),
                balanceBefore: this.roundToTwoDecimals(balanceBefore),
                balanceAfter: this.roundToTwoDecimals(balanceAfter),
            });
        }
        return schedule;
    }
    roundToTwoDecimals(num) {
        return Math.round(num * 100) / 100;
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount) + ' ₸';
    }
    formatPercentage(rate) {
        return rate.toFixed(2) + '%';
    }
}
exports.subsidyCalculatorService = new SubsidyCalculatorService();
exports.default = SubsidyCalculatorService;
//# sourceMappingURL=SubsidyCalculatorService.js.map