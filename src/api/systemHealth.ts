import { apiClient } from './client';

export type HealthStatus = 'healthy' | 'warning' | 'error';
export type BackendHealthStatus = HealthStatus | 'ok' | 'degraded' | 'down';

export type HealthCheckKey =
  | 'api'
  | 'database'
  | 'redis'
  | 'bullmq'
  | 'ai'
  | 'payment_callback'
  | 'push_service';

export type RawHealthCheckItem = {
  key: HealthCheckKey | string;
  name?: string;
  label?: string;
  status: BackendHealthStatus;
  durationMs?: number;
  latencyMs?: number;
  responseTimeMs?: number;
  error?: string | null;
  message?: string | null;
};

export type RawSystemHealthResponse = {
  status: BackendHealthStatus;
  checkedAt?: string;
  timestamp?: string;
  checks: RawHealthCheckItem[];
};

export type HealthCheckItem = {
  key: HealthCheckKey | string;
  name: string;
  status: HealthStatus;
  durationMs: number;
  error?: string | null;
};

export type SystemHealthResponse = {
  status: HealthStatus;
  checkedAt: string;
  checks: HealthCheckItem[];
};

const checkLabels: Record<HealthCheckKey, string> = {
  api: 'API 服务状态',
  database: '数据库连接',
  redis: 'Redis 连接',
  bullmq: 'BullMQ 队列状态',
  ai: 'AI 服务可用性',
  payment_callback: '支付回调配置',
  push_service: '推送服务配置',
};

function normalizeStatus(status: BackendHealthStatus): HealthStatus {
  if (status === 'ok') return 'healthy';
  if (status === 'degraded') return 'warning';
  if (status === 'down') return 'error';
  return status;
}

function normalizeHealthResponse(response: RawSystemHealthResponse): SystemHealthResponse {
  return {
    status: normalizeStatus(response.status),
    checkedAt: response.checkedAt ?? response.timestamp ?? new Date().toISOString(),
    checks: response.checks.map((check) => ({
      key: check.key,
      name: check.name ?? check.label ?? checkLabels[check.key as HealthCheckKey] ?? check.key,
      status: normalizeStatus(check.status),
      durationMs: check.durationMs ?? check.latencyMs ?? check.responseTimeMs ?? 0,
      error: check.error ?? check.message ?? null,
    })),
  };
}

export function getSystemHealth() {
  return apiClient.get<RawSystemHealthResponse>('/admin/system/health').then(normalizeHealthResponse);
}

export const healthCheckLabels = checkLabels;
