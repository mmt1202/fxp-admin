import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { AdminListResult, DashboardStats, DashboardTrendPoint } from '../api/client';
import { adminModuleStatusLabels, type AdminModuleKey, type AdminModuleStatus } from '../routes/modules';

type ModulePageProps = {
  title: string;
  description: string;
  module?: AdminModuleKey;
  status?: AdminModuleStatus;
  permission?: string;
};

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: unknown };

const moduleLoaders: Partial<Record<AdminModuleKey, () => Promise<unknown>>> = {
  dashboard: async () => ({ stats: await apiClient.getDashboard(), trend: await apiClient.getDashboardTrend() }),
  users: () => apiClient.getUsers(),
  properties: () => apiClient.getProperties(),
  reviews: () => apiClient.getReviews(),
  moderation: () => apiClient.getModerationReports(),
  reports: () => apiClient.getCommunityReports(),
  orders: () => apiClient.getOrders(),
  'ai-stats': () => apiClient.getAiStats(),
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function DataGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p className="empty-state">暂无数据</p>;
  return <div className="placeholder-grid data-grid">{entries.map(([key, value]) => <div key={key}><strong>{key}</strong><span>{formatValue(value)}</span></div>)}</div>;
}

function DataTable({ result }: { result: AdminListResult }) {
  const items = Array.isArray(result.items) ? result.items : [];
  const columns = Array.from(new Set(items.flatMap((item) => Object.keys(item)))).slice(0, 8);
  return <div className="table-wrap"><p className="table-summary">共 {result.total ?? items.length} 条</p>{items.length ? <table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={String(item.id ?? item._id ?? index)}>{columns.map((column) => <td key={column}>{formatValue(item[column])}</td>)}</tr>)}</tbody></table> : <p className="empty-state">暂无数据</p>}</div>;
}

function TrendList({ points }: { points: DashboardTrendPoint[] }) {
  if (!points.length) return <p className="empty-state">暂无趋势数据</p>;
  return <div className="trend-list">{points.slice(0, 12).map((point, index) => <pre key={String(point.date ?? point.day ?? index)}>{JSON.stringify(point, null, 2)}</pre>)}</div>;
}

export function ModulePage({ title, description, module = 'dashboard', status = 'backend-missing' }: ModulePageProps) {
  const loader = useMemo(() => moduleLoaders[module], [module]);
  const [state, setState] = useState<PageState>(loader ? { status: 'loading' } : { status: 'ready', data: null });

  useEffect(() => {
    if (!loader) {
      queueMicrotask(() => setState({ status: 'ready', data: null }));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => !cancelled && setState({ status: 'loading' }));
    loader()
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch((error: unknown) => !cancelled && setState({ status: 'error', message: error instanceof Error ? error.message : '加载失败' }));
    return () => { cancelled = true; };
  }, [loader]);

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <p className="eyebrow">后台模块</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className={`module-status-badge status-${status}`}>{adminModuleStatusLabels[status]}</span>
      </div>

      {state.status === 'loading' && <p className="empty-state">正在加载...</p>}
      {state.status === 'error' && <p className="error-state">{state.message}</p>}
      {state.status === 'ready' && module === 'dashboard' && Boolean(state.data) && <><h2>总览</h2><DataGrid data={(state.data as { stats: DashboardStats }).stats} /><h2>趋势</h2><TrendList points={(state.data as { trend: DashboardTrendPoint[] }).trend} /></>}
      {state.status === 'ready' && module === 'ai-stats' && <DataGrid data={(state.data ?? {}) as Record<string, unknown>} />}
      {state.status === 'ready' && !['dashboard', 'ai-stats'].includes(module) && loader && <DataTable result={state.data as AdminListResult} />}
      {state.status === 'ready' && !loader && <p className="empty-state">等待后端接口；当前模块仅保留导航入口，接口联调完成后再展示业务数据。</p>}
    </div>
  );
}
