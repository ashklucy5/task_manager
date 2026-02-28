import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import type { User, LoginCredentials } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('access_token'),
      isAuthenticated: !!localStorage.getItem('access_token'),
      
      login: async (credentials: LoginCredentials) => {
        try {
          const response = await authService.login(credentials);
          const user = await authService.getCurrentUser();
          
          set({
            user,
            token: response.access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },
      
      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const user = await authService.getCurrentUser();
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            localStorage.removeItem('access_token');
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },
      
      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);