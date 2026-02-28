import api from './api';
import type { Task } from '../types';

export const taskService = {
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/me');
    return response.data;
  },

  getAllTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/');
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

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
};