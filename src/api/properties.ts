import { apiClient } from './client';

export type PropertyVisibility = 'public' | 'private' | 'hidden' | boolean;

export type AdminProperty = {
  id: string | number;
  title?: string;
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  userId?: string | number;
  ownerId?: string | number;
  isPublic?: boolean;
  visibility?: PropertyVisibility;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type AdminPropertyListParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  userId?: string;
  isPublic?: string;
};

export type AdminPropertyListResponse = {
  items: AdminProperty[];
  total: number;
  page: number;
  pageSize: number;
};

function toQuery(params: AdminPropertyListParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function getAdminProperties(params: AdminPropertyListParams) {
  return apiClient.get<AdminPropertyListResponse>(`/admin/properties${toQuery(params)}`);
}

export function getAdminProperty(id: string | number) {
  return apiClient.get<AdminProperty>(`/admin/properties/${id}`);
}

export function updateAdminPropertyVisibility(id: string | number, isPublic: boolean) {
  return apiClient.put<AdminProperty>(`/admin/properties/${id}/visibility`, { isPublic });
}

export function deleteAdminProperty(id: string | number) {
  return apiClient.delete<void>(`/admin/properties/${id}`);
}
