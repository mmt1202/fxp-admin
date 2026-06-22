import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminUserDetail, updateAdminUserMembership, updateAdminUserStatus, type AdminUserDetail } from '../api/users';

const tabs = ['基础信息', '会员信息', '订单记录', '房源记录', 'AI 用量', '举报/风控'] as const;

type Tab = typeof tabs[number];

const demoDetail: AdminUserDetail = {
  id: 'u_10001',
  name: '张晨',
  phone: '138****1024',
  email: 'chen.zhang@example.com',
  accountStatus: 'active',
  membershipStatus: 'active',
  registeredAt: '2026-04-18T08:24:00Z',
  lastLoginAt: '2026-06-21T13:10:00Z',
  riskTags: ['高活跃'],
  realNameStatus: 'verified',
  aiUsage: { monthlyQuota: 1000, usedThisMonth: 382, totalUsed: 2146, lastUsedAt: '2026-06-21T12:03:00Z' },
  propertySummary: { total: 8, online: 5, offline: 2, pendingReview: 1 },
  communitySummary: { posts: 12, comments: 48, likesReceived: 203 },
  reportSummary: { reportedCount: 2, pendingCount: 1, confirmedCount: 0, latestReportedAt: '2026-06-15T09:30:00Z' },
  orderSummary: { totalOrders: 9, paidOrders: 8, refundedOrders: 1, totalAmount: 1299, lastOrderAt: '2026-06-10T16:20:00Z' },
  membership: { planName: '专业版月卡', startedAt: '2026-06-01T00:00:00Z', expiresAt: '2026-07-01T00:00:00Z', autoRenew: true },
  orders: [
    { id: 'ord_9001', productName: '专业版月卡', status: 'paid', amount: 199, paidAt: '2026-06-10T16:20:00Z' },
    { id: 'ord_8812', productName: 'AI 房评增量包', status: 'refunded', amount: 99, paidAt: '2026-05-28T10:12:00Z' },
  ],
  properties: [
    { id: 'p_3001', title: '滨江花园 3 室 2 厅', city: '上海', status: 'online', updatedAt: '2026-06-20T05:30:00Z' },
    { id: 'p_3002', title: '云锦公寓整租', city: '杭州', status: 'pending', updatedAt: '2026-06-18T07:45:00Z' },
  ],
  reports: [
    { id: 'r_7001', scene: '社区评论', reason: '疑似广告导流', status: 'pending', createdAt: '2026-06-15T09:30:00Z' },
    { id: 'r_6910', scene: '房源信息', reason: '价格不实', status: 'dismissed', createdAt: '2026-05-22T02:10:00Z' },
  ],
};

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '暂无';
}

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
}

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('基础信息');
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let ignore = false;
    getAdminUserDetail(userId)
      .then((data) => {
        if (!ignore) setUser(data);
      })
      .catch(() => {
        if (!ignore) {
          setUser({ ...demoDetail, id: userId || demoDetail.id });
          setNotice('后端 GET /admin/users/:userId 暂不可用，当前展示聚合接口示例数据。');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  const aiPercent = useMemo(() => {
    if (!user) return 0;
    return Math.min(100, Math.round((user.aiUsage.usedThisMonth / user.aiUsage.monthlyQuota) * 100));
  }, [user]);

  const disableUser = async () => {
    if (!user) return;
    const nextStatus = user.accountStatus === 'disabled' ? 'active' : 'disabled';
    try {
      const updated = await updateAdminUserStatus(user.id, nextStatus);
      setUser(updated);
    } catch {
      setUser({ ...user, accountStatus: nextStatus });
      setNotice('状态更新接口暂不可用，已在当前页面临时更新。');
    }
  };

  const extendMembership = async () => {
    if (!user) return;
    try {
      const updated = await updateAdminUserMembership(user.id, 'active');
      setUser(updated);
    } catch {
      setUser({ ...user, membershipStatus: 'active', membership: { ...user.membership, planName: '专业版月卡' } });
      setNotice('会员更新接口暂不可用，已在当前页面临时更新。');
    }
  };

  if (loading) return <div className="notice">正在加载用户详情...</div>;
  if (!user) return <div className="notice warning">未找到用户。</div>;

  return (
    <div className="user-page detail-page">
      <Link className="back-link" to="/users">← 返回用户列表</Link>
      <div className="detail-header">
        <div>
          <p className="eyebrow">用户详情</p>
          <h1>{user.name}</h1>
          <p>{user.phone} · {user.email}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={extendMembership}>修改会员</button>
          <button type="button" className="danger-button" onClick={disableUser}>{user.accountStatus === 'disabled' ? '启用用户' : '禁用用户'}</button>
        </div>
      </div>

      {notice && <div className="notice warning">{notice}</div>}

      <div className="metric-grid">
        <div><span>账号状态</span><strong>{user.accountStatus}</strong></div>
        <div><span>会员状态</span><strong>{user.membershipStatus}</strong></div>
        <div><span>房源数量</span><strong>{user.propertySummary.total}</strong></div>
        <div><span>被举报次数</span><strong>{user.reportSummary.reportedCount}</strong></div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>

      {activeTab === '基础信息' && <section className="detail-section"><Info label="注册时间" value={formatDate(user.registeredAt)} /><Info label="最近登录时间" value={formatDate(user.lastLoginAt)} /><Info label="实名状态" value={user.realNameStatus} /><Info label="社区内容数量" value={`${user.communitySummary.posts} 篇帖子 / ${user.communitySummary.comments} 条评论`} /></section>}
      {activeTab === '会员信息' && <section className="detail-section"><Info label="会员方案" value={user.membership.planName} /><Info label="开始时间" value={formatDate(user.membership.startedAt)} /><Info label="到期时间" value={formatDate(user.membership.expiresAt)} /><Info label="自动续费" value={user.membership.autoRenew ? '开启' : '关闭'} /></section>}
      {activeTab === '订单记录' && <RecordTable headers={['订单号', '商品', '状态', '金额', '支付时间']} rows={user.orders.map((order) => [order.id, order.productName, order.status, money(order.amount), formatDate(order.paidAt)])} footer={`累计 ${user.orderSummary.totalOrders} 单，实付 ${money(user.orderSummary.totalAmount)}`} />}
      {activeTab === '房源记录' && <RecordTable headers={['房源 ID', '标题', '城市', '状态', '更新时间']} rows={user.properties.map((property) => [property.id, property.title, property.city, property.status, formatDate(property.updatedAt)])} footer={`上线 ${user.propertySummary.online} 套，待审 ${user.propertySummary.pendingReview} 套`} />}
      {activeTab === 'AI 用量' && <section className="detail-section"><Info label="本月额度" value={`${user.aiUsage.monthlyQuota} 次`} /><Info label="本月已用" value={`${user.aiUsage.usedThisMonth} 次 (${aiPercent}%)`} /><Info label="累计用量" value={`${user.aiUsage.totalUsed} 次`} /><Info label="最近使用" value={formatDate(user.aiUsage.lastUsedAt)} /></section>}
      {activeTab === '举报/风控' && <RecordTable headers={['举报 ID', '场景', '原因', '状态', '提交时间']} rows={user.reports.map((report) => [report.id, report.scene, report.reason, report.status, formatDate(report.createdAt)])} footer={`待处理 ${user.reportSummary.pendingCount} 条，确认违规 ${user.reportSummary.confirmedCount} 条`} />}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info-item"><span>{label}</span><strong>{value}</strong></div>;
}

function RecordTable({ headers, rows, footer }: { headers: string[]; rows: string[][]; footer: string }) {
  return (
    <div className="table-card">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
      </table>
      <p className="table-footer">{footer}</p>
    </div>
  );
}
