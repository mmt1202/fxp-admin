import { create } from 'zustand';
import { tokenStorage } from '../utils/token';

type AuthState = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: tokenStorage.get(),
  login: (token) => {
    tokenStorage.set(token);
    set({ token });
  },
  logout: () => {
    tokenStorage.clear();
    set({ token: null });
  },
}));
