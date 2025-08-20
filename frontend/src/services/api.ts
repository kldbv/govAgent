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

// Ensure Authorization header is always attached if a token is stored
apiClient.interceptors.request.use((config) => {
  const hasAuth = (config.headers as any)?.Authorization
  if (!hasAuth) {
    const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null
    if (token) {
      (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` }
    }
  }
  return config
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
  // The response interceptor returns the body already; return it as-is so callers can access `.data` field from our API shape
  const response = await apiClient.post(`/applications/program/${programId}/draft`, { form_data, file_uploads }) as any;
  return response; // { success, data: { application_id, ... } }
};

export const uploadApplicationFiles = async (programId: number, files: File[]) => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null
  const response = await axios.post(`${API_BASE_URL}/applications/program/${programId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data', ...(apiClient.defaults.headers.common as any), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }) as any;
  return response.data ?? response; // axios without interceptor: return body; maintain compatibility
};

export const listApplicationFiles = async (applicationId: number) => {
  const response = await apiClient.get(`/applications/${applicationId}/files`) as any;
  return response; // { success, data: { files: [] } }
};

export const deleteApplicationFile = async (applicationId: number, fileId: number) => {
  const response = await apiClient.delete(`/applications/${applicationId}/files/${fileId}`) as any;
  return response.data;
};

export const submitApplicationById = async (applicationId: number) => {
  const response = await apiClient.post(`/applications/${applicationId}/submit`, {}) as any;
  return response.data;
};

export const submitApplicationForProgram = async (programId: number, form_data: any, file_uploads: any[] = []) => {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null
  const response = await apiClient.post(`/applications/program/${programId}/submit`, { form_data, file_uploads }, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }) as any;
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

// --- Admin API --- //
export const getAdminDashboardStats = async () => {
  console.log('Making admin dashboard stats API call...');
  const response = await apiClient.get('/admin/dashboard/stats') as any;
  console.log('Admin dashboard stats API response:', response);
  return response;
};

export const getAllUsers = async (params: any) => {
  const response = await apiClient.get('/admin/users', { params }) as any;
  return response.data;
};

export const updateUserRole = async (userId: number, role: string) => {
  const response = await apiClient.put(`/admin/users/${userId}/role`, { role }) as any;
  return response.data;
};

export const getAllAdminPrograms = async (params: any) => {
  const response = await apiClient.get('/admin/programs', { params }) as any;
  return response.data;
};

export const createProgram = async (programData: any) => {
  const response = await apiClient.post('/admin/programs', programData) as any;
  return response.data;
};

export const updateProgram = async (programId: number, programData: any) => {
  const response = await apiClient.put(`/admin/programs/${programId}`, programData) as any;
  return response.data;
};

export const toggleProgramStatus = async (programId: number) => {
  const response = await apiClient.patch(`/admin/programs/${programId}/toggle`) as any;
  return response.data;
};

export const updateProgramStatus = async (programId: number, status: string) => {
  const response = await apiClient.patch(`/admin/programs/${programId}/status`, { status }) as any;
  return response.data;
};

export const deleteProgram = async (programId: number) => {
  const response = await apiClient.delete(`/admin/programs/${programId}`) as any;
  return response.data;
};

export const getAllAdminApplications = async (params: any) => {
  const response = await apiClient.get('/admin/applications', { params }) as any;
  return response.data;
};

export const getApplicationDetails = async (applicationId: number) => {
  const response = await apiClient.get(`/admin/applications/${applicationId}`) as any;
  return response.data;
};

export const updateApplicationStatus = async (applicationId: number, status: string, notes?: string) => {
  const response = await apiClient.put(`/admin/applications/${applicationId}/status`, { status, notes }) as any;
  return response.data;
};
