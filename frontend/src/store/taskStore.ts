import { create } from 'zustand';
import { taskService } from '../services/taskService';
import type { Task } from '../types';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchMyTasks: () => Promise<void>;
  fetchAllTasks: () => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (taskId: number, data: any) => Promise<Task>;
  updateTaskStatus: (taskId: number, status: string) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  
  fetchMyTasks: async () => {
    try {
      set({ loading: true, error: null });
      const tasks = await taskService.getMyTasks();
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  fetchAllTasks: async () => {
    try {
      set({ loading: true, error: null });
      const tasks = await taskService.getAllTasks();
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  createTask: async (data: any) => {
    try {
      set({ loading: true, error: null });
      const task = await taskService.createTask(data);
      const tasks = [...get().tasks, task];
      set({ tasks, loading: false });
      return task;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateTask: async (taskId: number, data: any) => {
    try {
      set({ loading: true, error: null });
      const task = await taskService.updateTask(taskId, data);
      const tasks = get().tasks.map(t => t.id === taskId ? task : t);
      set({ tasks, loading: false });
      return task;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateTaskStatus: async (taskId: number, status: string) => {
    try {
      set({ loading: true, error: null });
      const task = await taskService.updateTaskStatus(taskId, status);
      const tasks = get().tasks.map(t => t.id === taskId ? task : t);
      set({ tasks, loading: false });
      return task;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteTask: async (taskId: number) => {
    try {
      set({ loading: true, error: null });
      await taskService.deleteTask(taskId);
      const tasks = get().tasks.filter(t => t.id !== taskId);
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}));