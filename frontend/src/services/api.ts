import axios, { AxiosError } from 'axios'
import { LoginCredentials, RegisterData, User, UserProfile } from '@/types/auth'
import { BusinessProgram, ProgramFilter, ProgramStats } from '@/types/program'
import { KazakhstanRegion, OkedCode, OkedHierarchy } from '@/types/bpm'

// ============================================
// API Configuration
// ============================================

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Ensure Authorization header is always attached if a token is stored
apiClient.interceptors.request.use((config) => {
  const hasAuth = config.headers?.Authorization
  if (!hasAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

interface ApiErrorResponse {
  error?: string
  message?: string
}

apiClient.interceptors.response.use(
  response => response.data,
  (error: AxiosError<ApiErrorResponse>) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message

    return Promise.reject(new Error(message))
  }
)

export const setAuthToken = (token: string): void => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const clearAuthToken = (): void => {
  delete apiClient.defaults.headers.common['Authorization']
}

// ============================================
// Common Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface Pagination {
  current_page: number
  per_page: number
  total: number
  total_pages: number
  has_next?: boolean
  has_prev?: boolean
}

// ============================================
// Auth API
// ============================================

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterResponse {
  user: User
  token: string
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', credentials)
  return response as unknown as LoginResponse
}

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await apiClient.post('/auth/register', data)
  return response as unknown as RegisterResponse
}

export const getCurrentUser = async (): Promise<User> => {
  const response = (await apiClient.get('/auth/me')) as any
  const user = response?.data?.user ?? response?.user
  return user
}

// ============================================
// Profile API
// ============================================

export const updateUserProfile = async (profileData: UserProfile): Promise<{ profile: UserProfile }> => {
  const response = await apiClient.put('/auth/profile', profileData)
  return (response as any).data
}

// ============================================
// Programs API
// ============================================

export interface ProgramsListResponse {
  programs: BusinessProgram[]
  pagination: Pagination
}

export const getPrograms = async (params: ProgramFilter & { page?: number; limit?: number }): Promise<ProgramsListResponse> => {
  const response = (await apiClient.get('/programs', { params })) as any
  return response.data
}

export const getProgramById = async (id: string | number): Promise<BusinessProgram> => {
  const response = (await apiClient.get(`/programs/${id}`)) as any
  return response.data.program
}

export const getRecommendations = async (): Promise<BusinessProgram[]> => {
  const response = (await apiClient.get('/programs/recommendations')) as any
  return response.data.recommendations
}

export const getProgramStats = async (): Promise<ProgramStats> => {
  const response = (await apiClient.get('/programs/stats')) as any
  return response.data.stats
}

export const searchPrograms = async (filters: ProgramFilter & { page?: number; limit?: number; sort?: string }): Promise<ProgramsListResponse> => {
  const response = (await apiClient.get('/programs/search', { params: filters })) as any
  return response.data
}

// ============================================
// Applications API
// ============================================

export interface ApplicationFormData {
  applicant?: {
    company_name?: string
    contact_person?: string
    email?: string
    phone?: string
  }
  documents?: Record<string, boolean>
  [key: string]: unknown
}

export const saveApplicationDraft = async (
  programId: number,
  form_data: ApplicationFormData,
  file_uploads: unknown[] = []
): Promise<any> => {
  const response = await apiClient.post(`/applications/program/${programId}/draft`, { form_data, file_uploads })
  return response
}

export const uploadApplicationFiles = async (programId: number, files: File[]): Promise<any> => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const response = await axios.post(`${API_BASE_URL}/applications/program/${programId}/files`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return response.data
}

export const listApplicationFiles = async (applicationId: number): Promise<any> => {
  const response = await apiClient.get(`/applications/${applicationId}/files`)
  return response
}

export const deleteApplicationFile = async (applicationId: number, fileId: number): Promise<void> => {
  await apiClient.delete(`/applications/${applicationId}/files/${fileId}`)
}

export const submitApplicationById = async (applicationId: number): Promise<any> => {
  const response = (await apiClient.post(`/applications/${applicationId}/submit`, {})) as any
  return response.data
}

export const submitApplicationForProgram = async (
  programId: number,
  form_data: ApplicationFormData,
  file_uploads: unknown[] = []
): Promise<any> => {
  const response = (await apiClient.post(`/applications/program/${programId}/submit`, { form_data, file_uploads })) as any
  return response.data
}

export const getUserApplications = async (params: { status?: string; page?: number; limit?: number }): Promise<any> => {
  const response = (await apiClient.get('/applications', { params })) as any
  return response
}

