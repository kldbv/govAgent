import { RegionSelect } from './RegionSelect'
import { LoanAmountSlider } from './LoanAmountSlider'

interface BMPFieldsStepProps {
  register: any
  errors: any
  setValue: any
  watchedValues: any
  onNext: () => void
  onPrev: () => void
  totalSteps: number
  currentStep: number
}

export function BMPFieldsStep({ 
  register, 
  errors, 
  setValue, 
  watchedValues, 
  onNext, 
  onPrev, 
  totalSteps, 
  currentStep 
}: BMPFieldsStepProps) {
  
  const handleRegionChange = (value: string) => {
    setValue('region', value, { shouldValidate: true })
  }
  
  const handleLoanAmountChange = (value: number) => {
    setValue('desired_loan_amount', value, { shouldValidate: true })
  }
  
  // Validation for step 2
  const validateStep2 = () => {
    const step2Fields = ['bin', 'region', 'desired_loan_amount']
    return step2Fields.every(field => {
      const value = watchedValues[field as keyof typeof watchedValues]
      if (field === 'desired_loan_amount') {
        return value !== undefined && value !== null && typeof value === 'number' && value >= 100000 // Minimum 100K KZT
      }
      return value !== undefined && value !== '' && value !== null
    })
  }
  
  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Информация для БПС</h2>
        <span className="text-sm text-gray-500">Шаг {currentStep} из {totalSteps}</span>
      </div>
      
      <div className="space-y-8">
        {/* BIN Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            БИН (Бизнес-идентификационный номер) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('bin', { 
              required: 'БИН обязателен',
              pattern: {
                value: /^[0-9]{12}$/,
                message: 'БИН должен содержать 12 цифр'
              }
            })}
            type="text"
            maxLength={12}
            className={`input-field ${errors.bin ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="123456789012"
          />
          {errors.bin && <p className="mt-1 text-sm text-red-600">{errors.bin.message as string}</p>}
          <p className="mt-1 text-xs text-gray-500">
            12-значный номер, присваиваемый юридическим лицам и ИП
          </p>
        </div>
        
        {/* Region Select */}
        <RegionSelect
          value={watchedValues.region}
          onChange={handleRegionChange}
          error={errors.region?.message}
          required
        />
        
        {/* Loan Amount Slider */}
        <LoanAmountSlider
          value={watchedValues.desired_loan_amount}
          onChange={handleLoanAmountChange}
          error={errors.desired_loan_amount?.message}
          required
        />
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!validateStep2()}
          className={`btn-primary ${!validateStep2() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Далее
        </button>
      </div>
      {!validateStep2() && (
        <p className="mt-2 text-sm text-red-600 text-center">
          Заполните все обязательные поля для продолжения
        </p>
      )}
    </div>
  )
}
