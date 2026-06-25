import { adaptList, apiClient, unwrapData, type ApiEnvelope, type ListResult, type QueryParams } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type ExportTaskType = 'users' | 'orders' | 'reports' | 'ai_usage' | 'payment_transactions';
export type ExportTaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'expired';

export type ExportTask = {
  id: string | number;
  type: ExportTaskType;
  status: ExportTaskStatus;
  fileName?: string;
  progress?: number;
  totalRows?: number;
  exportedRows?: number;
  filters?: Record<string, unknown>;
  errorMessage?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
};

export type CreateExportTaskPayload = {
  type: ExportTaskType;
  filters?: Record<string, string | number | boolean | undefined>;
};

export const exportTaskTypeLabels: Record<ExportTaskType, string> = {
  users: '用户列表',
  orders: '订单列表',
  reports: '举报列表',
  ai_usage: 'AI 用量',
  payment_transactions: '支付流水',
};

export const exportTaskStatusLabels: Record<ExportTaskStatus, string> = {
  pending: '排队中',
  running: '导出中',
  success: '已完成',
  failed: '失败',
  expired: '已过期',
};

export const exportTasksApi = {
  async getTasks(params?: QueryParams): Promise<ListResult<ExportTask>> {
    return adaptList<ExportTask>(await apiClient.get<ApiEnvelope<unknown>>(`/admin/export/tasks${apiClient.toQuery(params)}`), ['tasks', 'items']);
  },
  async createTask(payload: CreateExportTaskPayload): Promise<ExportTask> {
    return unwrapData<ExportTask>(await apiClient.post<ApiEnvelope<ExportTask>>('/admin/export/tasks', payload));
  },
  downloadUrl(id: ExportTask['id']) {
    return `${API_BASE_URL}/admin/export/tasks/${encodeURIComponent(String(id))}/download`;
  },
};
