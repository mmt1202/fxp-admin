import { apiClient } from './client';

export type ReportRecord = {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
};

export function fetchReports() {
  return apiClient.get<ReportRecord[]>('/admin/reports');
}
