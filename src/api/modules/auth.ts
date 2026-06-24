import { apiClient } from '../client';

export interface AdminInfo {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  admin: AdminInfo;
}

export function login(payload: LoginPayload) {
  return apiClient.post<LoginResult>('/auth/login', payload);
}

export function getCurrentAdmin(token?: string) {
  return apiClient.get<AdminInfo>('/auth/me', { token });
}
