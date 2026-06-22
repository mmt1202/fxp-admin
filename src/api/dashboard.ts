import { apiClient } from './client';

export type DashboardSummary = {
  users: number;
  orders: number;
  aiCalls: number;
  revenue: number;
};

export function fetchDashboardSummary() {
  return apiClient.get<DashboardSummary>('/admin/dashboard/summary');
}
