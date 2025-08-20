import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getRecommendations } from '@/services/api'
import { useAuthContext } from '@/hooks/useAuth'
import { ProgramCard } from '@/components/ProgramCard'
import type { BusinessProgram } from '@/types/program'

// Sorting options
const sortOptions = [
  { value: 'score_desc', label: 'По соответствию (сначала высокое)' },
  { value: 'deadline_asc', label: 'По дедлайну (сначала ближайшие)' },
  { value: 'funding_desc', label: 'По финансированию (сначала больше)' },
]

type SortKey = 'score_desc' | 'deadline_asc' | 'funding_desc'

export default function RecommendationsPage() {
  const { isAuthenticated } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [programs, setPrograms] = useState<BusinessProgram[]>([])

  // Filters
  const [sortBy, setSortBy] = useState<SortKey>('score_desc')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [regionFilter, setRegionFilter] = useState<string>('')
  const [minFunding, setMinFunding] = useState<string>('')
  const [maxFunding, setMaxFunding] = useState<string>('')
  const [deadlineWithinDays, setDeadlineWithinDays] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getRecommendations()
      setPrograms(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить рекомендации')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Derived filter options from data
  const programTypes = useMemo(() => {
    const set = new Set<string>()
    programs.forEach(p => p.program_type && set.add(p.program_type))
    return Array.from(set)
  }, [programs])

  const regions = useMemo(() => {
    const set = new Set<string>()
    programs.forEach(p => (p as any).eligible_regions?.forEach((r: string) => r && set.add(r)))
    return Array.from(set)
  }, [programs])

  // Apply filters and sorting
  const visiblePrograms = useMemo(() => {
    const now = new Date()
    const days = parseInt(deadlineWithinDays || '0', 10)

    let list = programs.filter(p => {
      // type filter
      if (typeFilter && p.program_type !== typeFilter) return false
      // region filter
      if (regionFilter) {
        const regs = (p as any).eligible_regions as string[] | undefined
        if (!regs || !regs.includes(regionFilter)) return false
      }
      // funding range
      const fa = (p as any).funding_amount as number | undefined
      if (minFunding && fa !== undefined && fa < Number(minFunding)) return false
      if (maxFunding && fa !== undefined && fa > Number(maxFunding)) return false
      // deadline within X days
      if (days > 0 && p.application_deadline) {
        const dl = new Date(p.application_deadline)
        const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays < 0 || diffDays > days) return false
      }
      return true
    })

    // sorting
    list.sort((a, b) => {
      if (sortBy === 'score_desc') {
        const as = Math.round(((a as any).score ?? 0) as number)
        const bs = Math.round(((b as any).score ?? 0) as number)
        return bs - as
      }
      if (sortBy === 'deadline_asc') {
        const ad = a.application_deadline ? new Date(a.application_deadline).getTime() : Number.POSITIVE_INFINITY
        const bd = b.application_deadline ? new Date(b.application_deadline).getTime() : Number.POSITIVE_INFINITY
        return ad - bd
      }
      if (sortBy === 'funding_desc') {
        const af = ((a as any).funding_amount ?? 0) as number
        const bf = ((b as any).funding_amount ?? 0) as number
        return bf - af
      }
      return 0
    })

    return list
  }, [programs, sortBy, typeFilter, regionFilter, minFunding, maxFunding, deadlineWithinDays])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Рекомендации</h1>
        <button onClick={load} className="btn-secondary">Обновить</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Сортировка</label>
            <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Тип программы</label>
            <select className="input-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Все</option>
              {programTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Регион</label>
            <select className="input-field" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="">Все</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Мин. финансирование (₸)</label>
            <input className="input-field" type="number" min={0} value={minFunding} onChange={e => setMinFunding(e.target.value)} placeholder="0" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Макс. финансирование (₸)</label>
            <input className="input-field" type="number" min={0} value={maxFunding} onChange={e => setMaxFunding(e.target.value)} placeholder="" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Дедлайн в течение (дней)</label>
            <input className="input-field" type="number" min={0} value={deadlineWithinDays} onChange={e => setDeadlineWithinDays(e.target.value)} placeholder="30" />
          </div>
        </div>

        <div className="flex justify-end mt-3 gap-3">
          <button className="btn-ghost" onClick={() => { setTypeFilter(''); setRegionFilter(''); setMinFunding(''); setMaxFunding(''); setDeadlineWithinDays(''); }}>Сбросить</button>
        </div>
      </div>

      {loading && (
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем персональные рекомендации…</p>
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={load} className="btn-primary">Повторить</button>
        </div>
      )}

      {!loading && !error && programs.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-4">Пока нет рекомендаций. Заполните профиль, чтобы мы могли подобрать программы.</p>
          <Link to="/profile" className="btn-primary">Перейти к профилю</Link>
        </div>
      )}

      {!loading && !error && programs.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">Найдено: {visiblePrograms.length}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePrograms.map((p) => (
              <ProgramCard key={p.id} program={p as any} showMatchScore className="h-full" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
