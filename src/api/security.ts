import { apiClient, type ListResult } from './client';

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

export type SecurityQuery = {
  page?: number;
  pageSize?: number;
  userId?: string;
  success?: boolean;
};

export const securityApi = {
  getLoginLogs(params?: SecurityQuery): Promise<ListResult<LoginLog>> {
    return apiClient.getLoginLogs(params);
  },
  getRiskyLogins(params?: SecurityQuery): Promise<ListResult<RiskyLogin>> {
    return apiClient.getRiskyLogins(params);
  },
  banAccount(userId: string | number) {
    return apiClient.post(`/admin/users/${userId}/ban`, { reason: '异常登录风控处置' });
  },
  watchAccount(userId: string | number) {
    return apiClient.post(`/admin/users/${userId}/watchlist`, { reason: '异常登录加入观察名单' });
  },
};
