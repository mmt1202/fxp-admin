import { apiClient, type ListResult } from './client';

export type RecommendationContentType = 'community_note' | 'property_review' | 'ai_report' | 'official_article';

export type RecommendationPoolStatus = 'draft' | 'online' | 'offline';

export type RecommendationPoolItem = {
  id: string;
  itemId: string;
  contentType: RecommendationContentType;
  title: string;
  summary?: string;
  coverUrl?: string;
  sortOrder: number;
  pinned: boolean;
  startsAt?: string;
  endsAt?: string;
  status?: RecommendationPoolStatus;
};

export type RecommendationPool = {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: RecommendationPoolStatus;
  items: RecommendationPoolItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type RecommendationPoolPayload = Pick<RecommendationPool, 'name' | 'code' | 'description' | 'status'>;

export type RecommendationPoolItemPayload = Omit<RecommendationPoolItem, 'id'>;

export const contentTypeLabels: Record<RecommendationContentType, string> = {
  community_note: '社区笔记',
  property_review: '房源评价',
  ai_report: 'AI 报告',
  official_article: '官方文章',
};

export const statusLabels: Record<RecommendationPoolStatus, string> = {
  draft: '草稿',
  online: '上线',
  offline: '下线',
};

function normalizePool(raw: Partial<RecommendationPool>): RecommendationPool {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    description: raw.description ?? '',
    status: raw.status ?? 'draft',
    items: Array.isArray(raw.items) ? raw.items.map((item) => ({
      id: String(item.id ?? item.itemId ?? ''),
      itemId: String(item.itemId ?? ''),
      contentType: item.contentType ?? 'community_note',
      title: String(item.title ?? ''),
      summary: item.summary ?? '',
      coverUrl: item.coverUrl ?? '',
      sortOrder: Number(item.sortOrder ?? 0),
      pinned: Boolean(item.pinned),
      startsAt: item.startsAt ?? '',
      endsAt: item.endsAt ?? '',
      status: item.status ?? raw.status ?? 'draft',
    })) : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizePools(payload: unknown): RecommendationPool[] {
  const result = payload as ListResult<Partial<RecommendationPool>> | Partial<RecommendationPool>[];
  const items = Array.isArray(result) ? result : result.items;
  return (items ?? []).map(normalizePool);
}

export const recommendationApi = {
  async getPools() {
    const payload = await apiClient.getRecommendationPools();
    return normalizePools(payload);
  },
  async createPool(data: RecommendationPoolPayload) {
    return normalizePool(await apiClient.createRecommendationPool(data));
  },
  async updatePool(id: string, data: Partial<RecommendationPoolPayload>) {
    return normalizePool(await apiClient.updateRecommendationPool(id, data));
  },
  async addPoolItem(poolId: string, data: RecommendationPoolItemPayload) {
    return apiClient.addRecommendationPoolItem(poolId, data);
  },
  async removePoolItem(poolId: string, itemId: string) {
    return apiClient.removeRecommendationPoolItem(poolId, itemId);
  },
};
