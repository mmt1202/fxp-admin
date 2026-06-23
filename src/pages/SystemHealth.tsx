import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getSystemHealth,
  healthCheckLabels,
  type HealthCheckItem,
  type HealthCheckKey,
  type HealthStatus,
  type SystemHealthResponse,
} from '../api/systemHealth';

const statusMeta: Record<HealthStatus, { label: string; className: string; summary: string }> = {
  healthy: { label: '正常', className: 'status-healthy', summary: '所有关键依赖运行正常' },
  warning: { label: '告警', className: 'status-warning', summary: '存在配置缺失或性能告警' },
  error: { label: '异常', className: 'status-error', summary: '存在不可用的关键服务' },
};

const expectedCheckKeys = Object.keys(healthCheckLabels) as HealthCheckKey[];

function formatCheckedAt(value?: string) {
  if (!value) return '尚未检查';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function HealthStatusBadge({ status }: { status: HealthStatus }) {
  const meta = statusMeta[status];
  return <span className={`health-badge ${meta.className}`}>{meta.label}</span>;
}

function HealthCheckCard({ check }: { check: HealthCheckItem }) {
  return (
    <article className={`health-check-card ${statusMeta[check.status].className}`}>
      <div className="health-check-heading">
        <div>
          <h3>{check.name}</h3>
          <p>{check.durationMs} ms</p>
        </div>
        <HealthStatusBadge status={check.status} />
      </div>
      {check.error ? <p className="health-error">{check.error}</p> : <p className="health-ok">未发现异常</p>}
    </article>
  );
}

function createMissingCheck(key: HealthCheckKey): HealthCheckItem {
  return {
    key,
    name: healthCheckLabels[key],
    status: 'warning',
    durationMs: 0,
    error: '后端健康检查响应缺少该检查项',
  };
}

export function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await getSystemHealth();
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '系统健康检查请求失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => loadHealth(true), [loadHealth]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialHealth() {
      try {
        const result = await getSystemHealth();
        if (isMounted) {
          setHealth(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '系统健康检查请求失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleChecks = useMemo(() => {
    const checks = health?.checks ?? [];
    const checkMap = new Map(checks.map((check) => [check.key, check]));
    const normalizedChecks = expectedCheckKeys.map((key) => checkMap.get(key) ?? createMissingCheck(key));
    const unknownChecks = checks.filter((check) => !expectedCheckKeys.includes(check.key as HealthCheckKey));
    return [...normalizedChecks, ...unknownChecks];
  }, [health]);
  const currentStatus = health?.status ?? 'warning';

  return (
    <div className="system-health-page">
      <div className="health-hero">
        <div>
          <p className="eyebrow">系统监控</p>
          <h1>系统健康检查</h1>
          <p>聚合 API、数据库、Redis、BullMQ、AI、支付回调与推送服务配置状态。</p>
        </div>
        <button type="button" onClick={refresh} disabled={isLoading}>
          {isLoading ? '刷新中…' : '手动刷新'}
        </button>
      </div>

      {error ? <div className="health-alert">{error}</div> : null}

      <section className={`health-summary ${statusMeta[currentStatus].className}`}>
        <div>
          <span>整体状态</span>
          <strong>{statusMeta[currentStatus].label}</strong>
          <p>{statusMeta[currentStatus].summary}</p>
        </div>
        <div>
          <span>检查时间</span>
          <strong>{formatCheckedAt(health?.checkedAt)}</strong>
          <p>{visibleChecks.length} 个检查项</p>
        </div>
      </section>

      <section className="health-grid" aria-busy={isLoading}>
        {visibleChecks.length > 0 ? (
          visibleChecks.map((check) => <HealthCheckCard key={check.key} check={check} />)
        ) : (
          <div className="health-empty">暂无健康检查数据，请手动刷新或确认后端接口 GET /admin/system/health 已启用。</div>
        )}
      </section>
    </div>
  );
}
