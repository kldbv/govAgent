import { useState, useEffect } from 'react'
import { getKazakhstanRegions } from '@/services/api'
import { KazakhstanRegion } from '@/types/bpm'

interface RegionSelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

export function RegionSelect({ value, onChange, error, required = false }: RegionSelectProps) {
  const [regions, setRegions] = useState<KazakhstanRegion[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const data = await getKazakhstanRegions()
        setRegions(data)
      } catch (error) {
        console.error('Failed to load regions:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadRegions()
  }, [])
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Регион {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
        disabled={loading}
      >
        <option value="">
          {loading ? 'Загружается...' : 'Выберите регион'}
        </option>
        {regions.map(region => (
          <option key={region.id} value={region.name}>
            {region.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
