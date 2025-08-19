import axios from 'axios'
import { LoginCredentials, RegisterData } from '@/types/auth'
import { UserProfile } from '@/types/auth'
import { ProgramFilter, ProgramStats } from '@/types/program'
import { KazakhstanRegion, OkedCode, OkedHierarchy } from '@/types/bpm'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error?.message || 
                    error.response?.data?.message ||
                    error.message
                    
    return Promise.reject(new Error(message))
  }
)

export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const clearAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization']
}

// --- Auth --- //
export const login = (credentials: LoginCredentials) => {
  return apiClient.post<{ user: any; token: string }>('/auth/login', credentials)
}

export const register = (data: RegisterData) => {
  return apiClient.post<{ user: any; token: string }>('/auth/register', data)
}

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me') as any;
  return response.data.user;
}

// --- Profile --- //
export const updateUserProfile = (profileData: UserProfile) => {
  return apiClient.put<{ data: { profile: any } }>('/auth/profile', profileData)
}

// --- Programs --- //
export const getPrograms = async (params: any) => {
  const response = await apiClient.get<{ data: any }>('/programs', { params });
  return response.data;
};

export const getProgramById = async (id: string) => {
  const response = await apiClient.get(`/programs/${id}`) as any;
  return response.data.program;
}

export const getRecommendations = async () => {
  const response = await apiClient.get('/programs/recommendations') as any;
  return response.data.recommendations;
}

// --- Applications --- //
export const saveApplicationDraft = async (programId: number, form_data: any, file_uploads: any[] = []) => {
  const response = await apiClient.post(`/applications/program/${programId}/draft`, { form_data, file_uploads }) as any;
  return response.data;
};

export const submitApplicationById = async (applicationId: number) => {
  const response = await apiClient.post(`/applications/${applicationId}/submit`, {}) as any;
  return response.data;
};

export const getUserApplications = async (params: any) => {
  const response = await apiClient.get('/applications', { params }) as any;
  return response.data;
};

export const getApplicationById = async (id: string) => {
  const response = await apiClient.get(`/applications/${id}`) as any;
  return response.data.application;
};

// --- BMP Reference Data --- //
export const getKazakhstanRegions = async (): Promise<KazakhstanRegion[]> => {
  const response = await apiClient.get('/reference/regions') as any;
  return response.data.regions;
};

export const getOkedCodes = async (): Promise<OkedCode[]> => {
  const response = await apiClient.get('/reference/oked-codes') as any;
  return response.data.oked_codes;
};

export const getOkedHierarchy = async (): Promise<OkedHierarchy[]> => {
  const response = await apiClient.get('/reference/oked-hierarchy') as any;
  return response.data.hierarchy;
};

export const getProgramStats = async (): Promise<ProgramStats> => {
  const response = await apiClient.get('/programs/stats') as any;
  return response.data.stats;
};

// --- Enhanced Program Search --- //
export const searchPrograms = async (filters: ProgramFilter) => {
  const response = await apiClient.get('/programs/search', { params: filters }) as any;
  return response.data;
};
