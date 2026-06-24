import { apiClient } from './client';

export type LoginResponse = {
  token: string;
};

export async function loginApi(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/admin/auth/login', { username, password }, { skipAuth: true });

  if (!response.token) {
    throw new Error('Login response did not include a token.');
  }

  return response;
}
