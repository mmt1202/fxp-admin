import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { AdminModule } from '../routes/modules';
import {type AdminListResult, type DashboardStats, type DashboardTrendPoint } from '../api/client';

import { useAuthStore } from '../store/auth';
import type { AdminPermission } from '../types/admin';

type LoadableModule = Exclude<AdminModule['module'], 'config' | 'recommendation-pools'>;

type LoadableModule = NonNullable<AdminModule['module']>;

type ModulePageProps = {
  title: string;
  description: string;
  module: AdminModule['module'];
  permission: AdminPermission;
  module: Exclude<AdminModule['module'], moduleType>;
};

type LoadState = {
  loading: boolean;
  error?: string;
  data?: unknown;
};

type moduleType = 'config' | 'user-lifecycle' | 'content-quality'|'recall-tasks'

const moduleLoaders: Record<AdminModule['module'],moduleType, () => Promise<unknown>> = {
  dashboard: async () => {
    const [stats, trend] = await Promise.all([
      apiClient.getDashboard(),
      apiClient.getDashboardTrend(),
    ]);

    return { stats, trend };
  },
  users: () => apiClient.getUsers(),
  properties: () => apiClient.get('/admin/properties'),
  reviews: () => apiClient.get('/admin/reviews'),
  moderation: () => apiClient.get('/admin/moderation'),
};

