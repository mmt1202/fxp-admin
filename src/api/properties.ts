import { apiClient } from './client';

export type PropertyVisibility = 'public' | 'hidden' | 'draft' | 'archived' | boolean;

export type AdminProperty = {
  id: string | number;
  title: string;
  address?: string;
  userId?: string | number;
  userName?: string;
  city?: string;
  district?: string;
  area?: string;
  isPublic?: boolean;
  visibility?: PropertyVisibility;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  coverUrl?: string;
};

export type AdminPropertyReview = {
  id: string | number;
  rating?: number;
  content?: string;
  userName?: string;
  createdAt?: string;
};

export type PropertyListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  city?: string;
  district?: string;
  userId?: string;
  visibility?: string;
};

export type PaginatedProperties = {
  items: AdminProperty[];
  total: number;
  page: number;
  pageSize: number;
};

type MaybeListResponse = PaginatedProperties | AdminProperty[] | {
  data?: AdminProperty[] | PaginatedProperties;
  list?: AdminProperty[];
  total?: number;
  page?: number;
  pageSize?: number;
};

const buildQuery = (params: PropertyListParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export async function getAdminProperties(params: PropertyListParams): Promise<PaginatedProperties> {
  const response = await apiClient.get<MaybeListResponse>(`/admin/properties?${buildQuery(params)}`);

  if (Array.isArray(response)) {
    return { items: response, total: response.length, page: params.page, pageSize: params.pageSize };
  }

  if ('data' in response && response.data) {
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.total ?? response.data.length,
        page: response.page ?? params.page,
        pageSize: response.pageSize ?? params.pageSize,
      };
    }
    return response.data;
  }

  if ('list' in response && response.list) {
    return {
      items: response.list,
      total: response.total ?? response.list.length,
      page: response.page ?? params.page,
      pageSize: response.pageSize ?? params.pageSize,
    };
  }

  return response as PaginatedProperties;
}

export function getAdminProperty(id: string | number) {
  return apiClient.get<AdminProperty>(`/admin/properties/${id}`);
}

export function updateAdminPropertyVisibility(id: string | number, isPublic: boolean) {
  return apiClient.put<AdminProperty>(`/admin/properties/${id}/visibility`, {
    isPublic,
    visibility: isPublic ? 'public' : 'hidden',
  });
}

export function deleteAdminProperty(id: string | number) {
  return apiClient.delete<void>(`/admin/properties/${id}`);
}

export async function getAdminPropertyReviews(id: string | number) {
  const response = await apiClient.get<AdminPropertyReview[] | { data?: AdminPropertyReview[] }>(`/admin/properties/${id}/reviews`);
  return Array.isArray(response) ? response : response.data ?? [];
}
