import { useEffect, useState } from 'react'
import { searchPrograms } from '@/services/api'
import { BusinessProgram } from '@/types/program'
import { ProgramCard } from '@/components/ProgramCard'

export default function GrantsPage() {
  const [programs, setPrograms] = useState<BusinessProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 12
  const [onlyOpen, setOnlyOpen] = useState(false)

  const load = async (nextPage = 1) => {
    try {
      setLoading(true)
      const data = await searchPrograms({ program_type: 'грант', limit, page: nextPage, sort: 'newest', open_only: onlyOpen ? 1 : 0 } as any)
      const list = data.programs || data || []
      setPrograms(prev => nextPage === 1 ? list : [...prev, ...list])
      setHasMore(list.length === limit)
      setPage(nextPage)
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить гранты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [onlyOpen])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Гранты</h1>
        <p className="text-gray-600 mt-2">Актуальные грантовые программы поддержки бизнеса</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">Найдено: {programs.length}</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => { setPrograms([]); setPage(1); setOnlyOpen(e.target.checked) }} />
          <span>Только открытые</span>
        </label>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загрузка грантов...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600">Пока нет грантовых программ</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {programs.map(p => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button className="btn-secondary" disabled={loading} onClick={() => load(page + 1)}>
                {loading ? 'Загрузка...' : 'Загрузить еще'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
