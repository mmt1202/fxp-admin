import { apiClient } from './client';
import type { AdminRole, AdminUser, AdminUserInput } from '../types/admin';

export function listAdminUsersApi() {
  return apiClient.get<AdminUser[]>('/admin/admin-users');
}

export function createAdminUserApi(data: AdminUserInput) {
  return apiClient.post<AdminUser>('/admin/admin-users', data);
}

export function updateAdminUserApi(id: string, data: AdminUserInput) {
  return apiClient.put<AdminUser>(`/admin/admin-users/${id}`, data);
}

export function deleteAdminUserApi(id: string) {
  return apiClient.delete<void>(`/admin/admin-users/${id}`);
}

export function listAdminRolesApi() {
  return apiClient.get<AdminRole[]>('/admin/admin-roles');
}
