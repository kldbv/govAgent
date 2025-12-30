import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPrograms,
  getProgramById,
  searchPrograms,
  getRecommendations,
  getProgramStats,
} from '@/services/api'
import { ProgramFilter } from '@/types/program'

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (filters: ProgramFilter & { page?: number; limit?: number }) =>
    [...programKeys.lists(), filters] as const,
  search: (filters: ProgramFilter & { page?: number; limit?: number; sort?: string }) =>
    [...programKeys.all, 'search', filters] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...programKeys.details(), id] as const,
  recommendations: () => [...programKeys.all, 'recommendations'] as const,
  stats: () => [...programKeys.all, 'stats'] as const,
}

/**
 * Hook for fetching paginated programs list
 */
export function usePrograms(filters: ProgramFilter & { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: programKeys.list(filters),
    queryFn: () => getPrograms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })
}

/**
 * Hook for searching programs with full-text search
 */
export function useSearchPrograms(
  filters: ProgramFilter & { page?: number; limit?: number; sort?: string },
  enabled = true
) {
  return useQuery({
    queryKey: programKeys.search(filters),
    queryFn: () => searchPrograms(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled,
  })
}

/**
 * Hook for fetching single program by ID
 */
export function useProgram(id: string | number | undefined) {
  return useQuery({
    queryKey: programKeys.detail(id!),
    queryFn: () => getProgramById(id!),
    staleTime: 10 * 60 * 1000, // 10 minutes - program details change less frequently
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!id,
  })
}

/**
 * Hook for fetching personalized recommendations
 */
export function useRecommendations(enabled = true) {
  return useQuery({
    queryKey: programKeys.recommendations(),
    queryFn: getRecommendations,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,
    enabled,
    retry: 1,
  })
}

/**
 * Hook for fetching program statistics
 */
export function useProgramStats() {
  return useQuery({
    queryKey: programKeys.stats(),
    queryFn: getProgramStats,
    staleTime: 30 * 60 * 1000, // 30 minutes - stats don't change often
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * Hook for prefetching program details (for hover preview)
 */
export function usePrefetchProgram() {
  const queryClient = useQueryClient()

  return (id: string | number) => {
    queryClient.prefetchQuery({
      queryKey: programKeys.detail(id),
      queryFn: () => getProgramById(id),
      staleTime: 10 * 60 * 1000,
    })
  }
}

/**
 * Hook for invalidating programs cache
 */
export function useInvalidatePrograms() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: programKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: programKeys.lists() }),
    invalidateDetail: (id: string | number) =>
      queryClient.invalidateQueries({ queryKey: programKeys.detail(id) }),
    invalidateRecommendations: () =>
      queryClient.invalidateQueries({ queryKey: programKeys.recommendations() }),
  }
}
