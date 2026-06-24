import { apiClient, adaptList, type ApiEnvelope, type ListResult, type QueryParams } from './client';

export type LoginLog = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  loginMethod?: string;
  ip?: string;
  device?: string;
  city?: string;
  success?: boolean;
  failureReason?: string;
  createdAt?: string;
  riskTags?: string[];
};

export type RiskyLogin = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  riskType?: 'short_term_failures' | 'remote_login' | 'multi_account_device' | 'frequent_device_switch' | string;
  riskLevel?: 'low' | 'medium' | 'high' | string;
  description?: string;
  ip?: string;
  device?: string;
  city?: string;
  occurredAt?: string;
  status?: 'pending' | 'watching' | 'banned' | 'ignored' | string;
};

export type SecurityQuery = QueryParams & {
  page?: number;
  pageSize?: number;
  userId?: string;
  success?: boolean;
};

export const securityApi = {
  async getLoginLogs(params?: SecurityQuery): Promise<ListResult<LoginLog>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/security/login-logs${apiClient.toQuery(params)}`);
    return adaptList<LoginLog>(payload, ['items', 'logs', 'loginLogs']);
  },
  async getRiskyLogins(params?: SecurityQuery): Promise<ListResult<RiskyLogin>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/security/risky-logins${apiClient.toQuery(params)}`);
    return adaptList<RiskyLogin>(payload, ['items', 'risks', 'riskyLogins']);
  },
  banAccount(userId: string | number) {
    return apiClient.post(`/admin/users/${userId}/ban`, { reason: '异常登录风控处置' });
  },
  watchAccount(userId: string | number) {
    return apiClient.post(`/admin/users/${userId}/watchlist`, { reason: '异常登录加入观察名单' });
  },
};
