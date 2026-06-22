import { apiClient } from './client';

export type UserListItem = {
  id: string;
  name: string;
  status: string;
};

export function getUsers() {
  return apiClient.get<UserListItem[]>('/admin/users');
}
