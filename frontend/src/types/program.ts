export interface BusinessProgram {
  id: number
  title: string
  description: string
  organization: string
  program_type: string
  target_audience: string
  funding_amount?: number
  application_deadline?: string
  requirements: string
  benefits: string
  application_process: string
  contact_info: string
  created_at: string
  opens_at?: string
  closes_at?: string
  score?: number
  matchReasons?: string[]
  // New BPM fields
  eligible_regions?: string[]
  eligible_oked_codes?: string[]
  min_loan_amount?: number
  max_loan_amount?: number
  required_documents?: string[]
  application_steps?: ApplicationStep[]
}

export interface ApplicationStep {
  id: number
  step_number: number
  title: string
  description: string
  required_documents?: string[]
  estimated_duration?: string
}

export interface ProgramFilter {
  program_type?: string
  organization?: string
  region?: string
  oked_code?: string
  min_funding?: number
  max_funding?: number
  business_type?: string
  business_size?: string
  search?: string
  open_only?: number | boolean
}

export interface ProgramStats {
  total_programs: number
  by_type: { [key: string]: number }
  by_organization: { [key: string]: number }
  by_region: { [key: string]: number }
  funding_range: {
    min: number
    max: number
    average: number
  }
}
