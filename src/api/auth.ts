import { apiClient } from './client';
import type { AdminPermission, AdminRole, AdminUser } from '../types/admin';

type LoginResponse = {
  token: string;
  admin?: AdminUser;
};

type AdminMeResponse = AdminUser | { data?: AdminUser };

function isAdminUser(value: AdminMeResponse): value is AdminUser {
  return 'id' in value && 'username' in value;
}

function isSuperAdmin(admin: AdminUser) {
  const roleId = admin.role?.id?.toLowerCase();
  const roleName = admin.role?.name;
  return roleId === 'super-admin' || roleId === 'super_admin' || roleName === '超级管理员';
}

function uniquePermissions(permissions: AdminPermission[]) {
  return Array.from(new Set(permissions));
}

function normalizeAdmin(admin: AdminUser): AdminUser {
  const rolePermissions = admin.role?.permissions ?? [];
  const directPermissions = admin.permissions ?? [];
  const isDevAdmin = import.meta.env.MODE === 'development' && admin.username === 'admin';
  const permissions = isSuperAdmin(admin) || isDevAdmin
    ? ['*' as AdminPermission]
    : uniquePermissions([...rolePermissions, ...directPermissions]);
  const role: AdminRole = admin.role
    ? { ...admin.role, permissions: admin.role.permissions ?? permissions }
    : { id: isDevAdmin ? 'super-admin' : 'custom', name: isDevAdmin ? '开发超级管理员' : '自定义管理员', permissions };

  return { ...admin, role, permissions };
}

function unwrapAdmin(response: AdminMeResponse) {
  return normalizeAdmin(isAdminUser(response) ? response : response.data as AdminUser);
}

export async function loginApi(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/admin/auth/login', { username, password }, { skipAuth: true });

  if (!response.token) {
    throw new Error('登录接口未返回 token');
  }

  return response;
}

export async function getCurrentAdminApi() {
  const response = await apiClient.get<AdminMeResponse>('/admin/auth/me');
  return unwrapAdmin(response);
}
