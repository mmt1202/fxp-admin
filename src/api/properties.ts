import { apiClient, ApiEnvelope, ListResult, adaptList, unwrapData } from './client';

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
  id?: string | number;
  name?: string;
  title?: string;
  completenessScore?: number;
  completeness?: PropertyCompleteness;
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

export type PropertyCompletenessListParams = {
  belowScore?: number;
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
  async getProperties(params?: PropertyCompletenessListParams): Promise<ListResult<AdminProperty>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/properties${apiClient.toQuery(params)}`);
    return adaptList<AdminProperty>(payload, ['properties', 'items']);
  }

  async getPropertyCompletenessList(params?: PropertyCompletenessListParams): Promise<ListResult<PropertyCompleteness>> {
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
