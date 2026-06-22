import { apiClient } from './client';

export type ReportListItem = {
  id: string;
  title: string;
  period: string;
};

export function getReports() {
  return apiClient.get<ReportListItem[]>('/admin/reports');
}
