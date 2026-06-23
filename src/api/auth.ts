import { apiClient } from './client';
import type { AdminUser } from '../types/admin';

type LoginResponse = {
  token: string;
  admin?: AdminUser;
};

export function loginApi(username: string, password: string) {
  return apiClient.post<LoginResponse>('/admin/auth/login', { username, password }, { skipAuth: true });
}

export function getCurrentAdminApi() {
  return apiClient.get<AdminUser>('/admin/auth/me');
}
