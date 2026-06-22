import { apiClient } from './client';

export type OperationLogValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type AdminOperationLog = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeValue: OperationLogValue;
  afterValue: OperationLogValue;
  ip: string;
  userAgent: string;
  createdAt: string;
};

export type OperationLogFilters = {
  page?: number;
  pageSize?: number;
  adminId?: string;
  adminName?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startTime?: string;
  endTime?: string;
};

export type OperationLogsResponse = {
  items: AdminOperationLog[];
  total: number;
  page: number;
  pageSize: number;
};

function toQueryString(filters: OperationLogFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function getOperationLogs(filters: OperationLogFilters) {
  const query = toQueryString(filters);
  return apiClient.get<OperationLogsResponse>(`/admin/operation-logs${query ? `?${query}` : ''}`);
}
