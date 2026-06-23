import { apiClient, type ListResult } from './client';

export type ArticleStatus = 'draft' | 'published' | 'offline';

export type OfficialArticle = {
  id: string | number;
  title: string;
  coverImage?: string;
  summary?: string;
  content: string;
  category?: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OfficialArticleInput = Omit<OfficialArticle, 'id' | 'createdAt' | 'updatedAt'>;

export type ArticleQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: ArticleStatus | 'all';
  category?: string;
};

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function normalizeArticle(value: unknown): OfficialArticle {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

  return {
    id: String(record.id ?? record._id ?? ''),
    title: String(record.title ?? ''),
    coverImage: String(record.coverImage ?? record.coverUrl ?? ''),
    summary: String(record.summary ?? ''),
    content: String(record.content ?? record.body ?? ''),
    category: String(record.category ?? ''),
    tags: normalizeTags(record.tags),
    status: (record.status === 'published' || record.status === 'offline' ? record.status : 'draft') as ArticleStatus,
    publishedAt: record.publishedAt ? String(record.publishedAt) : undefined,
    author: String(record.author ?? ''),
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
  };
}

export const cmsApi = {
  async getArticles(params?: ArticleQuery): Promise<ListResult<OfficialArticle>> {
    const payload = await apiClient.get<unknown>(`/admin/cms/articles${toQuery(params)}`);
    const body = unwrapPayload(payload);
    const list = Array.isArray(body) ? body : findCollection(body);

    return {
      items: list.map(normalizeArticle),
      total: getNumber(body, 'total') ?? list.length,
      page: getNumber(body, 'page'),
      pageSize: getNumber(body, 'pageSize'),
    };
  },

  async createArticle(data: OfficialArticleInput) {
    return normalizeArticle(unwrapPayload(await apiClient.post<unknown>('/admin/cms/articles', data)));
  },

  async updateArticle(id: OfficialArticle['id'], data: OfficialArticleInput) {
    return normalizeArticle(unwrapPayload(await apiClient.put<unknown>(`/admin/cms/articles/${id}`, data)));
  },

  async deleteArticle(id: OfficialArticle['id']) {
    return apiClient.delete<void>(`/admin/cms/articles/${id}`);
  },

  async updateArticleStatus(id: OfficialArticle['id'], status: ArticleStatus) {
    return normalizeArticle(unwrapPayload(await apiClient.put<unknown>(`/admin/cms/articles/${id}/status`, { status })));
  },
};

function toQuery(params?: ArticleQuery) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function unwrapPayload(payload: unknown): unknown {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function findCollection(value: unknown): unknown[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const record = value as Record<string, unknown>;
  const keys = ['items', 'articles', 'list', 'rows'];
  const found = keys.map((key) => record[key]).find(Array.isArray);
  return Array.isArray(found) ? found : [];
}

function getNumber(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === 'number' ? raw : undefined;
}
