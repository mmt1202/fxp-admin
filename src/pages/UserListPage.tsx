import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExportTaskButton } from '../components/ExportTaskButton';
import { getAdminUsers, type AdminUserListItem } from '../api/users';

const accountStatusText = {
  active: '正常',
  disabled: '已禁用',
  risk: '风控中',
  pending: '待完善',
};

const membershipStatusText = {
  none: '未开通',
  trial: '试用',
  active: '会员中',
  expired: '已过期',
};

const demoUsers: AdminUserListItem[] = [
  {
    id: 'u_10001',
    name: '张晨',
    phone: '138****1024',
    email: 'chen.zhang@example.com',
    accountStatus: 'active',
    membershipStatus: 'active',
    registeredAt: '2026-04-18T08:24:00Z',
    lastLoginAt: '2026-06-21T13:10:00Z',
    riskTags: ['高活跃'],
  },
  {
    id: 'u_10002',
    name: '李楠',
    phone: '136****7788',
    email: 'nan.li@example.com',
    accountStatus: 'risk',
    membershipStatus: 'expired',
    registeredAt: '2026-03-02T11:42:00Z',
    lastLoginAt: '2026-06-19T02:18:00Z',
    riskTags: ['多次举报', '退款异常'],
  },
];

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '暂无';
}

export function UserListPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getAdminUsers()
      .then((data) => {
        if (!ignore) setUsers(data);
      })
      .catch(() => {
        if (!ignore) {
          setUsers(demoUsers);
          setError('后端 /admin/users 暂不可用，当前展示示例数据。');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="user-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">用户管理</p>
          <h1>用户列表</h1>
          <p>查看用户账号、会员、实名与风控概况，并进入详情处理运营操作。</p>
        </div>
        <ExportTaskButton type="users" />
      </div>

      {error && <div className="notice warning">{error}</div>}
      {loading ? <div className="notice">正在加载用户数据...</div> : null}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>账号状态</th>
              <th>会员状态</th>
              <th>注册时间</th>
              <th>最近登录</th>
              <th>风控标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                  <span>{user.phone} · {user.email}</span>
                </td>
                <td><span className={`status status-${user.accountStatus}`}>{accountStatusText[user.accountStatus]}</span></td>
                <td>{membershipStatusText[user.membershipStatus]}</td>
                <td>{formatDate(user.registeredAt)}</td>
                <td>{formatDate(user.lastLoginAt)}</td>
                <td>{user.riskTags.length ? user.riskTags.join('、') : '无'}</td>
                <td><Link className="button-link" to={`/users/${user.id}`}>详情</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
