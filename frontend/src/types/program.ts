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
  score?: number
  matchReasons?: string[]
}
