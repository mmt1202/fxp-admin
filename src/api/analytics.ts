import { apiClient } from './client';

export type LocationAnalyticsFilters = {
  city?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
};

export type LocationAnalyticsItem = {
  city: string;
  district?: string;
  propertyCount: number;
  communityCount: number;
  reviewCount: number;
  aiReviewCount: number;
  favoriteCount: number;
  viewCount: number;
  heatScore: number;
};

export type CommunityAnalyticsItem = {
  id: string;
  name: string;
  city: string;
  district?: string;
  propertyCount: number;
  reviewCount: number;
  aiReviewCount: number;
  favoriteCount: number;
  viewCount: number;
  heatScore: number;
};

export type AnalyticsResponse<T> = {
  items: T[];
  total?: number;
};

type MaybeWrappedResponse<T> = AnalyticsResponse<T> | T[];

function normalizeResponse<T>(response: MaybeWrappedResponse<T>): AnalyticsResponse<T> {
  return Array.isArray(response) ? { items: response, total: response.length } : response;
}

function buildQuery(filters: LocationAnalyticsFilters) {
  const params = new URLSearchParams();

  if (filters.city?.trim()) params.set('city', filters.city.trim());
  if (filters.district?.trim()) params.set('district', filters.district.trim());
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const analyticsApi = {
  async getLocations(filters: LocationAnalyticsFilters) {
    const response = await apiClient.get<MaybeWrappedResponse<LocationAnalyticsItem>>(`/admin/analytics/locations${buildQuery(filters)}`);
    return normalizeResponse(response);
  },
  async getCommunities(filters: LocationAnalyticsFilters) {
    const response = await apiClient.get<MaybeWrappedResponse<CommunityAnalyticsItem>>(`/admin/analytics/communities${buildQuery(filters)}`);
    return normalizeResponse(response);
  },
};
