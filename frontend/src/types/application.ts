export interface ApplicationData {
  program_id: number
  application_data: {
    company_name: string
    business_description: string
    funding_requested?: number
    project_description: string
    expected_outcomes: string
    timeline: string
    contact_person: string
    contact_phone: string
    additional_documents?: string[]
  }
}

export interface Application {
  id: number
  program_id: number
  status: 'pending' | 'approved' | 'rejected' | 'in_review'
  application_data: ApplicationData['application_data']
  submitted_at: string
  updated_at: string
  program_title?: string
  organization?: string
  program_description?: string
}
