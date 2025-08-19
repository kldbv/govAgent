
interface BusinessGoalsStepProps {
  register: any
  errors: any
  setValue: any
  watchedValues: any
  onPrev: () => void
  isSubmitting: boolean
}

const businessGoalOptions = [
  { id: 'growth', label: 'Рост и расширение бизнеса', icon: '📈' },
  { id: 'technology', label: 'Внедрение новых технологий', icon: '💻' },
  { id: 'export', label: 'Выход на международные рынки', icon: '🌍' },
  { id: 'innovation', label: 'Инновации и R&D', icon: '🔬' },
  { id: 'digital', label: 'Цифровая трансформация', icon: '🚀' },
  { id: 'sustainability', label: 'Экологическая устойчивость', icon: '🌱' },
  { id: 'employment', label: 'Создание рабочих мест', icon: '👥' },
  { id: 'quality', label: 'Повышение качества продукции', icon: '⭐' },
  { id: 'automation', label: 'Автоматизация процессов', icon: '🤖' },
  { id: 'partnership', label: 'Развитие партнерств', icon: '🤝' }
]

export function BusinessGoalsStep({ 
  register,
  errors, 
  setValue, 
  watchedValues, 
  onPrev, 
  isSubmitting 
}: BusinessGoalsStepProps) {
  
  const selectedGoals = watchedValues.business_goals || []
  
  const toggleGoal = (goalId: string) => {
    const currentGoals = selectedGoals || []
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter((id: string) => id !== goalId)
      : [...currentGoals, goalId]
    
    setValue('business_goals', newGoals, { shouldValidate: true })
  }
  
  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Цели развития бизнеса</h2>
        <span className="text-sm text-gray-500">Шаг 3 из 3</span>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Выберите основные цели развития вашего бизнеса. Это поможет подобрать наиболее подходящие программы поддержки.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessGoalOptions.map(goal => (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedGoals.includes(goal.id)
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
                  : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <span className="font-medium text-gray-900">{goal.label}</span>
              </div>
            </div>
          ))}
        </div>
        
        {errors.business_goals && (
          <p className="mt-2 text-sm text-red-600">{errors.business_goals.message as string}</p>
        )}
        
        <p className="mt-4 text-xs text-gray-500">
          Выбрано целей: {selectedGoals.length} из {businessGoalOptions.length}
        </p>
      </div>
      
      {/* Additional Goals Text Area */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дополнительные цели и комментарии
        </label>
        <textarea
          {...register('business_goals_comments')}
          rows={4}
          className="input-field"
          placeholder="Опишите любые дополнительные цели или особенности вашего бизнеса, которые важно учесть при подборе программ поддержки..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Необязательное поле. Помогает получить более точные рекомендации.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary"
        >
          Назад
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2"
        >
          {isSubmitting && <div className="loading-spinner w-4 h-4" />}
          {isSubmitting ? 'Сохранение...' : 'Сохранить профиль'}
        </button>
      </div>
    </div>
  )
}
