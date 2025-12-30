/**
 * Subsidy Calculator Service
 *
 * Калькулятор субсидированного кредита на основе аннуитетных платежей.
 *
 * Формула аннуитетного платежа:
 * PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 *
 * где:
 * - P = сумма кредита
 * - r = месячная процентная ставка (годовая / 12 / 100)
 * - n = количество месяцев
 */

export interface SubsidyCalculatorInput {
  loanAmount: number;        // Сумма кредита в тенге
  loanTermMonths: number;    // Срок кредита в месяцах
  bankRate: number;          // Ставка банка (годовая, %)
  subsidyRate: number;       // Ставка субсидии (п.п., вычитается из банковской)
}

export interface SubsidyCalculatorResult {
  // Входные данные
  input: SubsidyCalculatorInput;

  // Расчетные данные
  effectiveRate: number;              // Эффективная ставка после субсидии (%)
  monthlyPaymentBefore: number;       // Ежемесячный платеж ДО субсидии (тенге)
  monthlyPaymentAfter: number;        // Ежемесячный платеж ПОСЛЕ субсидии (тенге)
  monthlySavings: number;             // Экономия в месяц (тенге)
  totalSavings: number;               // Общая экономия за весь срок (тенге)
  totalPaymentBefore: number;         // Общая сумма выплат БЕЗ субсидии
  totalPaymentAfter: number;          // Общая сумма выплат С субсидией
  totalInterestBefore: number;        // Переплата по процентам БЕЗ субсидии
  totalInterestAfter: number;         // Переплата по процентам С субсидией
}

export interface ProgramCalculatorData {
  programId: number;
  programTitle: string;
  bankRate: number | null;
  subsidyRate: number | null;
  maxLoanTermMonths: number | null;
  minLoanAmount: number | null;
  maxLoanAmount: number | null;
  calculatorEnabled: boolean;
}

class SubsidyCalculatorService {
  /**
   * Рассчитывает аннуитетный платеж
   *
   * @param principal - Сумма кредита
   * @param annualRate - Годовая процентная ставка (%)
   * @param termMonths - Срок в месяцах
   * @returns Ежемесячный платеж
   */
  private calculateAnnuityPayment(
    principal: number,
    annualRate: number,
    termMonths: number
  ): number {
    // Если ставка 0, просто делим сумму на количество месяцев
    if (annualRate === 0) {
      return principal / termMonths;
    }

    // Месячная ставка
    const monthlyRate = annualRate / 12 / 100;

    // Коэффициент (1 + r)^n
    const compoundFactor = Math.pow(1 + monthlyRate, termMonths);

    // Формула аннуитета: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);

    return payment;
  }

  /**
   * Основной метод расчета субсидий
   */
  calculate(input: SubsidyCalculatorInput): SubsidyCalculatorResult {
    const { loanAmount, loanTermMonths, bankRate, subsidyRate } = input;

    // Валидация входных данных
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

    // Эффективная ставка после субсидии
    const effectiveRate = bankRate - subsidyRate;

    // Расчет платежей
    const monthlyPaymentBefore = this.calculateAnnuityPayment(
      loanAmount,
      bankRate,
      loanTermMonths
    );

    const monthlyPaymentAfter = this.calculateAnnuityPayment(
      loanAmount,
      effectiveRate,
      loanTermMonths
    );

    // Расчет экономии
    const monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter;
    const totalSavings = monthlySavings * loanTermMonths;

    // Общие суммы выплат
    const totalPaymentBefore = monthlyPaymentBefore * loanTermMonths;
    const totalPaymentAfter = monthlyPaymentAfter * loanTermMonths;

    // Переплата по процентам
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

  /**
   * Расчет с данными программы из БД
   */
  calculateWithProgramData(
    programData: ProgramCalculatorData,
    loanAmount: number,
    loanTermMonths: number,
    customBankRate?: number,
    customSubsidyRate?: number
  ): SubsidyCalculatorResult {
    // Используем ставки из программы или кастомные
    const bankRate = customBankRate ?? programData.bankRate;
    const subsidyRate = customSubsidyRate ?? programData.subsidyRate;

    if (bankRate === null || subsidyRate === null) {
      throw new Error('Для данной программы не указаны ставки кредитования');
    }

    // Проверка лимитов суммы
    if (programData.minLoanAmount && loanAmount < programData.minLoanAmount) {
      throw new Error(`Минимальная сумма кредита: ${this.formatCurrency(programData.minLoanAmount)}`);
    }
    if (programData.maxLoanAmount && loanAmount > programData.maxLoanAmount) {
      throw new Error(`Максимальная сумма кредита: ${this.formatCurrency(programData.maxLoanAmount)}`);
    }

    // Проверка срока
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

  /**
   * Генерация графика платежей (амортизация)
   */
  generateAmortizationSchedule(input: SubsidyCalculatorInput): {
    month: number;
    paymentBefore: number;
    paymentAfter: number;
    principalBefore: number;
    principalAfter: number;
    interestBefore: number;
    interestAfter: number;
    balanceBefore: number;
    balanceAfter: number;
  }[] {
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

  /**
   * Вспомогательные методы форматирования
   */
  private roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + ' ₸';
  }

  formatPercentage(rate: number): string {
    return rate.toFixed(2) + '%';
  }
}

export const subsidyCalculatorService = new SubsidyCalculatorService();
export default SubsidyCalculatorService;
