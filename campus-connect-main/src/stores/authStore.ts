import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  fndBalance: number;
  accountAddress: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setFndBalance: (balance: number) => void;
  setaccountAddress: (address: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      fndBalance: 0,
      accountAddress: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setFndBalance: (fndBalance) => set({ fndBalance }),
      setaccountAddress: (accountAddress) => set({ accountAddress }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, fndBalance: 0 }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

