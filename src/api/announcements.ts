import { apiClient, type ListResult } from './client';

export type AdminAnnouncementStatus = 'draft' | 'published' | 'offline';

export type AdminAnnouncement = {
  id: string | number;
  title: string;
  content: string;
  status: AdminAnnouncementStatus;
  pinned: boolean;
  visibleRoles: string[];
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAnnouncementInput = Omit<AdminAnnouncement, 'id' | 'createdAt' | 'updatedAt'>;

export type AdminAnnouncementQuery = {
  keyword?: string;
  status?: AdminAnnouncementStatus | 'all';
  role?: string;
  page?: number;
  pageSize?: number;
};

export const announcementStatusLabels: Record<AdminAnnouncementStatus, string> = {
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
};

export const adminAnnouncementsApi = {
  async list(params?: AdminAnnouncementQuery): Promise<ListResult<AdminAnnouncement>> {
    const payload = await apiClient.get<unknown>(`/admin/announcements${toQuery(params)}`);
    const body = unwrapPayload(payload);
    const list = Array.isArray(body) ? body : findCollection(body);

    return {
      items: list.map(normalizeAnnouncement),
      total: getNumber(body, 'total') ?? list.length,
      page: getNumber(body, 'page'),
      pageSize: getNumber(body, 'pageSize'),
    };
  },

  async create(data: AdminAnnouncementInput) {
    return normalizeAnnouncement(unwrapPayload(await apiClient.post<unknown>('/admin/announcements', data)));
  },

  async update(id: AdminAnnouncement['id'], data: AdminAnnouncementInput) {
    return normalizeAnnouncement(unwrapPayload(await apiClient.put<unknown>(`/admin/announcements/${id}`, data)));
  },

  async delete(id: AdminAnnouncement['id']) {
    return apiClient.delete<void>(`/admin/announcements/${id}`);
  },
};

function normalizeAnnouncement(value: unknown): AdminAnnouncement {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const rawStatus = String(record.status ?? 'draft');

  return {
    id: String(record.id ?? record._id ?? ''),
    title: String(record.title ?? ''),
    content: String(record.content ?? record.body ?? ''),
    status: rawStatus === 'published' || rawStatus === 'offline' ? rawStatus : 'draft',
    pinned: Boolean(record.pinned ?? record.isPinned ?? false),
    visibleRoles: normalizeStringList(record.visibleRoles ?? record.roles ?? record.targetRoles),
    author: record.author ? String(record.author) : undefined,
    publishedAt: record.publishedAt ? String(record.publishedAt) : undefined,
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
  };
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function toQuery(params?: AdminAnnouncementQuery) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function unwrapPayload(payload: unknown): unknown {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) return (payload as { data: unknown }).data;
  return payload;
}

function findCollection(value: unknown): unknown[] {
  if (typeof value !== 'object' || value === null) return [];
  const record = value as Record<string, unknown>;
  const found = ['items', 'announcements', 'list', 'rows'].map((key) => record[key]).find(Array.isArray);
  return Array.isArray(found) ? found : [];
}

function getNumber(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null) return undefined;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === 'number' ? raw : undefined;
}
