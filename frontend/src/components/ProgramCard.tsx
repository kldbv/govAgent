import { Link } from 'react-router-dom'
import { BusinessProgram } from '@/types/program'

interface ProgramCardProps {
  program: BusinessProgram
  showMatchScore?: boolean
  className?: string
}

export function ProgramCard({ program, showMatchScore = false, className = '' }: ProgramCardProps) {
  const formatAmount = (amount?: number) => {
    if (!amount) return 'Не указано'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount)
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указан'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }
  
  const getTypeColor = (type: string) => {
    const colors = {
      'Грант': 'bg-green-100 text-green-800',
      'Субсидия': 'bg-blue-100 text-blue-800',
      'Льготное кредитование': 'bg-purple-100 text-purple-800',
      'Консультации': 'bg-yellow-100 text-yellow-800',
      'Обучение': 'bg-indigo-100 text-indigo-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div className={`card card-hover p-6 h-full flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${getTypeColor(program.program_type)}`}>
              {program.program_type}
            </span>
            {showMatchScore && program.score && (
              <span className="badge bg-blue-100 text-blue-800">
                Соответствие: {Math.round(program.score)}%
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words">
            {program.title}
          </h3>
        </div>
        
        {program.funding_amount && (
          <div className="shrink-0 text-right">
            <div className="text-xl sm:text-2xl font-bold text-green-600 leading-snug max-w-[9rem] truncate">
              {formatAmount(program.funding_amount)}
            </div>
          </div>
        )}
      </div>
      
      {/* Organization */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm text-gray-600">{program.organization}</span>
      </div>
      
      {/* Description */}
      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1 break-words">
        {program.description}
      </p>
      
      {/* Match Reasons */}
      {showMatchScore && program.matchReasons && program.matchReasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Почему подходит:</h4>
          <div className="space-y-1">
            {program.matchReasons.slice(0, 3).map((reason, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Target Audience */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm text-gray-600">
            Целевая аудитория: {program.target_audience}
          </span>
        </div>
      </div>
      
      {/* Loan Range */}
      {(program.min_loan_amount || program.max_loan_amount) && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-sm text-gray-600">
              Диапазон займа: {formatAmount(program.min_loan_amount)} - {formatAmount(program.max_loan_amount)}
            </span>
          </div>
        </div>
      )}
      
      {/* Deadline */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-600">
            До: {formatDate(program.application_deadline)}
          </span>
        </div>
        
        {/* Deadline urgency indicator */}
        {program.application_deadline && (
          <div className="text-right">
            {(() => {
              const deadline = new Date(program.application_deadline)
              const now = new Date()
              const diffTime = deadline.getTime() - now.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              
              if (diffDays <= 7) {
                return <span className="badge bg-red-100 text-red-800">Срочно</span>
              } else if (diffDays <= 30) {
                return <span className="badge bg-yellow-100 text-yellow-800">Скоро</span>
              }
              return null
            })()}
          </div>
        )}
      </div>
      
      {/* Regions */}
      {program.eligible_regions && program.eligible_regions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-600">Регионы:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {program.eligible_regions.slice(0, 3).map((region, index) => (
              <span key={index} className="badge bg-gray-100 text-gray-700 text-xs">
                {region}
              </span>
            ))}
            {program.eligible_regions.length > 3 && (
              <span className="badge bg-gray-100 text-gray-700 text-xs">
                +{program.eligible_regions.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-3 mt-auto">
        <Link
          to={`/programs/${program.id}`}
          className="btn-primary flex-1 text-center"
        >
          Подробнее
        </Link>
        <button className="btn-secondary px-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
