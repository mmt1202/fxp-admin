import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { AdminModuleKey } from '../routes/modules';

type ModulePageProps = {
  title: string;
  description: string;
  module: Exclude<AdminModuleKey, 'ai-review'>;
};

type LoadState = {
  loading: boolean;
  error?: string;
  data?: unknown;
};

const moduleLoaders: Record<Exclude<AdminModuleKey, 'ai-review'>, () => Promise<unknown>> = {
  dashboard: async () => {
    const [stats, trend] = await Promise.all([
      apiClient.getDashboard(),
      apiClient.getDashboardTrend(),
    ]);

    return { stats, trend };
  },
  users: () => apiClient.getUsers(),
  orders: () => apiClient.getOrders(),
  'ai-stats': () => apiClient.getAiStats(),
  'community-reports': () => apiClient.getCommunityReports(),
};

export function ModulePage({ title, description, module }: ModulePageProps) {
  const [state, setState] = useState<LoadState>({ loading: true });
  const loader = useMemo(() => moduleLoaders[module], [module]);

  useEffect(() => {
    let ignore = false;

    queueMicrotask(() => {
      if (!ignore) {
        setState({ loading: true });
      }
    });
    loader()
      .then((data) => {
        if (!ignore) {
          setState({ loading: false, data });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setState({ loading: false, error: error instanceof Error ? error.message : '接口请求失败' });
        }
      });

    return () => {
      ignore = true;
    };
  }, [loader]);

  return (
    <div className="module-page">
      <p className="eyebrow">真实后台接口</p>
      <h1>{title}</h1>
      <p>{description}</p>

      {state.loading && <div className="api-panel">正在加载接口数据...</div>}
      {state.error && <div className="api-panel error">{state.error}</div>}
      {!state.loading && !state.error && (
        <pre className="api-panel">{JSON.stringify(state.data, null, 2)}</pre>
      )}
    </div>
  );
}
