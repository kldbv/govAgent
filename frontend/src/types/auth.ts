export interface User {
  id: number
  email: string
  full_name: string
  created_at: string
  role: 'admin' | 'manager' | 'user'
  profile?: UserProfile
}

export interface UserProfile {
  business_type: 'startup' | 'sme' | 'individual' | 'ngo'
  business_size: 'micro' | 'small' | 'medium' | 'large'
  industry: string
  region: string
  experience_years: number
  annual_revenue?: number
  employee_count?: number
  // New BPM fields
  bin?: string
  oked_code?: string
  desired_loan_amount?: number
  business_goals?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}
