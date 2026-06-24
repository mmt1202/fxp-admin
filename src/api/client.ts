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
export type AdminProperty = Record<string, unknown>;
export type AdminReview = Record<string, unknown>;
export type ModerationItem = Record<string, unknown>;
export type AiCostOverview = Record<string, unknown>;
export type AiCostRecord = Record<string, unknown>;
export type AiCostByUser = Record<string, unknown>;

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

  async getProperties(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/properties${toQuery(params)}`);
    return adaptList<AdminProperty>(payload, ['properties']);
  }

  async getReviews(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/reviews${toQuery(params)}`);
    return adaptList<AdminReview>(payload, ['reviews']);
  }

  async getModerationItems(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/moderation${toQuery(params)}`);
    return adaptList<ModerationItem>(payload, ['items', 'reports']);
  }

  async getAiCostOverview(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<AiCostOverview>>(`/admin/ai/costs/overview${toQuery(params)}`);
    return unwrapData<AiCostOverview>(payload);
  }

  async getAiCostRecords(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/ai/costs/records${toQuery(params)}`);
    return adaptList<AiCostRecord>(payload, ['records', 'items']);
  }

  async getAiCostsByUser(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/ai/costs/by-user${toQuery(params)}`);
    return adaptList<AiCostByUser>(payload, ['users', 'items']);
  }
}

export const apiClient = new ApiClient();
