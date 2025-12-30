import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserApplications,
  getApplicationById,
  saveApplicationDraft,
  submitApplicationById,
  submitApplicationForProgram,
  uploadApplicationFiles,
  listApplicationFiles,
  deleteApplicationFile,
  ApplicationFormData,
} from '@/services/api'

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters: { status?: string; page?: number; limit?: number }) =>
    [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...applicationKeys.details(), id] as const,
  files: (applicationId: number) => [...applicationKeys.all, 'files', applicationId] as const,
}

/**
 * Hook for fetching user's applications
 */
export function useApplications(filters: { status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => getUserApplications(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching single application
 */
export function useApplication(id: string | number | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id!),
    queryFn: () => getApplicationById(id!),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

/**
 * Hook for fetching application files
 */
export function useApplicationFiles(applicationId: number | undefined) {
  return useQuery({
    queryKey: applicationKeys.files(applicationId!),
    queryFn: () => listApplicationFiles(applicationId!),
    staleTime: 1 * 60 * 1000,
    enabled: !!applicationId,
  })
}

/**
 * Hook for saving application draft
 */
export function useSaveApplicationDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      programId,
      formData,
      fileUploads = [],
    }: {
      programId: number
      formData: ApplicationFormData
      fileUploads?: unknown[]
    }) => saveApplicationDraft(programId, formData, fileUploads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
    },
  })
}

/**
 * Hook for submitting application
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (applicationId: number) => submitApplicationById(applicationId),
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) })
    },
  })
}

/**
 * Hook for submitting application for program (create + submit)
 */
export function useSubmitApplicationForProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      programId,
      formData,
      fileUploads = [],
    }: {
      programId: number
      formData: ApplicationFormData
      fileUploads?: unknown[]
    }) => submitApplicationForProgram(programId, formData, fileUploads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
    },
  })
}

/**
 * Hook for uploading application files
 */
export function useUploadApplicationFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ programId, files }: { programId: number; files: File[] }) =>
      uploadApplicationFiles(programId, files),
    onSuccess: (data) => {
      if (data?.data?.application_id) {
        queryClient.invalidateQueries({
          queryKey: applicationKeys.files(data.data.application_id),
        })
      }
    },
  })
}

/**
 * Hook for deleting application file
 */
export function useDeleteApplicationFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, fileId }: { applicationId: number; fileId: number }) =>
      deleteApplicationFile(applicationId, fileId),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.files(applicationId) })
    },
  })
}

/**
 * Hook for invalidating applications cache
 */
export function useInvalidateApplications() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
    invalidateDetail: (id: string | number) =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) }),
  }
}
