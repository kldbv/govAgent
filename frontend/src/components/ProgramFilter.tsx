import { useState, useEffect } from 'react'
import { RegionSelect } from './RegionSelect'
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
        
        
        {/* Region */}
        <RegionSelect
          value={filters.region}
          onChange={(value) => updateFilter('region', value)}
        />
        
        
      {/* Open only */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.open_only}
            onChange={(e) => updateFilter('open_only', e.target.checked ? 1 : 0)}
          />
          <span>Только открытые</span>
        </label>
      </div>

      </div>
      
    </div>
  )
}
