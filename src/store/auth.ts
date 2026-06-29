import { create } from 'zustand';
import { getCurrentAdminApi } from '../api/auth';
import { adminPermissions, type AdminPermission, type AdminUser } from '../types/admin';
import { tokenStorage } from '../utils/token';

const ADMIN_CACHE_KEY = 'fxp_admin_user';

function isSuperAdmin(admin: AdminUser | null | undefined) {
  if (!admin) return false;
  const roleText = `${admin.role?.id ?? ''} ${admin.role?.name ?? ''} ${admin.username ?? ''}`.toLowerCase();
  return roleText.includes('super') || roleText.includes('超级管理员');
}

function withPermissionFallback(admin: AdminUser): AdminUser {
  if (!isSuperAdmin(admin) || admin.permissions.length > 0) {
    return admin;
  }

  return {
    ...admin,
    permissions: [...adminPermissions],
    role: {
      ...admin.role,
      permissions: [...adminPermissions],
    },
  };
}

function readCachedAdmin() {
  const raw = window.localStorage.getItem(ADMIN_CACHE_KEY);
  if (!raw) return null;

  try {
    return withPermissionFallback(JSON.parse(raw) as AdminUser);
  } catch {
    window.localStorage.removeItem(ADMIN_CACHE_KEY);
    return null;
  }
}

function cacheAdmin(admin: AdminUser | null) {
  if (admin) {
    window.localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(withPermissionFallback(admin)));
  } else {
    window.localStorage.removeItem(ADMIN_CACHE_KEY);
  }
}

type AuthState = {
  token: string | null;
  currentAdmin: AdminUser | null;
  meLoading: boolean;
  meError: string | null;
  login: (token: string, admin?: AdminUser) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (permission?: AdminPermission) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: tokenStorage.get(),
  currentAdmin: null,
  meLoading: false,
  meError: null,
  login: (token, admin) => {
    tokenStorage.set(token);
    const currentAdmin = admin ? withPermissionFallback(admin) : get().currentAdmin;
    cacheAdmin(currentAdmin);
    set({ token, currentAdmin, meError: null });
  },
  logout: () => {
    tokenStorage.clear();
    cacheAdmin(null);
    set({ token: null, currentAdmin: null, meLoading: false, meError: null });
  },
  fetchMe: async () => {
    if (!get().token || get().meLoading) return;
    set({ meLoading: true, meError: null });
    try {
      const currentAdmin = withPermissionFallback(await getCurrentAdminApi());
      cacheAdmin(currentAdmin);
      set({ currentAdmin });
    } catch {
      const cachedAdmin = readCachedAdmin();
      const canUseDevFallback = (import.meta.env as Record<string, string>).MODE === 'development' && cachedAdmin;
      set({
        currentAdmin: canUseDevFallback ? cachedAdmin : get().currentAdmin,
        meError: canUseDevFallback
          ? '当前使用登录接口返回的管理员信息作为开发环境权限兜底。'
          : '管理员权限未加载，请确认后端 GET /admin/auth/me 已实现。',
      });
    } finally {
      set({ meLoading: false });
    }
  },
  hasPermission: (permission) => {
    if (!permission) return true;
    const admin = get().currentAdmin;
    if (isSuperAdmin(admin)) return true;
    return admin?.permissions.includes(permission) ?? false;
  },
}));
