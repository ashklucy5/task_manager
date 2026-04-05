import axios, { type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Task,
  FinancialSummary,
  UserProfile,
  UserCreate,
  CompanyWithAdminResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),
  register: (data: Record<string, unknown>) =>
    api.post<AuthResponse>('/auth/register', data),
  getCurrentUser: () =>
    api.get<User>('/users/me'),
};

export const usersApi = {
  getTeamProfiles: () =>
    api.get<UserProfile[]>('/users/team-profiles'),
  getUserById: (id: string) =>
    api.get<User>(`/users/${id}`),
  getUsers: (params?: Record<string, unknown>) =>
    api.get<User[]>('/users/', { params }),
  createUser: (data: UserCreate) =>
    api.post<User>('/users/', data),
  updateUser: (id: string, data: Record<string, unknown>) =>
    api.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
  getMe: () =>
    api.get<User>('/users/me'),
  updateMyStatus: (status: string) =>
    api.put(`/users/me/status?new_status=${status}`),
  heartbeat: () =>
    api.post('/users/me/heartbeat'),
  setOffline: () =>
    api.post('/users/me/set-offline'),
  updateMyPassword: (data: { current_password: string; new_password: string }) =>
    api.put<User>('/users/me/password', data),
  uploadAvatar: (userId: string, formData: FormData) =>
    api.post<User>(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAvatar: (userId: string) =>
    api.delete<User>(`/users/${userId}/avatar`),
};

export const tasksApi = {
  getMyTasks: () =>
    api.get<Task[]>('/tasks/me'),
  getAllTasks: (params?: Record<string, unknown>) =>
    api.get<Task[]>('/tasks/', { params }),
  getTaskById: (id: number) =>
    api.get<Task>(`/tasks/${id}`),
  createTask: (data: FormData | Record<string, unknown>) =>
    api.post<Task>('/tasks/', data),
  updateTask: (id: number, data: Record<string, unknown>) =>
    api.put<Task>(`/tasks/${id}`, data),
  updateTaskStatus: (id: number, status: string) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }),
  deleteTask: (id: number) =>
    api.delete(`/tasks/${id}`),
};

export const financialsApi = {
  getSummary: () =>
    api.get<FinancialSummary>('/financials/summary'),
  getUsersWithFinancials: () =>
    api.get<User[]>('/financials/users'),
  getTasksWithFinancials: () =>
    api.get<Task[]>('/financials/tasks'),
};

export const companiesApi = {
  createWithAdmin: (data: { company: any; admin: any }) =>
    api.post<CompanyWithAdminResponse>('/companies/with-admin', data),
};

export default api;