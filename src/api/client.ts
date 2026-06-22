import { tokenStorage } from '../utils/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export type DashboardStats = Record<string, unknown>;
export type DashboardTrendPoint = Record<string, unknown>;
export type AdminListResult<T = Record<string, unknown>> = {
  items: T[];
  total?: number;
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
  if (isObject(payload) && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function adaptDashboard(payload: unknown): DashboardStats {
  const body = unwrapEnvelope(payload);
  return isObject(body) ? body : { value: body };
}

function adaptDashboardTrend(payload: unknown): DashboardTrendPoint[] {
  const body = unwrapEnvelope(payload);

  if (Array.isArray(body)) {
    return body.filter(isObject);
  }

  if (isObject(body) && Array.isArray(body.trend)) {
    return body.trend.filter(isObject);
  }

  if (isObject(body) && Array.isArray(body.items)) {
    return body.items.filter(isObject);
  }

  return [];
}

function adaptUsers(payload: unknown): AdminListResult {
  const body = unwrapEnvelope(payload);

  if (Array.isArray(body)) {
    return { items: body.filter(isObject), total: body.length };
  }

  if (isObject(body)) {
    const users = Array.isArray(body.users) ? body.users.filter(isObject) : [];
    const total = typeof body.total === 'number' ? body.total : users.length;
    return { items: users, total };
  }

  return { items: [] };
}

function adaptOrders(payload: unknown): AdminListResult {
  const body = unwrapEnvelope(payload);

  if (Array.isArray(body)) {
    return { items: body.filter(isObject), total: body.length };
  }

  if (isObject(body)) {
    const orders = Array.isArray(body.orders) ? body.orders.filter(isObject) : [];
    const total = typeof body.total === 'number' ? body.total : orders.length;
    return { items: orders, total };
  }

  return { items: [] };
}

function adaptAiStats(payload: unknown): DashboardStats {
  const body = unwrapEnvelope(payload);
  return isObject(body) ? body : { value: body };
}

function adaptCommunityReports(payload: unknown): AdminListResult {
  const body = unwrapEnvelope(payload);

  if (Array.isArray(body)) {
    return { items: body.filter(isObject), total: body.length };
  }

  if (isObject(body)) {
    const reports = Array.isArray(body.reports) ? body.reports.filter(isObject) : [];
    const total = typeof body.total === 'number' ? body.total : reports.length;
    return { items: reports, total };
  }

  return { items: [] };
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
    return adaptDashboard(await this.get<unknown>('/admin/dashboard'));
  }

  async getDashboardTrend() {
    return adaptDashboardTrend(await this.get<unknown>('/admin/dashboard/trend'));
  }

  async getUsers() {
    return adaptUsers(await this.get<unknown>('/admin/users'));
  }

  async getOrders() {
    return adaptOrders(await this.get<unknown>('/admin/orders'));
  }

  async getAiStats() {
    return adaptAiStats(await this.get<unknown>('/admin/ai-stats'));
  }

  async getCommunityReports() {
    return adaptCommunityReports(await this.get<unknown>('/admin/community/reports'));
  }
}

export const apiClient = new ApiClient();
