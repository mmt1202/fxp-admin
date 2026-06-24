import { authState } from '../state/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

type ApiEnvelope<T> = T | {
  code?: number;
  message?: string;
  data?: T;
};

export type DashboardStats = Record<string, unknown>;
export type DashboardTrendPoint = Record<string, unknown>;
export type AdminUser = Record<string, unknown>;
export type AdminOrder = Record<string, unknown>;
export type AiStats = Record<string, unknown>;
export type CommunityReport = Record<string, unknown>;
export type RecommendationPoolRecord = Record<string, unknown>;
export type Property = Record<string, unknown>;
export type Review = Record<string, unknown>;
export type UserLifecycleUser = Record<string, unknown>;
export type LifecycleStage = {
  key: string;
  label: string;
  value: number;
  description?: string;
  users?: UserLifecycleUser[];
};
export type UserLifecycle = {
  stages: LifecycleStage[];
  startDate?: string;
  endDate?: string;
};
export type ModerationReport = Record<string, unknown>;

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export type MarketingCampaign = {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  status: CampaignStatus;
  targetUsers: string;
  rewardType: string;
  rewardQuantity: number;
  triggerCondition: string;
  metrics?: {
    participants: number;
    rewardsIssued: number;
    conversions: number;
    orderAmount: number;
  };
};

export type MarketingCampaignPayload = Omit<MarketingCampaign, 'id' | 'metrics'>;
export type RecallTaskType = 'push' | 'sms' | 'in_app' | 'email';
export type RecallAudience = 'inactive_7_days' | 'inactive_30_days' | 'membership_expiring' | 'ai_quota_used' | 'property_created_no_ai';
export type RecallTaskStatus = 'draft' | 'pending' | 'running' | 'completed' | 'failed';

