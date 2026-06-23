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

function toQuery(range: AnalyticsRange) {
  const params = new URLSearchParams({ preset: range.preset });
  if (range.startDate) params.set('startDate', range.startDate);
  if (range.endDate) params.set('endDate', range.endDate);
  return params.toString();
}

export const analyticsApi = {
  getOverview: (range: AnalyticsRange) => apiClient.get<AnalyticsOverview>(`/admin/analytics/overview?${toQuery(range)}`),
  getUsers: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/users?${toQuery(range)}`),
  getProperties: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/properties?${toQuery(range)}`),
  getMembership: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/membership?${toQuery(range)}`),
  getAiReview: (range: AnalyticsRange) => apiClient.get<AnalyticsSection>(`/admin/analytics/ai-review?${toQuery(range)}`),
};
