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

export type PaymentChannel = 'wechat' | 'alipay' | 'stripe' | 'apple_pay' | 'manual' | string;
export type PaymentRecord = {
  id?: string | number;
  localOrderNo?: string;
  orderNo?: string;
  thirdPartyTransactionNo?: string;
  transactionNo?: string;
  channel?: PaymentChannel;
  amount?: number;
  paidAmount?: number;
  localStatus?: string;
  thirdPartyStatus?: string;
  paidAt?: string;
  createdAt?: string;
};
export type ReconciliationRecord = PaymentRecord & {
  differenceReason?: string;
  diffReason?: string;
  result?: 'success' | 'failed' | 'exception' | string;
  reconciledAt?: string;
};
export type ReconciliationSummary = {
  success: number;
  failed: number;
  exception: number;
  total?: number;
};
export type ReconciliationResult = ListResult<ReconciliationRecord> & {
  summary: ReconciliationSummary;
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

export type QueryParams = Record<string, string | number | boolean | undefined>;

function toQuery(params?: QueryParams) {
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

  async getDashboardTrend(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<DashboardTrendPoint[] | { trend?: DashboardTrendPoint[] }>>(`/admin/dashboard/trend${toQuery(params)}`);
    const body = unwrapData(payload);
    return Array.isArray(body) ? body : asArray<DashboardTrendPoint>(isRecord(body) ? body.trend : undefined);
  }

  async getUsers(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/users${toQuery(params)}`);
    return adaptList<AdminUser>(payload, ['users']);
  }

  async getOrders(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/orders${toQuery(params)}`);
    return adaptList<AdminOrder>(payload, ['orders']);
  }

  async getAiStats(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<AiStats>>(`/admin/ai-stats${toQuery(params)}`);
    return unwrapData<AiStats>(payload);
  }

  async getCommunityReports(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/community/reports${toQuery(params)}`);
    return adaptList<CommunityReport>(payload, ['reports']);
  }

  async getPaymentRecords(params?: QueryParams) {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/finance/payment-records${toQuery(params)}`);
    return adaptList<PaymentRecord>(payload, ['items', 'records', 'paymentRecords']);
  }

  async getReconciliation(params?: QueryParams): Promise<ReconciliationResult> {
    const payload = await this.get<ApiEnvelope<unknown>>(`/admin/finance/reconciliation${toQuery(params)}`);
    const list = adaptList<ReconciliationRecord>(payload, ['items', 'records', 'reconciliationRecords']);
    const body = unwrapData(payload);
    const summary = isRecord(body) && isRecord(body.summary)
      ? {
        success: Number(body.summary.success ?? 0),
        failed: Number(body.summary.failed ?? 0),
        exception: Number(body.summary.exception ?? 0),
        total: typeof body.summary.total === 'number' ? body.summary.total : list.total,
      }
      : list.items.reduce<ReconciliationSummary>((acc, item) => {
        const result = item.result ?? (item.differenceReason || item.diffReason ? 'exception' : item.localStatus);
        if (result === 'success' || result === 'paid' || result === 'matched') acc.success += 1;
        else if (result === 'failed' || result === 'fail') acc.failed += 1;
        else acc.exception += 1;
        acc.total = (acc.total ?? 0) + 1;
        return acc;
      }, { success: 0, failed: 0, exception: 0, total: 0 });

    return { ...list, summary };
  }

  async runReconciliation(params?: QueryParams) {
    const payload = await this.post<ApiEnvelope<unknown>>('/admin/finance/reconciliation/run', params ?? {});
    return unwrapData(payload);
  }

  async repairReconciliation(orderNo: string) {
    const payload = await this.post<ApiEnvelope<unknown>>('/admin/finance/reconciliation/repair', { orderNo });
    return unwrapData(payload);
  }
}

export const apiClient = new ApiClient();
