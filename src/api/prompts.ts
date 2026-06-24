import { apiClient, type ListResult } from './client';

export type AiPromptStatus = 'draft' | 'published' | 'archived';

export type AiPromptTemplate = {
  id: string | number;
  name: string;
  type: string;
  content: string;
  version: string;
  status: AiPromptStatus | string;
  creator?: string;
  createdBy?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rollbackFromVersion?: string;
};

export type AiPromptPayload = {
  name: string;
  type: string;
  content: string;
  version: string;
  status?: AiPromptStatus | string;
};

type PromptListBody = ListResult<AiPromptTemplate> | AiPromptTemplate[] | { prompts?: AiPromptTemplate[]; items?: AiPromptTemplate[]; total?: number };

function normalizeList(body: PromptListBody): ListResult<AiPromptTemplate> {
  if (Array.isArray(body)) {
    return { items: body, total: body.length };
  }

  if ('items' in body && Array.isArray(body.items)) {
    return body as ListResult<AiPromptTemplate>;
  }

  const prompts = 'prompts' in body && Array.isArray(body.prompts) ? body.prompts : [];
  return { items: prompts, total: body.total ?? prompts.length };
}

export const aiPromptApi = {
  async list(params?: Record<string, string | number | boolean | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return normalizeList(await apiClient.get<PromptListBody>(`/admin/ai/prompts${suffix}`));
  },

  create(payload: AiPromptPayload) {
    return apiClient.post<AiPromptTemplate>('/admin/ai/prompts', payload);
  },

  update(id: AiPromptTemplate['id'], payload: AiPromptPayload) {
    return apiClient.put<AiPromptTemplate>(`/admin/ai/prompts/${id}`, payload);
  },

  publish(id: AiPromptTemplate['id']) {
    return apiClient.post<AiPromptTemplate>(`/admin/ai/prompts/${id}/publish`);
  },

  rollback(id: AiPromptTemplate['id']) {
    return apiClient.post<AiPromptTemplate>(`/admin/ai/prompts/${id}/rollback`);
  },
};