export type RecallTask = {
  id: string | number;
  name: string;
  type: RecallTaskType;
  audience: RecallAudience;
  title: string;
  content: string;
  status: RecallTaskStatus;
  estimatedCount?: number;
  sentCount?: number;
  successCount?: number;
  failedCount?: number;
  executedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RecallTaskPayload = Omit<RecallTask, 'id' | 'status' | 'sentCount' | 'successCount' | 'failedCount' | 'executedAt' | 'createdAt' | 'updatedAt'> & {
  status?: RecallTaskStatus;
};

export type ContentType = 'community_note' | 'comment' | 'property_review' | 'ai_report';
export type QualityRiskLevel = 'high' | 'medium' | 'low';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'adjusted';

export type ContentQualityScore = {
  contentId: string;
  contentType: ContentType;
  title: string;
  authorName?: string;
  qualityScore: number;
  riskLevel: QualityRiskLevel;
  reviewStatus: ReviewStatus;
  dimensions: {
    completeness: number;
    imageCount: number;
    textLength: number;
    sensitiveHits: number;
    reportCount: number;
    likeCount: number;
    favoriteCount: number;
    shareCount: number;
    suspectedAd: boolean;
  };
  generatedAt?: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewNote?: string;
};

export type ContentQualityList = ListResult<ContentQualityScore> & {
  highQuality: ContentQualityScore[];
  riskItems: ContentQualityScore[];
};

export type ContentQualityFilters = {
  contentType?: ContentType | 'all';
  riskLevel?: QualityRiskLevel;
  reviewStatus?: ReviewStatus;
};

export type ContentQualityReviewPayload = {
  qualityScore: number;
  reviewStatus: ReviewStatus;
  reviewNote?: string;
};
export type ListResult<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (isRecord(payload) && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function adaptList<T>(payload: unknown, collectionKeys: string[]): ListResult<T> {
  const body = unwrapData(payload);

  if (Array.isArray(body)) {
    return { items: body as T[], total: body.length };
  }

  if (!isRecord(body)) {
    return { items: [] };
  }

  const items = collectionKeys.reduce<T[] | undefined>((found, key) => found ?? asArray<T>(body[key]), undefined) ?? [];
  const total = typeof body.total === 'number' ? body.total : undefined;
  const page = typeof body.page === 'number' ? body.page : undefined;
  const pageSize = typeof body.pageSize === 'number' ? body.pageSize : undefined;

  return { items, total, page, pageSize };
}

function toQuery(params?: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers, body, ...init } = options;
  const token = authState.token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const payload = contentType?.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : response.statusText;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export class ApiClient {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, data?: unknown, options?: RequestOptions) {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    });
  }

  put<T>(path: string, data?: unknown, options?: RequestOptions) {
    return request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data ?? {}),
    });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { ...options, method: 'DELETE' });
  }

  async getDashboard() {
    return unwrapData<DashboardStats>(await this.get<ApiEnvelope<DashboardStats>>('/admin/dashboard'));
  }

  async getDashboardTrend(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<DashboardTrendPoint[] | { trend?: DashboardTrendPoint[] }>>(`/admin/dashboard/trend${toQuery(params)}`);
    const body = unwrapData(payload);
    return Array.isArray(body) ? body : asArray<DashboardTrendPoint>(isRecord(body) ? body.trend : undefined);
  }

  async getUsers(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/users${toQuery(params)}`);
    return adaptList<AdminUser>(payload, ['users']);
  }

  async getProperties(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/properties${toQuery(params)}`);
    return adaptList<Property>(payload, ['properties']);
  }

  async getReviews(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/reviews${toQuery(params)}`);
    return adaptList<Review>(payload, ['reviews']);
  }

  async getModerationReports(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/moderation/reports${toQuery(params)}`);
    return adaptList<ModerationReport>(payload, ['reports']);
  }

  async getMarketingCampaigns(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/marketing/campaigns${toQuery(params)}`);
    return adaptList<MarketingCampaign>(payload, ['campaigns', 'items']);
  }

  async createMarketingCampaign(data: MarketingCampaignPayload) {
    const payload = await this.post<ApiEnvelope<MarketingCampaign>>('/admin/marketing/campaigns', data);
    return unwrapData<MarketingCampaign>(payload);
  }

  async updateMarketingCampaign(id: string, data: MarketingCampaignPayload) {
    const payload = await this.put<ApiEnvelope<MarketingCampaign>>(`/admin/marketing/campaigns/${id}`, data);
    return unwrapData<MarketingCampaign>(payload);
  }

  async deleteMarketingCampaign(id: string) {
    return this.delete<ApiEnvelope<{ success: boolean }>>(`/admin/marketing/campaigns/${id}`);
  }

  async updateMarketingCampaignStatus(id: string, status: CampaignStatus) {
    const payload = await this.put<ApiEnvelope<MarketingCampaign>>(`/admin/marketing/campaigns/${id}/status`, { status });
    return unwrapData<MarketingCampaign>(payload);
  }

  async getRecommendationPools(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/recommendation/pools${toQuery(params)}`);
    return adaptList<RecommendationPoolRecord>(payload, ['pools', 'recommendationPools']);
  }

  async createRecommendationPool(data: unknown) {
    const payload = await this.post<ApiEnvelope<RecommendationPoolRecord>>('/admin/recommendation/pools', data);
    return unwrapData<RecommendationPoolRecord>(payload);
  }

  async updateRecommendationPool(id: string, data: unknown) {
    const payload = await this.put<ApiEnvelope<RecommendationPoolRecord>>(`/admin/recommendation/pools/${id}`, data);
    return unwrapData<RecommendationPoolRecord>(payload);
  }

  async addRecommendationPoolItem(poolId: string, data: unknown) {
    const payload = await this.post<ApiEnvelope<RecommendationPoolRecord>>(`/admin/recommendation/pools/${poolId}/items`, data);
    return unwrapData<RecommendationPoolRecord>(payload);
  }

  async removeRecommendationPoolItem(poolId: string, itemId: string) {
    const payload = await this.delete<ApiEnvelope<{ success?: boolean }>>(`/admin/recommendation/pools/${poolId}/items/${itemId}`);
    return unwrapData<{ success?: boolean }>(payload);
  }
  async getRecallTasks(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/marketing/recall-tasks${toQuery(params)}`);
    return adaptList<RecallTask>(payload, ['tasks', 'recallTasks', 'items']);
  }

  async createRecallTask(data: RecallTaskPayload) {
    const payload = await this.post<ApiEnvelope<RecallTask>>('/admin/marketing/recall-tasks', data);
    return unwrapData<RecallTask>(payload);
  }

  async updateRecallTask(id: RecallTask['id'], data: RecallTaskPayload) {
    const payload = await this.put<ApiEnvelope<RecallTask>>(`/admin/marketing/recall-tasks/${id}`, data);
    return unwrapData<RecallTask>(payload);
  }

  async executeRecallTask(id: RecallTask['id']) {
    const payload = await this.post<ApiEnvelope<RecallTask>>(`/admin/marketing/recall-tasks/${id}/execute`);
    return unwrapData<RecallTask>(payload);
  }

  async getUserLifecycle(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/analytics/user-lifecycle${toQuery(params)}`);
    const body = unwrapData(payload);

    if (Array.isArray(body)) {
      return { stages: body as LifecycleStage[] };
    }

    if (isRecord(body)) {
      const stages = Array.isArray(body.stages)
        ? body.stages as LifecycleStage[]
        : Array.isArray(body.lifecycle)
          ? body.lifecycle as LifecycleStage[]
          : Object.entries(body)
              .filter(([, value]) => typeof value === 'number')
              .map(([key, value]) => ({ key, label: key, value: value as number }));

      return {
        stages,
        startDate: typeof body.startDate === 'string' ? body.startDate : undefined,
        endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
      };
    }

    return { stages: [] };
  }

  async getUserLifecycleUsers(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/analytics/user-lifecycle/users${toQuery(params)}`);
    return adaptList<UserLifecycleUser>(payload, ['users', 'items']);
  }

  async getContentQuality(params?: ContentQualityFilters) {
    const query = {
      ...params,
      contentType: params?.contentType === 'all' ? undefined : params?.contentType,
    };
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/content-quality${toQuery(query)}`);
    const body = unwrapData(payload);
    const list = adaptList<ContentQualityScore>(payload, ['items', 'scores', 'contentQuality']);

    return {
      ...list,
      highQuality: isRecord(body) ? asArray<ContentQualityScore>(body.highQuality) : [],
      riskItems: isRecord(body) ? asArray<ContentQualityScore>(body.riskItems) : [],
    };
  }

  async getContentQualityDetail(contentId: string) {
    const payload = await this.get<ApiEnvelope<ContentQualityScore>>(`/admin/content-quality/${contentId}`);
    return unwrapData<ContentQualityScore>(payload);
  }

  async reviewContentQuality(contentId: string, data: ContentQualityReviewPayload) {
    const payload = await this.put<ApiEnvelope<ContentQualityScore>>(`/admin/content-quality/${contentId}/review`, data);
    return unwrapData<ContentQualityScore>(payload);
  }
}

export const apiClient = new ApiClient();
