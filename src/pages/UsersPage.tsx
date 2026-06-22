import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

type UserStatus = 'enabled' | 'disabled' | 'active' | 'inactive' | 'banned' | string;

type AdminUser = {
  id?: string | number;
  userId?: string | number;
  nickname?: string;
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  status?: UserStatus;
  createdAt?: string;
  registeredAt?: string;
};

type Membership = {
  id?: string | number;
  status?: string;
  level?: string;
  plan?: string;
  startedAt?: string;
  expiresAt?: string;
};

type ListPayload<T> = T[] | { data?: T[]; list?: T[]; items?: T[]; records?: T[] };

const membershipStatuses = ['active', 'inactive', 'expired', 'cancelled'];

function unwrapList<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.list ?? payload.items ?? payload.records ?? [];
}

function getUserId(user: AdminUser) {
  return user.id ?? user.userId ?? '';
}

function isEnabled(status?: string) {
  return ['enabled', 'active', 'normal'].includes((status ?? '').toLowerCase());
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memberships, setMemberships] = useState<Record<string, Membership>>({});
  const [membershipDrafts, setMembershipDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiClient.get<ListPayload<AdminUser>>('/admin/users');
      setUsers(unwrapList(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户列表加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function toggleUserStatus(user: AdminUser) {
    const userId = String(getUserId(user));
    const nextStatus = isEnabled(user.status) ? 'disabled' : 'enabled';
    if (!window.confirm(`确认${nextStatus === 'disabled' ? '禁用' : '启用'}用户 ${userId} 吗？`)) return;

    setActionId(userId);
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status: nextStatus });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户状态更新失败');
    } finally {
      setActionId(null);
    }
  }

  async function loadMembership(userId: string) {
    setActionId(userId);
    setError('');
    try {
      const membership = await apiClient.get<Membership>(`/admin/users/${userId}/membership`);
      setMemberships((current) => ({ ...current, [userId]: membership }));
      setMembershipDrafts((current) => ({ ...current, [userId]: membership.status ?? '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '会员信息加载失败');
    } finally {
      setActionId(null);
    }
  }

  async function updateMembership(userId: string) {
    const status = membershipDrafts[userId];
    if (!status) return;
    if (!window.confirm(`确认将用户 ${userId} 的会员状态调整为 ${status} 吗？`)) return;

    setActionId(userId);
    try {
      await apiClient.put(`/admin/users/${userId}/membership`, { status });
      await loadMembership(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '会员状态更新失败');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="module-page">
      <p className="eyebrow">用户与会员</p>
      <h1>用户管理</h1>
      <p>管理用户启用状态，并查看或调整用户会员状态。</p>
      {error && <div className="error-text">{error}</div>}
      <div className="table-toolbar">
        <button onClick={() => void loadUsers()} disabled={loading}>{loading ? '刷新中...' : '刷新列表'}</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>用户 ID</th><th>昵称</th><th>手机号/邮箱</th><th>状态</th><th>注册时间</th><th>操作</th><th>会员管理</th></tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userId = String(getUserId(user));
              const membership = memberships[userId];
              return (
                <tr key={userId}>
                  <td>{userId}</td>
                  <td>{user.nickname ?? user.name ?? '-'}</td>
                  <td>{user.phone ?? user.mobile ?? user.email ?? '-'}</td>
                  <td><span className={`status-pill ${isEnabled(user.status) ? 'success' : 'muted'}`}>{user.status ?? '-'}</span></td>
                  <td>{formatDate(user.registeredAt ?? user.createdAt)}</td>
                  <td><button className="secondary-button" disabled={actionId === userId} onClick={() => void toggleUserStatus(user)}>{isEnabled(user.status) ? '禁用' : '启用'}</button></td>
                  <td>
                    <div className="inline-actions">
                      <button className="secondary-button" disabled={actionId === userId} onClick={() => void loadMembership(userId)}>查看会员</button>
                      {membership && (
                        <>
                          <span>{membership.level ?? membership.plan ?? '会员'} / {membership.status ?? '-'}</span>
                          <select value={membershipDrafts[userId] ?? ''} onChange={(event) => setMembershipDrafts((current) => ({ ...current, [userId]: event.target.value }))}>
                            <option value="">选择状态</option>
                            {membershipStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <button className="danger-button" disabled={actionId === userId} onClick={() => void updateMembership(userId)}>调整状态</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && <tr><td colSpan={7} className="empty-cell">暂无用户数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
