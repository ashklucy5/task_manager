import axios, { type AxiosInstance } from 'axios';
import type { 
  AuthResponse, 
  LoginCredentials, 
  User, 
  Task, 
  FinancialSummary,
  UserProfile

} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== NAMED EXPORTS FOR API SERVICES ====================

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) => 
    api.post<AuthResponse>('/auth/login', credentials),
  
  register: (data: Record<string, unknown>) =>  // ✅ FIXED: Parameter name + type
    api.post<AuthResponse>('/auth/register', data),
  
  getCurrentUser: () => 
    api.get<User>('/users/me'),
};

// Users API
export const usersApi = {
  getTeamProfiles: () => 
    api.get<UserProfile[]>('/users/team-profiles'),
  getUserById: (id: number) => 
    api.get<User>(`/users/${id}`),
  
  updateUser: (id: number, data: Record<string, unknown>) =>  // ✅ FIXED
    api.put<User>(`/users/${id}`, data),
  
  deleteUser: (id: number) => 
    api.delete(`/users/${id}`),
};

// Tasks API
export const tasksApi = {
  getMyTasks: () => 
    api.get<Task[]>('/tasks/me'),
  
  getAllTasks: () => 
    api.get<Task[]>('/tasks/'),
  
  getTaskById: (id: number) => 
    api.get<Task>(`/tasks/${id}`),
  
  createTask: (data: Record<string, unknown>) =>  // ✅ FIXED
    api.post<Task>('/tasks/', data),
  
  updateTask: (id: number, data: Record<string, unknown>) =>  // ✅ FIXED
    api.put<Task>(`/tasks/${id}`, data),
  
  updateTaskStatus: (id: number, status: string) => 
    api.patch<Task>(`/tasks/${id}/status`, { status }),
  
  deleteTask: (id: number) => 
    api.delete(`/tasks/${id}`),
};

// Financial API (Owner-only)
export const financialsApi = {
  getSummary: () => 
    api.get<FinancialSummary>('/financials/summary'),
  
  getUsersWithFinancials: () => 
    api.get<User[]>('/financials/users'),
  
  getTasksWithFinancials: () => 
    api.get<Task[]>('/financials/tasks'),
};

// Default export for direct axios usage (optional)
export default api;