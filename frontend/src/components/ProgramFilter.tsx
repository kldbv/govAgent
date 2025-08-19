import { useState, useEffect } from 'react'
import { RegionSelect } from './RegionSelect'
import { OkedSelect } from './OkedSelect'
import { ProgramFilter as ProgramFilterType, ProgramStats } from '@/types/program'
import { getProgramStats } from '@/services/api'

interface ProgramFilterProps {
  filters: ProgramFilterType
  onFiltersChange: (filters: ProgramFilterType) => void
  onReset: () => void
  isLoading?: boolean
}

export function ProgramFilter({ filters, onFiltersChange, onReset }: ProgramFilterProps) {
  const [stats, setStats] = useState<ProgramStats | null>(null)
  const [showMore, setShowMore] = useState(false)
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getProgramStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load program stats:', error)
      }
    }
    
    loadStats()
  }, [])
  
  const updateFilter = (key: keyof ProgramFilterType, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }
  
  const organizationOptions = stats ? Object.keys(stats.by_organization) : []
  const typeOptions = stats ? Object.keys(stats.by_type) : []
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Сбросить все
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Поиск по названию
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Введите название программы..."
              className="input-field pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Program Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип программы
          </label>
          <select
            value={filters.program_type || ''}
            onChange={(e) => updateFilter('program_type', e.target.value)}
            className="input-field"
          >
            <option value="">Все типы</option>
            {typeOptions.map(type => (
              <option key={type} value={type}>
                {type} ({stats?.by_type[type]})
              </option>
            ))}
          </select>
        </div>
        
        {/* Organization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Организация
          </label>
          <select
            value={filters.organization || ''}
            onChange={(e) => updateFilter('organization', e.target.value)}
            className="input-field"
          >
            <option value="">Все организации</option>
            {organizationOptions.map(org => (
              <option key={org} value={org}>
                {org} ({stats?.by_organization[org]})
              </option>
            ))}
          </select>
        </div>
        
        {/* Region */}
        <RegionSelect
          value={filters.region}
          onChange={(value) => updateFilter('region', value)}
        />
        
        {/* Business Type & Size - Collapsible */}
        <div>
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
          >
            <span>Дополнительные фильтры</span>
            <svg 
              className={`h-4 w-4 transform transition-transform ${showMore ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showMore && (
            <div className="space-y-4 pl-4 border-l-2 border-gray-100">
              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип бизнеса
                </label>
                <select
                  value={filters.business_type || ''}
                  onChange={(e) => updateFilter('business_type', e.target.value)}
                  className="input-field"
                >
                  <option value="">Все типы бизнеса</option>
                  <option value="startup">Стартап</option>
                  <option value="sme">МСП</option>
                  <option value="individual">ИП</option>
                  <option value="ngo">НПО</option>
                </select>
              </div>
              
              {/* Business Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер бизнеса
                </label>
                <select
                  value={filters.business_size || ''}
                  onChange={(e) => updateFilter('business_size', e.target.value)}
                  className="input-field"
                >
                  <option value="">Все размеры</option>
                  <option value="micro">Микро</option>
                  <option value="small">Малый</option>
                  <option value="medium">Средний</option>
                  <option value="large">Крупный</option>
                </select>
              </div>
              
              {/* OKED Code */}
              <OkedSelect
                value={filters.oked_code}
                onChange={(value) => updateFilter('oked_code', value)}
              />
            </div>
          )}
        </div>
        
        {/* Funding Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Размер финансирования (тенге)
          </label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">От</label>
                <input
                  type="number"
                  value={filters.min_funding || ''}
                  onChange={(e) => updateFilter('min_funding', parseInt(e.target.value) || undefined)}
                  placeholder="0"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">До</label>
                <input
                  type="number"
                  value={filters.max_funding || ''}
                  onChange={(e) => updateFilter('max_funding', parseInt(e.target.value) || undefined)}
                  placeholder="∞"
                  className="input-field text-sm"
                />
              </div>
            </div>
            
            {stats && (
              <div className="text-xs text-gray-500">
                Диапазон: {new Intl.NumberFormat('ru-RU').format(stats.funding_range.min)} - {new Intl.NumberFormat('ru-RU').format(stats.funding_range.max)} ₸
                <br />
                Средний размер: {new Intl.NumberFormat('ru-RU').format(stats.funding_range.average)} ₸
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Filters Count */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Активных фильтров: {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length}
          </span>
          {stats && (
            <span className="text-gray-500">
              Всего программ: {stats.total_programs}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
