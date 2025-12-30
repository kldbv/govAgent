import { BusinessProgram, ProgramStats } from './program'
import { User } from './auth'

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/**
 * Pagination info returned by list endpoints
 */
export interface Pagination {
  current_page: number
  per_page: number
  total: number
  total_pages: number
  has_next?: boolean
  has_prev?: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

// ============================================
// Auth API Responses
// ============================================

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterResponse {
  user: User
  token: string
}

export interface ProfileResponse {
  user: User
}

// ============================================
// Programs API Responses
// ============================================

export interface ProgramsListResponse {
  programs: BusinessProgram[]
  pagination: Pagination
}

export interface ProgramDetailResponse {
  program: BusinessProgram
}

export interface ProgramStatsResponse {
  stats: ProgramStats
}

export interface RecommendationsResponse {
  recommendations: BusinessProgram[]
}

// ============================================
// Applications API Responses
// ============================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export interface Application {
  id: number
  user_id: number
  program_id: number
  program_title?: string
  organization?: string
  status: ApplicationStatus
  form_data?: ApplicationFormData
  submitted_at?: string
  last_updated: string
  created_at: string
  submission_reference?: string
  notes?: string
}

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

export interface ApplicationsListResponse {
  applications: Application[]
  pagination?: Pagination
}

export interface ApplicationDetailResponse {
  application: Application
}

export interface ApplicationDraftResponse {
  application_id: number
  message: string
}

export interface ApplicationSubmitResponse {
  application_id: number
  submission_reference: string
  message: string
}

// ============================================
// File Upload Responses
// ============================================

export interface UploadedFile {
  id: number
  original_name: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export interface FileUploadResponse {
  application_id: number
  files: UploadedFile[]
}

export interface FileListResponse {
  files: UploadedFile[]
}

// ============================================
// Calculator API Responses
// ============================================

export interface SubsidyCalculationResult {
  loan_amount: number
  loan_term_months: number
  bank_rate: number
  subsidy_rate: number
  effective_rate: number
  monthly_payment_without_subsidy: number
  monthly_payment_with_subsidy: number
  monthly_savings: number
  total_payment_without_subsidy: number
  total_payment_with_subsidy: number
  total_savings: number
  savings_percentage: number
}

export interface CalculatorResponse {
  calculation: SubsidyCalculationResult
  program_id?: number
}

// ============================================
// Admin API Responses
// ============================================

export interface AdminStats {
  total_users: number
  total_programs: number
  total_applications: number
  applications_by_status: Record<ApplicationStatus, number>
  recent_applications: Application[]
}

export interface AdminStatsResponse {
  stats: AdminStats
}

export interface UserListItem {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user'
  created_at: string
  applications_count?: number
}

export interface UsersListResponse {
  users: UserListItem[]
  pagination: Pagination
}

// ============================================
// Reference Data Responses
// ============================================

export interface ReferenceOption {
  value: string
  label: string
}

export interface ReferenceDataResponse {
  regions: ReferenceOption[]
  industries: ReferenceOption[]
  business_types: ReferenceOption[]
  business_sizes: ReferenceOption[]
  program_types: ReferenceOption[]
  organizations: ReferenceOption[]
}

// ============================================
// Error Response
// ============================================

export interface ApiError {
  success: false
  error: string
  message?: string
  code?: string
  details?: Record<string, string[]>
}

// ============================================
// Utility Types
// ============================================

/**
 * Makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Extracts data type from ApiResponse
 */
export type ExtractData<T> = T extends ApiResponse<infer D> ? D : never
