import { apiClient } from './client';

export type AnalyticsRangeKey = 'today' | '7d' | '30d' | 'custom';

export type AnalyticsRange = {
  preset: AnalyticsRangeKey;
  startDate?: string;
  endDate?: string;
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  hint: string;
};

export type TrendPoint = {
  date: string;
  users: number;
  properties: number;
  aiReviews: number;
  revenue: number;
};

export type RankingItem = {
  name: string;
  value: string;
  meta: string;
};

export type FunnelStep = {
  label: string;
  count: number;
  rate: string;
};

export type AnalyticsOverview = {
  rangeLabel: string;
  cards: MetricCard[];
  trend: TrendPoint[];
  rankings: RankingItem[];
  funnel: FunnelStep[];
};

export type AnalyticsSection = {
  title: string;
  cards: MetricCard[];
  trend: TrendPoint[];
  table: RankingItem[];
};

export type LocationAnalyticsFilters = {
  city?: string;
  district?: string;
  community?: string;
  range?: AnalyticsRangeKey;
  startDate?: string;
  endDate?: string;
};

export type LocationAnalyticsItem = {
  id: string | number;
  city: string;
  district: string;
  community: string;
  name: string;
  propertyCount: number;
  communityCount: number;
  reviewCount: number;
  aiReviewCount: number;
  userCount: number;
  heatScore: number;
  favoriteCount: number;
  viewCount: number;
  favoriteAndViewCount: number;
};

export type CommunityAnalyticsItem = LocationAnalyticsItem & {
  community: string;
};

function toQuery(range: AnalyticsRange | LocationAnalyticsFilters) {
  const params = new URLSearchParams();
  Object.entries(range).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const analyticsApi = {
  getOverview: (range: AnalyticsRange) => apiClient.get<AnalyticsOverview>(`/admin/analytics/overview?${toQuery(range)}`),
  getUsers: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/users?${toQuery(range)}`),
  getProperties: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/properties?${toQuery(range)}`),
  getMembership: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/membership?${toQuery(range)}`),
  getAiReview: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/ai-review?${toQuery(range)}`),
  getLocations: (filters: LocationAnalyticsFilters) => apiClient.get<{ items: LocationAnalyticsItem[] }>(`/admin/analytics/locations?${toQuery(filters)}`),
  getCommunities: (filters: LocationAnalyticsFilters) => apiClient.get<{ items: CommunityAnalyticsItem[] }>(`/admin/analytics/communities?${toQuery(filters)}`),
};