export function ModulePage({ title, description, module }: ModulePageProps) {
  const [state, setState] = useState<LoadState>({ loading: true });
  const loader = useMemo(() => moduleLoaders[module as Exclude<AdminModule['module'], 'config' | 'cms'>], [module]);

  useEffect(() => {
    let ignore = false;

    setState({ loading: true });
    queueMicrotask(() => {
          if (!ignore) {
            setState({ loading: true });
          }
        });
    loader()
      .then((data: unknown) => {
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

type User = {
  id?: string | number;
  userId?: string | number;
  nickname?: string;
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  registeredAt?: string;
};

type Membership = {
  status?: string;
  level?: string;
  expireAt?: string;
  expiredAt?: string;
};

type Report = {
  id?: string | number;
  reportId?: string | number;
  type?: string;
  reportType?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
};

type ListResponse<T> = T[] | { data?: T[]; items?: T[]; list?: T[]; records?: T[] };

function normalizeList<T>(payload: ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.list ?? payload.items ?? payload.records ?? [];
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getUserId(user: User) {
  return user.userId ?? user.id;
}

function getReportId(report: Report) {
  return report.reportId ?? report.id;
}

function UserManagementPage({ title, description }: ModulePageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [membershipUserId, setMembershipUserId] = useState<string | number | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipStatus, setMembershipStatus] = useState('');
  const [membershipLoading, setMembershipLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiClient.get<ListResponse<User>>('/admin/users');
      setUsers(normalizeList(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户列表加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const currentMembershipUser = useMemo(
    () => users.find((user) => getUserId(user) === membershipUserId),
    [membershipUserId, users],
  );

  const toggleUserStatus = async (user: User) => {
    const userId = getUserId(user);
    if (!userId) return;
    const nextStatus = user.status === 'disabled' ? 'enabled' : 'disabled';
    const actionText = nextStatus === 'disabled' ? '禁用' : '启用';
    if (!window.confirm(`确认${actionText}用户 ${userId} 吗？`)) return;
    await apiClient.put(`/admin/users/${userId}/status`, { status: nextStatus });
    await loadUsers();
  };

  const viewMembership = async (user: User) => {
    const userId = getUserId(user);
    if (!userId) return;
    setMembershipUserId(userId);
    setMembership(null);
    setMembershipStatus('');
    setMembershipLoading(true);
    setError('');
    try {
      const payload = await apiClient.get<Membership>(`/admin/users/${userId}/membership`);
      setMembership(payload);
      setMembershipStatus(payload.status ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '会员信息加载失败');
    } finally {
      setMembershipLoading(false);
    }
  };

  const updateMembership = async () => {
    if (!membershipUserId || !membershipStatus) return;
    if (!window.confirm(`确认将用户 ${membershipUserId} 的会员状态调整为 ${membershipStatus} 吗？`)) return;
    await apiClient.put(`/admin/users/${membershipUserId}/membership`, { status: membershipStatus });
    await viewMembership({ id: membershipUserId });
    await loadUsers();
  };

  return (
    <div className="module-page">
      <p className="eyebrow">用户与会员</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {error && <p className="error-text">{error}</p>}
      <div className="table-actions">
        <button onClick={() => void loadUsers()} disabled={loading}>刷新列表</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>用户 ID</th>
              <th>昵称</th>
              <th>手机号/邮箱</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userId = getUserId(user);
              return (
                <tr key={String(userId)}>
                  <td>{formatValue(userId)}</td>
                  <td>{formatValue(user.nickname ?? user.name)}</td>
                  <td>{formatValue(user.phone ?? user.mobile ?? user.email)}</td>
                  <td><span className="status-badge">{formatValue(user.status)}</span></td>
                  <td>{formatDate(user.registeredAt ?? user.createdAt)}</td>
                  <td className="row-actions">
                    <button onClick={() => void toggleUserStatus(user)}>{user.status === 'disabled' ? '启用' : '禁用'}</button>
                    <button className="secondary-button" onClick={() => void viewMembership(user)}>查看会员</button>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && <tr><td colSpan={6}>暂无用户数据</td></tr>}
            {loading && <tr><td colSpan={6}>加载中...</td></tr>}
          </tbody>
        </table>
      </div>
      {membershipUserId && (
        <div className="detail-panel">
          <h2>会员信息：{currentMembershipUser?.nickname ?? membershipUserId}</h2>
          {membershipLoading ? (
            <p>会员信息加载中...</p>
          ) : (
            <>
              <div className="detail-grid">
                <span>等级：{formatValue(membership?.level)}</span>
                <span>状态：{formatValue(membership?.status)}</span>
                <span>到期时间：{formatDate(membership?.expireAt ?? membership?.expiredAt)}</span>
              </div>
              <label className="inline-field">
                调整会员状态
                <input
                  value={membershipStatus}
                  onChange={(event) => setMembershipStatus(event.target.value)}
                  placeholder="active / expired / disabled"
                />
              </label>
              <button onClick={() => void updateMembership()} disabled={!membershipStatus}>保存会员状态</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModerationPage({ title, description }: ModulePageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiClient.get<ListResponse<Report>>('/admin/community/reports');
      setReports(normalizeList(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : '举报列表加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const updateReport = async (report: Report, action: 'approve_hide' | 'reject') => {
    const reportId = getReportId(report);
    if (!reportId) return;
    const actionText = action === 'approve_hide' ? '通过举报并隐藏内容' : '驳回举报';
    if (!window.confirm(`确认${actionText}（举报 ${reportId}）吗？`)) return;
    await apiClient.put(`/admin/community/reports/${reportId}`, { action });
    await loadReports();
  };

  return (
    <div className="module-page">
      <p className="eyebrow">举报审核</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {error && <p className="error-text">{error}</p>}
      <div className="table-actions">
        <button onClick={() => void loadReports()} disabled={loading}>刷新列表</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>举报 ID</th>
              <th>举报类型</th>
              <th>举报原因</th>
              <th>当前状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const reportId = getReportId(report);
              return (
                <tr key={String(reportId)}>
                  <td>{formatValue(reportId)}</td>
                  <td>{formatValue(report.reportType ?? report.type)}</td>
                  <td>{formatValue(report.reason)}</td>
                  <td><span className="status-badge">{formatValue(report.status)}</span></td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td className="row-actions">
                    <button onClick={() => void updateReport(report, 'approve_hide')}>通过举报并隐藏内容</button>
                    <button className="danger-button" onClick={() => void updateReport(report, 'reject')}>驳回举报</button>
                  </td>
                </tr>
              );
            })}
            {!loading && reports.length === 0 && <tr><td colSpan={6}>暂无举报数据</td></tr>}
            {loading && <tr><td colSpan={6}>加载中...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModulePage({ title, description }: ModulePageProps) {
  if (title === '用户管理') return <UserManagementPage title={title} description={description} />;
  if (title === '举报/审核管理') return <ModerationPage title={title} description={description} />;

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
