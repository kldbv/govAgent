import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProgramFilter } from './ProgramFilter'
import { ProgramCard } from './ProgramCard'
import { ProgramCardSkeleton } from './LoadingSkeleton'
import { BusinessProgram, ProgramFilter as ProgramFilterType } from '@/types/program'
import { searchPrograms, getRecommendations } from '@/services/api'
import { useAuthContext } from '@/hooks/useAuth'

type SortOption = 'relevance' | 'funding_amount' | 'deadline' | 'newest' | 'title'

export function EnhancedProgramsPage() {
  const { user } = useAuthContext()
  const [programs, setPrograms] = useState<BusinessProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ProgramFilterType>({})
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  
  const loadPrograms = useCallback(async (newFilters?: ProgramFilterType, reset = false) => {
    try {
      setLoading(true)
      const currentFilters = newFilters || filters
      const currentPage = reset ? 1 : page
      
      let response: any
      if (showRecommendations && user?.profile) {
        // Get personalized recommendations
        response = await getRecommendations()
        setPrograms(response)
        setHasMore(false)
      } else {
        // Search with filters - extend filter type temporarily
        response = await searchPrograms({
          ...currentFilters,
          page: currentPage,
          limit: 12,
          sort: sortBy
        } as any)
        
        if (reset) {
          setPrograms(response.programs || response)
        } else {
          setPrograms(prev => [...prev, ...(response.programs || response)])
        }
        
        setHasMore((response.programs || response).length === 12)
        setPage(currentPage)
      }
    } catch (error) {
      console.error('Failed to load programs:', error)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }, [filters, page, sortBy, showRecommendations, user])
  
  useEffect(() => {
    loadPrograms(filters, true)
  }, [filters, sortBy, showRecommendations])
  
  const handleFiltersChange = (newFilters: ProgramFilterType) => {
    setFilters(newFilters)
    setPage(1)
  }
  
  const handleResetFilters = () => {
    setFilters({})
    setPage(1)
  }
  
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPage(1)
  }
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      loadPrograms(filters, false)
    }
  }
  
  const sortedPrograms = useMemo(() => {
    if (showRecommendations) return programs // Already sorted by relevance
    
    const sorted = [...programs]
    switch (sortBy) {
      case 'funding_amount':
        return sorted.sort((a, b) => (b.funding_amount || 0) - (a.funding_amount || 0))
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.application_deadline && !b.application_deadline) return 0
          if (!a.application_deadline) return 1
          if (!b.application_deadline) return -1
          return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()
        })
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
      case 'relevance':
      default:
        return sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
    }
  }, [programs, sortBy, showRecommendations])
  
  const filterCount = Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showRecommendations ? 'Рекомендации для вас' : 'Программы поддержки бизнеса'}
          </h1>
          <p className="text-gray-600">
            {showRecommendations 
              ? 'Персонализированные программы на основе вашего профиля'
              : 'Найдите подходящие программы финансирования и поддержки'
            }
          </p>
        </div>
        
        {/* Recommendation Toggle */}
        {user?.profile && (
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={`btn-${showRecommendations ? 'primary' : 'secondary'} flex items-center gap-2`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {showRecommendations ? 'Все программы' : 'Рекомендации'}
            </button>
          </div>
        )}
      </div>
      
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Filters Sidebar */}
        {!showRecommendations && (
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="sticky top-6">
              <ProgramFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                isLoading={loading}
              />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className={showRecommendations ? 'col-span-4' : 'lg:col-span-3'}>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="text-sm text-gray-600">
                {loading ? 'Загрузка...' : `Найдено программ: ${programs.length}`}
                {filterCount > 0 && !showRecommendations && (
                  <span className="ml-2 badge bg-blue-100 text-blue-800">
                    {filterCount} фильтр{filterCount > 1 ? (filterCount > 4 ? 'ов' : 'а') : ''}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort */}
              {!showRecommendations && (
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="input-field text-sm w-auto"
                >
                  <option value="relevance">По релевантности</option>
                  <option value="funding_amount">По размеру финансирования</option>
                  <option value="deadline">По дедлайну</option>
                  <option value="newest">Новые</option>
                  <option value="title">По алфавиту</option>
                </select>
              )}
              
              {/* View Mode */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Programs Grid/List */}
          {loading && programs.length === 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProgramCardSkeleton key={i} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Программы не найдены</h3>
              <p className="text-gray-600 mb-4">
                {showRecommendations 
                  ? 'Заполните профиль для получения персональных рекомендаций'
                  : 'Попробуйте изменить фильтры или поисковый запрос'
                }
              </p>
              {!showRecommendations && filterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="btn-secondary"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }>
                {sortedPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    showMatchScore={showRecommendations}
                    className={viewMode === 'list' ? 'flex-row' : ''}
                  />
                ))}
              </div>
              
              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn-secondary flex items-center gap-2 mx-auto"
                  >
                    {loading && <div className="loading-spinner w-4 h-4" />}
                    Загрузить еще
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
