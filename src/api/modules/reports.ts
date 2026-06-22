import { apiClient, PageResult, QueryParams } from '../client';

export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';
export type ReportTargetType = 'user' | 'house' | 'review';

export interface ReportSummary {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface HandleReportPayload {
  status: ReportStatus;
  action?: string;
  remark?: string;
}

export interface ReportDetail extends ReportSummary {
  description?: string;
  evidenceUrls: string[];
  handledBy?: string;
  handledAt?: string;
  remark?: string;
}

export function getReports(query?: QueryParams) {
  return apiClient.get<PageResult<ReportSummary>>('/reports', { query });
}

export function handleReport(reportId: string, payload: HandleReportPayload) {
  return apiClient.patch<ReportDetail>(`/reports/${reportId}/handle`, payload);
}
