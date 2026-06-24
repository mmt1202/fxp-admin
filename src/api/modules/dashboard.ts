import { apiClient, QueryParams } from '../client';

export interface DashboardStats {
  userCount: number;
  houseCount: number;
  reviewCount: number;
  pendingReportCount: number;
  activeUserCount: number;
  newUserCount: number;
  newHouseCount: number;
  newReviewCount: number;
}

export function getDashboardStats(query?: QueryParams) {
  return apiClient.get<DashboardStats>('/dashboard/stats', { query });
}
