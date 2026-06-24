import { apiClient, type ApiEnvelope, type ListResult, adaptList, unwrapData } from './client';

export type PropertyVisibility = 'public' | 'hidden' | 'draft' | 'archived' | boolean;

export type PropertyCompletenessDimension = {
  key: 'basic' | 'address' | 'images' | 'surroundings' | 'reviews' | 'aiReview';
  label: string;
  score: number;
  weight: number;
  missingItems: string[];
};

export type PropertyCompleteness = {
  propertyId: string;
  propertyName: string;
  score: number;
  level: 'excellent' | 'good' | 'warning' | 'critical';
  missingItems: string[];
  dimensions: PropertyCompletenessDimension[];
  updatedAt?: string;
};

export type AdminProperty = Record<string, unknown> & {
  id: string | number;
  name?: string;
  title?: string;
  completenessScore?: number;
  completeness?: PropertyCompleteness;
  address?: string;
  city?: string;
  district?: string;
  area?: string;
  userId?: string | number;
  userName?: string;
  ownerId?: string | number;
  isPublic?: boolean;
  visibility?: PropertyVisibility;
  status?: string;
  onlineStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type AdminPropertyReview = Record<string, unknown> & {
  id: string | number;
  userName?: string;
  rating?: number;
  content?: string;
};

export type PropertyListParams = Record<string, string | number | boolean | undefined>;

function normalizeScore(score: unknown) {
  const numberScore = typeof score === 'number' ? score : Number(score);
  return Number.isFinite(numberScore) ? Math.max(0, Math.min(100, Math.round(numberScore))) : 0;
}

function scoreToLevel(score: number): PropertyCompleteness['level'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
}

function normalizeCompleteness(item: unknown): PropertyCompleteness {
  const body = item && typeof item === 'object' ? item as Record<string, unknown> : {};
  const score = normalizeScore(body.score ?? body.completenessScore);
  const dimensions = Array.isArray(body.dimensions) ? body.dimensions as PropertyCompletenessDimension[] : [];
  const missingItems = Array.isArray(body.missingItems) ? body.missingItems.map(String) : dimensions.flatMap((dimension) => dimension.missingItems ?? []);

  return {
    propertyId: String(body.propertyId ?? body.id ?? ''),
    propertyName: String(body.propertyName ?? body.name ?? body.title ?? '未命名房源'),
    score,
    level: typeof body.level === 'string' ? body.level as PropertyCompleteness['level'] : scoreToLevel(score),
    missingItems,
    dimensions,
    updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : undefined,
  };
}

class PropertyApi {
  async getProperties(params?: PropertyListParams): Promise<ListResult<AdminProperty>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/properties${apiClient.toQuery(params)}`);
    return adaptList<AdminProperty>(payload, ['properties', 'items']);
  }

  async getProperty(id: string | number): Promise<AdminProperty> {
    const payload = await apiClient.get<ApiEnvelope<AdminProperty>>(`/admin/properties/${id}`);
    return unwrapData<AdminProperty>(payload);
  }

  async getPropertyReviews(id: string | number): Promise<AdminPropertyReview[]> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/properties/${id}/reviews`);
    return adaptList<AdminPropertyReview>(payload, ['reviews', 'items']).items;
  }

  async updateVisibility(id: string | number, isPublic: boolean): Promise<AdminProperty> {
    const payload = await apiClient.put<ApiEnvelope<AdminProperty>>(`/admin/properties/${id}/visibility`, { isPublic });
    return unwrapData<AdminProperty>(payload);
  }

  async deleteProperty(id: string | number) {
    return apiClient.delete<ApiEnvelope<{ success?: boolean }>>(`/admin/properties/${id}`);
  }

  async getPropertyCompletenessList(params?: PropertyListParams): Promise<ListResult<PropertyCompleteness>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/properties/completeness${apiClient.toQuery(params)}`);
    const list = adaptList<unknown>(payload, ['properties', 'items', 'completeness']);
    return { ...list, items: list.items.map(normalizeCompleteness) };
  }

  async getPropertyCompleteness(id: string | number): Promise<PropertyCompleteness> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/properties/${id}/completeness`);
    return normalizeCompleteness(unwrapData(payload));
  }
}

export const propertyApi = new PropertyApi();
export const getAdminProperties = (params?: PropertyListParams) => propertyApi.getProperties(params);
export const getAdminProperty = (id: string | number) => propertyApi.getProperty(id);
export const getAdminPropertyReviews = (id: string | number) => propertyApi.getPropertyReviews(id);
export const updateAdminPropertyVisibility = (id: string | number, isPublic: boolean) => propertyApi.updateVisibility(id, isPublic);
export const deleteAdminProperty = (id: string | number) => propertyApi.deleteProperty(id);
