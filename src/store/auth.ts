import { create } from 'zustand';
import { getCurrentAdminApi } from '../api/auth';
import type { AdminPermission, AdminUser } from '../types/admin';
import { tokenStorage } from '../utils/token';

type AuthState = {
  token: string | null;
  currentAdmin: AdminUser | null;
  meLoading: boolean;
  login: (token: string, admin?: AdminUser) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (permission?: AdminPermission) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: tokenStorage.get(),
  currentAdmin: null,
  meLoading: false,
  login: (token, admin) => {
    tokenStorage.set(token);
    set({ token, currentAdmin: admin ?? null, meLoading: false });
  },
  logout: () => {
    tokenStorage.clear();
    set({ token: null, currentAdmin: null, meLoading: false });
  },
  fetchMe: async () => {
    if (!get().token || get().meLoading) return;
    set({ meLoading: true });
    try {
      const currentAdmin = await getCurrentAdminApi();
      set({ currentAdmin });
    } catch (error) {
      tokenStorage.clear();
      set({ token: null, currentAdmin: null });
      throw error;
    } finally {
      set({ meLoading: false });
    }
  },
  hasPermission: (permission) => {
    if (!permission) return true;
    const permissions = get().currentAdmin?.permissions ?? [];
    return permissions.includes('*') || permissions.includes(permission);
  },
}));
