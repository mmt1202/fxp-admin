import { apiClient } from './client';

export type DashboardSummary = {
  users: number;
  orders: number;
  aiCalls: number;
  conversionRate: number;
};

export function getDashboardSummary() {
  return apiClient.get<DashboardSummary>('/admin/dashboard/summary');
}
