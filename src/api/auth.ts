import { apiClient } from './client';
import type { AdminUser } from '../types/admin';

type LoginResponse = {
  token: string;
  admin?: AdminUser;
};

export async function loginApi(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/admin/auth/login', { username, password }, { skipAuth: true });

  if (!response.token) {
    throw new Error('登录接口未返回 token');
  }

  return response;
}

export function getCurrentAdminApi() {
  return apiClient.get<AdminUser>('/admin/auth/me');
}
