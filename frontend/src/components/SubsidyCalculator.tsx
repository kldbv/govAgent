import { useState, useEffect, useMemo } from 'react'
import {
  getProgramCalculatorData,
  CalculatorResult,
} from '@/services/api'

interface SubsidyCalculatorProps {
  programId?: number
  defaultBankRate?: number
  defaultSubsidyRate?: number
  minLoanAmount?: number
  maxLoanAmount?: number
  maxLoanTermMonths?: number
  onCalculate?: (result: CalculatorResult) => void
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    const millions = amount / 1000000
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} млн`
  }
  if (amount >= 1000) {
    const thousands = amount / 1000
    return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)} тыс`
  }
  return amount.toFixed(0)
}

const formatFullCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ₸'
}

export function SubsidyCalculator({
  programId,
  defaultBankRate = 20.5,
  defaultSubsidyRate = 8.2,
  minLoanAmount = 1000000,
  maxLoanAmount = 500000000,
  maxLoanTermMonths = 120,
  onCalculate,
}: SubsidyCalculatorProps) {
  // Form state
  const [loanAmount, setLoanAmount] = useState<number>(50000000)
  const [loanTermMonths, setLoanTermMonths] = useState<number>(60)
  const [bankRate, setBankRate] = useState<number>(defaultBankRate)
  const [subsidyRate, setSubsidyRate] = useState<number>(defaultSubsidyRate)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Load program data if programId is provided
  useEffect(() => {
    if (programId) {
      getProgramCalculatorData(programId)
        .then((data) => {
          if (data.bankRate !== null) setBankRate(data.bankRate)
          if (data.subsidyRate !== null) setSubsidyRate(data.subsidyRate)
        })
        .catch((err) => {
          console.error('Failed to load program calculator data:', err)
        })
    }
  }, [programId])

  // Real-time calculation
  const calculatedResult = useMemo(() => {
    if (loanAmount <= 0 || loanTermMonths <= 0 || bankRate < 0 || subsidyRate < 0) {
      return null
    }

    try {
      // Client-side calculation for instant feedback
      const monthlyRateBefore = bankRate / 12 / 100
      const effectiveRate = bankRate - subsidyRate
      const monthlyRateAfter = effectiveRate / 12 / 100

      const calculatePayment = (principal: number, monthlyRate: number, term: number) => {
        if (monthlyRate === 0) return principal / term
        const compoundFactor = Math.pow(1 + monthlyRate, term)
        return principal * (monthlyRate * compoundFactor) / (compoundFactor - 1)
      }

      const monthlyPaymentBefore = calculatePayment(loanAmount, monthlyRateBefore, loanTermMonths)
      const monthlyPaymentAfter = calculatePayment(loanAmount, monthlyRateAfter, loanTermMonths)
      const monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter
      const totalSavings = monthlySavings * loanTermMonths

      return {
        input: { loanAmount, loanTermMonths, bankRate, subsidyRate },
        effectiveRate,
        monthlyPaymentBefore,
        monthlyPaymentAfter,
        monthlySavings,
        totalSavings,
        totalPaymentBefore: monthlyPaymentBefore * loanTermMonths,
        totalPaymentAfter: monthlyPaymentAfter * loanTermMonths,
        totalInterestBefore: monthlyPaymentBefore * loanTermMonths - loanAmount,
        totalInterestAfter: monthlyPaymentAfter * loanTermMonths - loanAmount,
      } as CalculatorResult
    } catch {
      return null
    }
  }, [loanAmount, loanTermMonths, bankRate, subsidyRate])

  // Update result when calculation changes
  useEffect(() => {
    if (calculatedResult) {
      setResult(calculatedResult)
      setError(null)
      onCalculate?.(calculatedResult)
    }
  }, [calculatedResult, onCalculate])

  // Term presets
  const termPresets = [12, 24, 36, 48, 60, 84, 120]

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Калькулятор субсидий
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          Рассчитайте экономию при использовании государственной субсидии
        </p>
      </div>

      {/* Calculator Form */}
      <div className="p-6 space-y-6">
        {/* Loan Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сумма кредита
          </label>
          <div className="relative">
            <input
              type="text"
              value={formatFullCurrency(loanAmount).replace(' ₸', '')}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                const num = parseInt(value) || 0
                setLoanAmount(Math.min(Math.max(num, 0), maxLoanAmount))
              }}
              className="input-field text-lg font-semibold pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₸</span>
          </div>
          <input
            type="range"
            min={minLoanAmount}
            max={maxLoanAmount}
            step={1000000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(minLoanAmount)} ₸</span>
            <span>{formatCurrency(maxLoanAmount)} ₸</span>
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Срок кредита: <span className="text-blue-600 font-bold">{loanTermMonths} мес.</span>
            <span className="text-gray-400 ml-1">({(loanTermMonths / 12).toFixed(1)} лет)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {termPresets.filter(t => t <= maxLoanTermMonths).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setLoanTermMonths(term)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  loanTermMonths === term
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {term} мес.
              </button>
            ))}
          </div>
          <input
            type="range"
            min={1}
            max={maxLoanTermMonths}
            value={loanTermMonths}
            onChange={(e) => setLoanTermMonths(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Interest Rates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ставка банка (годовая)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={bankRate}
                onChange={(e) => setBankRate(Number(e.target.value))}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ставка субсидии (п.п.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max={bankRate}
                value={subsidyRate}
                onChange={(e) => setSubsidyRate(Math.min(Number(e.target.value), bankRate))}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Effective Rate Display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Эффективная ставка после субсидии:</span>
            <span className="text-2xl font-bold text-blue-600">
              {(bankRate - subsidyRate).toFixed(2)}%
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="border-t border-gray-200">
          {/* Main Results */}
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Платеж ДО субсидии</div>
              <div className="text-xl font-bold text-gray-400 line-through">
                {formatFullCurrency(result.monthlyPaymentBefore)}
              </div>
              <div className="text-xs text-gray-400 mt-1">в месяц</div>
            </div>
            <div className="p-6 text-center bg-green-50">
              <div className="text-sm text-gray-500 mb-1">Платеж ПОСЛЕ субсидии</div>
              <div className="text-2xl font-bold text-green-600">
                {formatFullCurrency(result.monthlyPaymentAfter)}
              </div>
              <div className="text-xs text-gray-500 mt-1">в месяц</div>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-white">
              <div className="text-center">
                <div className="text-sm opacity-90">Экономия в месяц</div>
                <div className="text-2xl font-bold">
                  {formatFullCurrency(result.monthlySavings)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90">Экономия за весь срок</div>
                <div className="text-2xl font-bold">
                  {formatFullCurrency(result.totalSavings)}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats Toggle */}
          <div className="px-6 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvanced ? 'Скрыть детали' : 'Показать детали расчета'}
            </button>
          </div>

          {/* Advanced Details */}
          {showAdvanced && (
            <div className="px-6 pb-6 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Общая сумма выплат (без субсидии)</div>
                  <div className="font-semibold text-gray-700">
                    {formatFullCurrency(result.totalPaymentBefore)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Общая сумма выплат (с субсидией)</div>
                  <div className="font-semibold text-green-600">
                    {formatFullCurrency(result.totalPaymentAfter)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Переплата по процентам (без субсидии)</div>
                  <div className="font-semibold text-gray-700">
                    {formatFullCurrency(result.totalInterestBefore)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Переплата по процентам (с субсидией)</div>
                  <div className="font-semibold text-green-600">
                    {formatFullCurrency(result.totalInterestAfter)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-6 pb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              <strong>Важно:</strong> Это упрощенная модель расчета. Страхование, комиссии и налоги не учтены.
              Фактические условия могут отличаться. Обратитесь в банк-партнер для точного расчета.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubsidyCalculator
