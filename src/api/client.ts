import { tokenStorage } from '../utils/token';

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

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskWatchlist = {
  id: string | number;
  userId: string | number;
  riskType: string;
  riskLevel: RiskLevel | string;
  reason: string;
  addedBy: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  events?: RiskEvent[];
};

export type RiskEvent = {
  id: string | number;
  watchlistId?: string | number;
  userId: string | number;
  action: 'post' | 'comment' | 'ai_call' | 'report' | string;
  summary: string;
  detail?: string;
  riskLevel?: RiskLevel | string;
  createdAt?: string;
};

export type RiskWatchlistPayload = {
  userId: string | number;
  riskType: string;
  riskLevel: RiskLevel | string;
  reason: string;
  addedBy: string;
  expiresAt?: string | null;
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
  const token = tokenStorage.get();
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

  async getOrders(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/orders${toQuery(params)}`);
    return adaptList<AdminOrder>(payload, ['orders']);
  }

  async getAiStats(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<AiStats>>(`/admin/ai-stats${toQuery(params)}`);
    return unwrapData<AiStats>(payload);
  }

  async getCommunityReports(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/community/reports${toQuery(params)}`);
    return adaptList<CommunityReport>(payload, ['reports']);
  }

  async getRiskWatchlist(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/security/watchlist${toQuery(params)}`);
    return adaptList<RiskWatchlist>(payload, ['items', 'watchlist', 'records']);
  }

  async createRiskWatchlist(payload: RiskWatchlistPayload) {
    const response = await this.post<ApiEnvelope<RiskWatchlist>>('/admin/security/watchlist', payload);
    return unwrapData<RiskWatchlist>(response);
  }

  async updateRiskWatchlist(id: string | number, payload: Partial<RiskWatchlistPayload>) {
    const response = await this.put<ApiEnvelope<RiskWatchlist>>(`/admin/security/watchlist/${id}`, payload);
    return unwrapData<RiskWatchlist>(response);
  }

  async deleteRiskWatchlist(id: string | number) {
    return this.delete<ApiEnvelope<{ success?: boolean }>>(`/admin/security/watchlist/${id}`);
  }

  async getRiskWatchlistEvents(id: string | number) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/security/watchlist/${id}/events`);
    return adaptList<RiskEvent>(payload, ['events', 'items', 'timeline']);
  }
}

export const apiClient = new ApiClient();
