import { useState, useEffect } from 'react'

interface LoanAmountSliderProps {
  value?: number
  onChange: (value: number) => void
  error?: string
  required?: boolean
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

export function LoanAmountSlider({ value = 0, onChange, error, required = false }: LoanAmountSliderProps) {
  const [displayValue, setDisplayValue] = useState(value)
  
  // Loan amount ranges (in KZT)
  const minAmount = 100_000 // Minimum 100K KZT for loans
  const maxAmount = 100_000_000 // 100M KZT
  const step = 100_000 // 100K KZT
  
  useEffect(() => {
    setDisplayValue(value)
  }, [value])
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setDisplayValue(newValue)
    onChange(newValue)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const numericValue = e.target.value.replace(/\D/g, '')
      const newValue = parseInt(numericValue) || minAmount
      const clampedValue = Math.max(minAmount, Math.min(maxAmount, newValue))
      
      // Format the display value
      if (numericValue) {
        const formatted = new Intl.NumberFormat('ru-RU').format(clampedValue)
        e.target.value = formatted
      }
      
      setDisplayValue(clampedValue)
      onChange(clampedValue)
    } catch (error) {
      console.warn('Error in loan amount input change:', error)
      // Fallback to minimum amount
      setDisplayValue(minAmount)
      onChange(minAmount)
    }
  }
  
  // Calculate percentage for slider styling
  const percentage = ((displayValue - minAmount) / (maxAmount - minAmount)) * 100
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Желаемая сумма займа (тенге) {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Amount input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={displayValue > 0 ? formatAmount(displayValue) : ''}
            onChange={handleInputChange}
            placeholder="Введите сумму"
            className={`input-field pr-12 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
            ₸
          </div>
        </div>
      </div>
      
      {/* Slider */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="range"
            min={minAmount}
            max={maxAmount}
            step={step}
            value={displayValue}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100 тыс ₸</span>
            <span>100 млн ₸</span>
          </div>
        </div>
      </div>
      
      {/* Quick amount buttons */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[1_000_000, 5_000_000, 10_000_000].map(amount => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              setDisplayValue(amount)
              onChange(amount)
            }}
            className={`px-3 py-2 text-xs border rounded-md transition-colors ${
              displayValue === amount
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {amount >= 1_000_000 ? `${amount / 1_000_000} млн` : formatAmount(amount)} ₸
          </button>
        ))}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      <p className="mt-1 text-xs text-gray-500">
        Укажите желаемую сумму для получения подходящих программ финансирования
      </p>
    </div>
  )
}
