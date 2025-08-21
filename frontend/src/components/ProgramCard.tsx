import { Link } from 'react-router-dom'
import { BusinessProgram } from '@/types/program'
import { Building2, Users, Calendar, MapPin, DollarSign, Clock, Heart, ArrowRight } from 'lucide-react'

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
      'Грант': 'bg-green-500 text-white',
      'Субсидия': 'bg-blue-500 text-white',
      'Льготное кредитование': 'bg-purple-500 text-white',
      'Консультации': 'bg-orange-500 text-white',
      'Обучение': 'bg-indigo-500 text-white',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500 text-white'
  }
  
  const getSubmissionStatus = () => {
    const now = new Date().getTime()
    const opens = program.opens_at ? new Date(program.opens_at).getTime() : null
    const closesBase = program.closes_at || program.application_deadline
    const closes = closesBase ? new Date(closesBase).getTime() : null

    if (opens && now < opens) return { label: 'Скоро открытие', color: 'bg-yellow-500 text-white', icon: Clock }
    if (closes && now > closes) return { label: 'Закрыт', color: 'bg-red-500 text-white', icon: Clock }
    return { label: 'Открыт', color: 'bg-green-500 text-white', icon: Clock }
  }

  const formatAmountShort = (amount?: number) => {
    if (!amount) return 'Не указано'
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} млн KZT`
    }
    return formatAmount(amount)
  }

  const urgencyStatus = (() => {
    if (!program.application_deadline) return null
    const deadline = new Date(program.application_deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) return { label: 'Скоро истекает', color: 'bg-red-500', textColor: 'text-red-600' }
    if (diffDays <= 30) return { label: `Осталось ${diffDays} дней`, color: 'bg-yellow-500', textColor: 'text-yellow-600' }
    return null
  })()

  return (
    <div className={`group relative bg-white rounded-2xl border border-gray-200 hover:border-primary-300 shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden h-full flex flex-col ${className}`}>
      {/* Status Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
      
      {/* Header with full-width title */}
      <div className="p-6 pb-4 flex-1 flex flex-col">
        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(program.program_type)}`}>
            <span className="w-2 h-2 bg-current rounded-full"></span>
            {program.program_type}
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getSubmissionStatus().color}`}>
            <Clock size={12} />
            {getSubmissionStatus().label}
          </span>
          {urgencyStatus && (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${urgencyStatus.color}`}>
              {urgencyStatus.label}
            </span>
          )}
          {showMatchScore && program.score && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              {Math.round(program.score)}% соответствие
            </span>
          )}
        </div>
        
        {/* Title - Full Width */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary-600 transition-colors">
          {program.title}
        </h3>
        
        {/* Amount */}
        {program.funding_amount && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
              <DollarSign size={16} className="text-green-600" />
              <span className="text-xl font-bold text-green-600">
                {formatAmountShort(program.funding_amount)}
              </span>
            </div>
          </div>
        )}
        
        {/* Organization */}
        <div className="flex items-center gap-2 mb-4 text-gray-600">
          <Building2 size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium">{program.organization}</span>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {program.description}
        </p>
        
        {/* Match Reasons */}
        {showMatchScore && program.matchReasons && program.matchReasons.length > 0 && (
          <div className="mb-4 bg-green-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Почему подходит:</h4>
            <div className="space-y-1">
              {program.matchReasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-xs text-green-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Key Info Grid */}
        <div className="space-y-3 mb-6">
          {/* Target Audience */}
          <div className="flex items-start gap-2">
            <Users size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Целевая аудитория</span>
              <span className="text-sm text-gray-700 font-medium">{program.target_audience}</span>
            </div>
          </div>
          
          {/* Deadline */}
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Срок подачи</span>
              <span className={`text-sm font-medium ${
                urgencyStatus ? urgencyStatus.textColor : 'text-gray-700'
              }`}>
                {formatDate(program.application_deadline)}
              </span>
            </div>
          </div>
          
          {/* Regions */}
          {program.eligible_regions && program.eligible_regions.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 block mb-1">Регионы</span>
                <div className="flex flex-wrap gap-1">
                  {program.eligible_regions.slice(0, 2).map((region, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {region}
                    </span>
                  ))}
                  {program.eligible_regions.length > 2 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{program.eligible_regions.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Loan Range */}
          {(program.min_loan_amount || program.max_loan_amount) && (
            <div className="flex items-start gap-2">
              <DollarSign size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-500 block">Диапазон займа</span>
                <span className="text-sm text-gray-700 font-medium">
                  {formatAmountShort(program.min_loan_amount)} - {formatAmountShort(program.max_loan_amount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions Footer */}
      <div className="p-6 pt-0 mt-auto">
        <div className="flex gap-3">
          <Link
            to={`/programs/${program.id}`}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
          >
            <span>Подробнее</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
          <button className="p-3 border border-gray-300 hover:border-primary-300 hover:bg-primary-50 rounded-lg transition-colors duration-200 group/heart">
            <Heart size={16} className="text-gray-400 group-hover/heart:text-primary-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
