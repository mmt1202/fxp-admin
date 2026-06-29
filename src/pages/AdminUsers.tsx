import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createAdminUserApi, deleteAdminUserApi, listAdminRolesApi, listAdminUsersApi, updateAdminUserApi } from '../api/adminUsers';
import { useAuthStore } from '../store/auth';
import { adminPermissions, type AdminPermission, type AdminRole, type AdminUser, type AdminUserInput } from '../types/admin';

const permissionLabels: Record<AdminPermission, string> = {
  '*': '全部权限',
  'dashboard:view': '数据看板查看',
  'users:view': '用户查看',
  'users:update': '用户更新',
  'reports:view': '举报查看',
  'reports:handle': '举报处理',
  'orders:view': '订单查看',
  'membership:update': '会员配置',
  'admin-users:manage': '管理员管理',
  'announcements:manage': '后台公告管理',
};

const fallbackRoles: AdminRole[] = [
  { id: 'super-admin', name: '超级管理员', permissions: [...adminPermissions] },
  { id: 'operator', name: '运营管理员', permissions: ['dashboard:view', 'users:view', 'reports:view', 'reports:handle', 'orders:view'] },
  { id: 'customer-service', name: '客服管理员', permissions: ['users:view', 'reports:view', 'orders:view'] },
];

const emptyForm: AdminUserInput = {
  username: '',
  displayName: '',
  password: '',
  roleId: fallbackRoles[1].id,
  permissions: fallbackRoles[1].permissions,
  enabled: true,
};

export function AdminUsers() {
  const canManage = useAuthStore((state) => state.hasPermission('admin-users:manage'));
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>(fallbackRoles);
  const [form, setForm] = useState<AdminUserInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRole = useMemo(() => roles.find((role) => role.id === form.roleId), [form.roleId, roles]);

  async function refresh() {
    setLoading(true);
    setMessage('');
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        listAdminUsersApi(),
        listAdminRolesApi().catch(() => fallbackRoles),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles.length ? nextRoles : fallbackRoles);
    } catch {
      setMessage('管理员列表加载失败，请确认后端 GET /admin/admin-users 已实现。');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canManage) return;

    let ignore = false;

    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const [nextUsers, nextRoles] = await Promise.all([
          listAdminUsersApi(),
          listAdminRolesApi().catch(() => fallbackRoles),
        ]);
        if (!ignore) {
          setUsers(nextUsers);
          setRoles(nextRoles.length ? nextRoles : fallbackRoles);
        }
      } catch {
        if (!ignore) setMessage('管理员列表加载失败，请确认后端 GET /admin/admin-users 已实现。');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [canManage]);

  const updateRole = (roleId: string) => {
    const role = roles.find((item) => item.id === roleId);
    setForm((current) => ({ ...current, roleId, permissions: role?.permissions ?? [] }));
  };

  const togglePermission = (permission: AdminPermission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editUser = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      displayName: user.displayName,
      roleId: user.role.id,
      permissions: user.permissions,
      enabled: user.enabled,
      password: '',
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (editingId) {
        await updateAdminUserApi(editingId, form);
        setMessage('管理员已更新。');
      } else {
        await createAdminUserApi(form);
        setMessage('管理员已创建。');
      }
      resetForm();
      await refresh();
    } catch {
      setMessage('保存失败，请检查账号、角色或权限配置。');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (user: AdminUser) => {
    if (!confirm(`确认删除管理员 ${user.displayName || user.username}？`)) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteAdminUserApi(user.id);
      setMessage('管理员已删除。');
      await refresh();
    } catch {
      setMessage('删除失败，请确认当前账号拥有管理员管理权限。');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return <div className="empty-state">当前账号没有管理员管理权限。</div>;
  }

  return (
    <div className="admin-users-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">权限体系</p>
          <h1>管理员管理</h1>
          <p>创建管理员账号，并为角色补充细粒度权限点。</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>刷新</button>
      </div>

      {message && <div className="notice">{message}</div>}

      <form className="admin-user-form" onSubmit={submit}>
        <input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="登录账号" />
        <input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="管理员姓名" />
        <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editingId ? '留空则不修改密码' : '初始密码'} />
        <select value={form.roleId} onChange={(event) => updateRole(event.target.value)}>
          {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
        <label className="switch-line"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> 启用账号</label>
        <div className="permission-grid">
          {adminPermissions.map((permission) => (
            <label key={permission} className="permission-chip">
              <input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} />
              {permissionLabels[permission]}
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>{editingId ? '保存修改' : '创建管理员'}</button>
          {editingId && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}
        </div>
        {selectedRole && <small>当前角色默认权限：{selectedRole.permissions.map((item) => permissionLabels[item]).join('、')}</small>}
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>账号</th><th>角色</th><th>权限</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.displayName}</strong><span>{user.username}</span></td>
                <td>{user.role.name}</td>
                <td>{user.permissions.map((item) => permissionLabels[item] ?? item).join('、')}</td>
                <td>{user.enabled ? '启用' : '停用'}</td>
                <td className="row-actions"><button type="button" onClick={() => editUser(user)}>编辑</button><button type="button" className="danger-button" onClick={() => remove(user)}>删除</button></td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5} className="empty-state">暂无管理员数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
