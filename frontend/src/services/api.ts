import axios from 'axios'
import { LoginCredentials, RegisterData } from '@/types/auth'
import { UserProfile } from '@/types/profile'
import { ApplicationData } from '@/types/application'

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
export const submitApplication = async (data: ApplicationData) => {
  const response = await apiClient.post('/applications', data) as any;
  return response.data.application;
};

export const getUserApplications = async (params: any) => {
  const response = await apiClient.get('/applications', { params }) as any;
  return response.data;
};

export const getApplicationById = async (id: string) => {
  const response = await apiClient.get(`/applications/${id}`) as any;
  return response.data.application;
};
