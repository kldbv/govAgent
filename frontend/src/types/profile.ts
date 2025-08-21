export interface UserProfile {
  business_type: 'startup' | 'sme' | 'individual' | 'ngo'
  business_size: 'micro' | 'small' | 'medium' | 'large'
  industry: string
  region: string
  experience_years: number
  annual_revenue?: number
  employee_count?: number
}
