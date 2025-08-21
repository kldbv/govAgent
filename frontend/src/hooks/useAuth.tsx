import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'
import * as api from '@/services/api'
import { User, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
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
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      localStorage.removeItem('token')
      api.clearAuthToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.login(credentials) as any
      const { user: userData, token } = response.data
      localStorage.setItem('token', token)
      api.setAuthToken(token)
      setUser(userData)
      toast.success('Успешный вход в систему!')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка входа в систему')
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data) as any
      const { user: userData, token } = response.data
      localStorage.setItem('token', token)
      api.setAuthToken(token)
      setUser(userData)
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
