import { apiClient } from './client';

type LoginResponse = {
  token: string;
};

export function loginApi(username: string, password: string) {
  return apiClient.post<LoginResponse>('/admin/auth/login', { username, password }, { skipAuth: true });
}
