import { apiClient } from './client';

export type UserRecord = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export function fetchUsers() {
  return apiClient.get<UserRecord[]>('/admin/users');
}
