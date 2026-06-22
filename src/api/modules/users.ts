import { apiClient, PageResult, QueryParams } from '../client';

export type UserStatus = 'enabled' | 'disabled';

export interface UserSummary {
  id: string;
  nickname: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: string;
}

export interface UserDetail extends UserSummary {
  email?: string;
  lastLoginAt?: string;
  houseCount: number;
  reviewCount: number;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
  reason?: string;
}

export function getUsers(query?: QueryParams) {
  return apiClient.get<PageResult<UserSummary>>('/users', { query });
}

export function getUserDetail(userId: string) {
  return apiClient.get<UserDetail>(`/users/${userId}`);
}

export function updateUserStatus(userId: string, payload: UpdateUserStatusPayload) {
  return apiClient.patch<UserDetail>(`/users/${userId}/status`, payload);
}
