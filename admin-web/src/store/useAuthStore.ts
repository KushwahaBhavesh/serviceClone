import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: (user, token) => {
        set({ user, token });
        // Set default axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      logout: () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common['Authorization'];
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
