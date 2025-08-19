import { useState, useEffect, useMemo } from 'react'
import { getOkedCodes } from '@/services/api'

interface OkedCode {
  id: number
  code: string
  name_en: string
  name_ru: string
  name_kk: string
  parent_code?: string
  level: number
  is_leaf: boolean
}

interface OkedSelectProps {
  value?: string
  onChange: (value: string, selectedItem?: OkedCode) => void
  error?: string
  required?: boolean
}

export function OkedSelect({ value, onChange, error, required = false }: OkedSelectProps) {
  const [codes, setCodes] = useState<OkedCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadCodes = async () => {
      try {
        setApiError(null)
        const data = await getOkedCodes()
        if (Array.isArray(data)) {
          setCodes(data)
        } else {
          throw new Error('Некорректный формат данных')
        }
      } catch (error) {
        console.error('Failed to load OKED codes:', error)
        setApiError(error instanceof Error ? error.message : 'Ошибка загрузки кодов ОКЭД')
      } finally {
        setLoading(false)
      }
    }
    
    loadCodes()
  }, [])
  
  // Set initial search term from value
  useEffect(() => {
    if (value && codes.length > 0) {
      const selectedCode = codes.find(code => code.code === value)
      if (selectedCode) {
        setSearchTerm(`${selectedCode.code} - ${selectedCode.name_ru}`)
      }
    }
  }, [value, codes])
  
  const filteredCodes = useMemo(() => {
    if (!searchTerm) return codes.slice(0, 50) // Show first 50 if no search
    
    const term = searchTerm.toLowerCase()
    return codes
      .filter(code => {
        const nameRu = (code.name_ru || '').toLowerCase()
        const nameEn = (code.name_en || '').toLowerCase()
        const codeStr = (code.code || '').toLowerCase()
        return codeStr.includes(term) || nameRu.includes(term) || nameEn.includes(term)
      })
      .slice(0, 100) // Limit results
  }, [codes, searchTerm])
  
  const handleSelect = (code: OkedCode) => {
    try {
      setSearchTerm(`${code.code} - ${code.name_ru}`)
      onChange(code.code, code)
      setIsOpen(false)
    } catch (error) {
      console.error('Error selecting OKED code:', error)
      setApiError('Ошибка при выборе кода ОКЭД')
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // If clearing the input, clear the selection
    if (!newValue) {
      onChange('')
    }
  }
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ОКЭД код {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)} // Delay to allow clicking
          placeholder={loading ? "Загружается..." : "Введите код или название деятельности"}
          className={`input-field ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          disabled={loading}
        />
        
        {isOpen && filteredCodes.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCodes.map(code => (
              <div
                key={code.id}
                onMouseDown={(e) => {
                  e.preventDefault() // Prevent input blur
                  handleSelect(code)
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm">{code.code}</div>
                <div className="text-xs text-gray-600 truncate">
                  {code.name_ru}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {apiError && (
        <div className="mt-1 text-sm text-red-600">
          {apiError}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Обновить страницу
          </button>
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Введите код ОКЭД или название деятельности для поиска
      </p>
    </div>
  )
}
