// src/services/taskService.ts

import api from './api';
import type { Task } from '../types';

export const taskService = {
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/me');
    return response.data;
  },
  
  getAllTasks: async (params?: Record<string, any>): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/', { params });
    return response.data;
  },
  
  getTaskById: async (taskId: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${taskId}`);
    return response.data;
  },
  
  createTask: async (data: any): Promise<Task> => {
    const response = await api.post<Task>('/tasks/', data);
    return response.data;
  },
  
  updateTask: async (taskId: number, data: any): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}`, data);
    return response.data;
  },
  
  updateTaskStatus: async (taskId: number, status: string): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
    return response.data;
  },
  
  updateTaskRequirements: async (taskId: number, requirements: string): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}/requirements`, { requirements });
    return response.data;
  },
  
  updateTaskChecklist: async (taskId: number, checklist: any): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}/checklist`, { checklist });
    return response.data;
  },
  
  uploadTaskImage: async (taskId: number, formData: FormData): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${taskId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  deleteTaskImage: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}/image`);
  },
  
  updateTaskClientInfo: async (taskId: number, clientInfo: any): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}/client-info`, clientInfo);
    return response.data;
  },
  
  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
  
  getTasksWithFinancials: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/financials/tasks');
    return response.data;
  },
};