export const getApplicationById = async (id: string | number): Promise<any> => {
  const response = (await apiClient.get(`/applications/${id}`)) as any
  return response.data.application
}

// ============================================
// BMP Reference Data API
// ============================================

export const getKazakhstanRegions = async (): Promise<KazakhstanRegion[]> => {
  const response = (await apiClient.get('/reference/regions')) as any
  return response.data.regions
}

export const getOkedCodes = async (): Promise<OkedCode[]> => {
  const response = (await apiClient.get('/reference/oked-codes')) as any
  return response.data.oked_codes
}

export const getOkedHierarchy = async (): Promise<OkedHierarchy[]> => {
  const response = (await apiClient.get('/reference/oked-hierarchy')) as any
  return response.data.hierarchy
}

// ============================================
// Admin API
// ============================================

export const getAdminDashboardStats = async (): Promise<any> => {
  const response = await apiClient.get('/admin/dashboard/stats')
  return response
}

export const getAllUsers = async (params: { page?: number; limit?: number; search?: string; role?: string }): Promise<any> => {
  const response = await apiClient.get('/admin/users', { params })
  return response
}

export const updateUserRole = async (userId: number, role: string): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/role`, { role })
}

export const getAllAdminPrograms = async (params: { page?: number; limit?: number; search?: string }): Promise<any> => {
  const response = await apiClient.get('/admin/programs', { params })
  return response
}

export const createProgram = async (programData: unknown): Promise<any> => {
  const response = await apiClient.post('/admin/programs', programData)
  return response
}

export const updateProgram = async (programId: number, programData: unknown): Promise<any> => {
  const response = await apiClient.put(`/admin/programs/${programId}`, programData)
  return response
}

export const toggleProgramStatus = async (programId: number): Promise<any> => {
  const response = await apiClient.patch(`/admin/programs/${programId}/toggle`)
  return response
}

export const updateProgramStatus = async (programId: number, status: string): Promise<void> => {
  await apiClient.patch(`/admin/programs/${programId}/status`, { status })
}

export const deleteProgram = async (programId: number): Promise<void> => {
  await apiClient.delete(`/admin/programs/${programId}`)
}

export const getAllAdminApplications = async (params: { page?: number; limit?: number; status?: string }): Promise<any> => {
  const response = await apiClient.get('/admin/applications', { params })
  return response
}

export const getApplicationDetails = async (applicationId: number): Promise<any> => {
  const response = await apiClient.get(`/admin/applications/${applicationId}`)
  return response
}

export const updateApplicationStatus = async (
  applicationId: number,
  status: string,
  notes?: string
): Promise<void> => {
  await apiClient.put(`/admin/applications/${applicationId}/status`, { status, notes })
}

// ============================================
// Calculator API
// ============================================

export interface CalculatorInput {
  loanAmount: number
  loanTermMonths: number
  bankRate: number
  subsidyRate: number
}

export interface CalculatorResult {
  input: CalculatorInput
  effectiveRate: number
  monthlyPaymentBefore: number
  monthlyPaymentAfter: number
  monthlySavings: number
  totalSavings: number
  totalPaymentBefore: number
  totalPaymentAfter: number
  totalInterestBefore: number
  totalInterestAfter: number
}

export interface ProgramCalculatorData {
  programId: number
  programTitle: string
  bankRate: number | null
  subsidyRate: number | null
  maxLoanTermMonths: number | null
  minLoanAmount: number | null
  maxLoanAmount: number | null
  calculatorEnabled: boolean
}

export interface PaymentScheduleItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export const calculateSubsidy = async (input: CalculatorInput): Promise<CalculatorResult> => {
  const response = (await apiClient.post('/calculator/calculate', input)) as any
  return response.data
}

export const calculateSubsidyWithProgram = async (
  programId: number,
  loanAmount: number,
  loanTermMonths: number,
  customBankRate?: number,
  customSubsidyRate?: number
): Promise<CalculatorResult & { programData: ProgramCalculatorData }> => {
  const response = (await apiClient.post(`/calculator/program/${programId}`, {
    loanAmount,
    loanTermMonths,
    customBankRate,
    customSubsidyRate,
  })) as any
  return response.data
}

export const getProgramCalculatorData = async (programId: number): Promise<ProgramCalculatorData> => {
  const response = (await apiClient.get(`/calculator/program/${programId}/data`)) as any
  return response.data
}

export const getCalculatorSchedule = async (input: CalculatorInput): Promise<{ schedule: PaymentScheduleItem[] }> => {
  const response = (await apiClient.post('/calculator/schedule', input)) as any
  return response.data
}
