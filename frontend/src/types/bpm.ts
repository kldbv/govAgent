/**
 * BPM specific types for Kazakhstan regions and OKED codes
 */

export interface KazakhstanRegion {
  id: number
  name: string
  code: string
}

export interface OkedCode {
  id: number
  code: string
  name_en: string
  name_ru: string
  name_kk: string
  parent_code?: string
  level: number
  is_leaf: boolean
}

export interface OkedHierarchy extends OkedCode {
  children?: OkedHierarchy[]
}

export interface AIConversation {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  conversation_data: ConversationMessage[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ProgramApplication {
  id: number
  user_id: number
  program_id: number
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
  current_step: number
  created_at: string
  updated_at: string
  submitted_at?: string
  step_data: ApplicationStepData[]
}

export interface ApplicationStepData {
  step_id: number
  completed: boolean
  data: Record<string, any>
  documents: ApplicationDocument[]
  notes?: string
}

export interface ApplicationDocument {
  id: number
  original_filename: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: string
  document_type: string
}
