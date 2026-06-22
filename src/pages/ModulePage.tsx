import { useEffect, useState } from 'react';
import { apiClient, type AdminListResult, type DashboardStats, type DashboardTrendPoint } from '../api/client';
import type { AdminModule } from '../routes/modules';

type ModulePageProps = {
  module: AdminModule;
};

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: unknown };

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function DataGrid({ data }: { data: DashboardStats }) {
  const entries = Object.entries(data);

  if (!entries.length) {
    return <p className="empty-state">暂无数据</p>;
  }

  return (
    <div className="placeholder-grid data-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <strong>{key}</strong>
          <span>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

function DataTable({ result }: { result: AdminListResult }) {
  const columns = Array.from(new Set(result.items.flatMap((item) => Object.keys(item)))).slice(0, 6);

  return (
    <div className="table-wrap">
      <p className="table-summary">共 {result.total ?? result.items.length} 条</p>
      {result.items.length ? (
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.items.map((item, index) => (
              <tr key={String(item.id ?? item._id ?? index)}>
                {columns.map((column) => <td key={column}>{formatValue(item[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="empty-state">暂无数据</p>}
    </div>
  );
}

function TrendList({ points }: { points: DashboardTrendPoint[] }) {
  if (!points.length) {
    return <p className="empty-state">暂无趋势数据</p>;
  }

  return (
    <div className="trend-list">
      {points.slice(0, 12).map((point, index) => (
        <pre key={String(point.date ?? point.day ?? index)}>{JSON.stringify(point, null, 2)}</pre>
      ))}
    </div>
  );
}

async function loadModule(module: AdminModule) {
  switch (module.loader) {
    case 'dashboard': {
      const [stats, trend] = await Promise.all([apiClient.getDashboard(), apiClient.getDashboardTrend()]);
      return { stats, trend };
    }
    case 'users':
      return apiClient.getUsers();
    case 'orders':
      return apiClient.getOrders();
    case 'aiStats':
      return apiClient.getAiStats();
    case 'reports':
      return apiClient.getCommunityReports();
    default:
      return null;
  }
}

export function ModulePage({ module }: ModulePageProps) {
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadModule(module)
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ready', data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : '加载失败' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [module]);

  return (
    <div className="module-page">
      <p className="eyebrow">真实接口模块</p>
      <h1>{module.label}</h1>
      <p>{module.description}</p>

      {state.status === 'loading' && <p className="empty-state">正在加载...</p>}
      {state.status === 'error' && <p className="error-state">{state.message}</p>}
      {state.status === 'ready' && module.loader === 'dashboard' && (
        <>
          <h2>总览</h2>
          <DataGrid data={(state.data as { stats: DashboardStats }).stats} />
          <h2>趋势</h2>
          <TrendList points={(state.data as { trend: DashboardTrendPoint[] }).trend} />
        </>
      )}
      {state.status === 'ready' && module.loader === 'aiStats' && <DataGrid data={state.data as DashboardStats} />}
      {state.status === 'ready' && !['dashboard', 'aiStats'].includes(module.loader) && (
        <DataTable result={state.data as AdminListResult} />
      )}
    </div>
  );
}
