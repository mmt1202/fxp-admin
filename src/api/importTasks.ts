import { adaptList, apiClient, type ListResult } from './client';
import { useAuthStore } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type ImportType = 'community_library' | 'sensitive_words' | 'blacklist' | 'whitelist' | 'city_config';
export type ImportTaskStatus = 'previewed' | 'pending' | 'running' | 'completed' | 'failed' | 'partially_failed';

export type ImportPreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  valid: boolean;
  errors: string[];
};

export type ImportTask = {
  id: string;
  type: ImportType;
  fileName: string;
  status: ImportTaskStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAt: string;
  createdBy?: string;
  previewRows?: ImportPreviewRow[];
  errorFileUrl?: string;
};

export type ImportTaskError = {
  rowNumber: number;
  field?: string;
  message: string;
  raw?: Record<string, string>;
};

export type CreateImportTaskOptions = {
  type: ImportType;
  file: File;
  previewOnly?: boolean;
};

export const importTypeText: Record<ImportType, string> = {
  community_library: '小区库',
  sensitive_words: '敏感词',
  blacklist: '黑名单',
  whitelist: '白名单',
  city_config: '城市配置',
};

export const importTaskApi = {
  async createTask({ type, file, previewOnly = true }: CreateImportTaskOptions) {
    const formData = new FormData();
    formData.set('type', type);
    formData.set('file', file);
    formData.set('previewOnly', String(previewOnly));

    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE_URL}/admin/import/tasks`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(typeof payload?.message === 'string' ? payload.message : '导入任务创建失败');
    }
    return (payload?.data ?? payload) as ImportTask;
  },

  async listTasks(params?: { type?: ImportType | 'all'; status?: ImportTaskStatus | 'all' }) {
    const payload = await apiClient.get<unknown>('/admin/import/tasks', {
      query: {
        type: params?.type && params.type !== 'all' ? params.type : undefined,
        status: params?.status && params.status !== 'all' ? params.status : undefined,
      },
    });
    return adaptList<ImportTask>(payload, ['items', 'tasks', 'list']) as ListResult<ImportTask>;
  },

  async listErrors(id: string) {
    const payload = await apiClient.get<unknown>(`/admin/import/tasks/${id}/errors`);
    return adaptList<ImportTaskError>(payload, ['items', 'errors', 'list']);
  },
};
