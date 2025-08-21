import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'
import * as api from '@/services/api'
import { User, LoginCredentials, RegisterData, UserProfile } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  updateProfile: (profileData: UserProfile) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.setAuthToken(token)
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const userData = await api.getCurrentUser()
      console.log('Fetched user data:', userData)
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      localStorage.removeItem('token')
      api.clearAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.login(credentials) as any
      console.log('Login response:', response)
      // Backend returns: { success: true, data: { token: string, user: any } }
      // Interceptor returns the body directly, so response = { success: true, data: { token, user } }
      const token = response?.data?.token
      console.log('Extracted token:', token)
      if (!token) {
        console.error('No token in response:', response)
        throw new Error('Токен не получен при входе')
      }
      localStorage.setItem('token', token)
      api.setAuthToken(token)
      // Immediately fetch full user with profile after login
      await fetchUserProfile()
      toast.success('Успешный вход в систему!')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Ошибка входа в систему')
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data) as any
      // Backend returns: { success: true, data: { token: string, user: any } }
      // Interceptor returns the body directly, so response = { success: true, data: { token, user } }
      const token = response?.data?.token
      if (!token) {
        throw new Error('Токен не получен при регистрации')
      }
      localStorage.setItem('token', token)
      api.setAuthToken(token)
      // Immediately fetch full user with profile after registration
      await fetchUserProfile()
      toast.success('Регистрация прошла успешно!')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    api.clearAuthToken()
    setUser(null)
    toast.success('Вы вышли из системы')
  }

  const updateUser = (userData: User) => {
    setUser(userData)
  }
  
  const updateProfile = async (profileData: UserProfile) => {
    try {
      const response = await api.updateUserProfile(profileData) as any
      const updatedUser = { ...user, profile: response.data.profile }
      setUser(updatedUser as User)
      toast.success('Профиль успешно обновлен!')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления профиля')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
