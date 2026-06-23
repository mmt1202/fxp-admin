import { useEffect, useMemo, useState } from 'react';
import { UserSegment, UserSegmentUser, userSegmentsApi } from '../api/userSegments';

const fallbackSegments: UserSegment[] = [
  { key: 'new', name: '新注册用户', count: 0, mode: 'auto', description: '按注册时间自动识别近期新用户' },
  { key: 'active', name: '活跃用户', count: 0, mode: 'auto', description: '按最近登录时间聚合高活跃人群' },
  { key: 'ai_power', name: 'AI 高频用户', count: 0, mode: 'auto', description: '按 AI 使用次数识别深度使用者' },
  { key: 'creator', name: '房源创作者', count: 0, mode: 'auto', description: '按房源创建数量聚合供给侧用户' },
  { key: 'community', name: '社区贡献者', count: 0, mode: 'auto', description: '按社区发帖数量识别内容贡献用户' },
  { key: 'high_value', name: '高价值用户', count: 0, mode: 'auto', description: '按订单金额识别高消费人群' },
  { key: 'risk', name: '风险用户', count: 0, mode: 'auto', description: '按被举报次数识别需关注用户' },
  { key: 'member', name: '会员用户', count: 0, mode: 'auto', description: '按会员状态聚合付费权益用户' },
];

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.join('、') || '-';
  return String(value);
}

export function UserSegments() {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [users, setUsers] = useState<UserSegmentUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string | number>>(new Set());
  const [tag, setTag] = useState('重点运营');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    let active = true;
    userSegmentsApi.getSegments()
      .then((data) => {
        if (!active) return;
        const nextSegments = data.length ? data : fallbackSegments;
        setSegments(nextSegments);
        setSelected(String(nextSegments[0]?.key ?? ''));
      })
      .catch(() => {
        if (active) {
          setSegments(fallbackSegments);
          setSelected(String(fallbackSegments[0].key));
          setMessage('用户分层接口暂不可用，当前展示内置分层维度。');
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setUsersLoading(true);
        setSelectedUsers(new Set());
      }
    });
    userSegmentsApi.getSegmentUsers(selected)
      .then((data) => active && setUsers(data))
      .catch(() => {
        if (active) {
          setUsers([]);
          setMessage('分层用户列表读取失败，请稍后重试。');
        }
      })
      .finally(() => active && setUsersLoading(false));

    return () => {
      active = false;
    };
  }, [selected]);

  const currentSegment = useMemo(() => segments.find((item) => String(item.key) === selected), [segments, selected]);
  const selectedUserIds = Array.from(selectedUsers);

  const toggleUser = (userId: string | number) => {
    setSelectedUsers((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleExport = () => {
    const header = ['ID', '昵称', '手机号', '注册时间', '最近登录', 'AI次数', '房源数', '发帖数', '订单金额', '举报数', '会员状态', '标签'];
    const rows = users.map((user) => [user.id, user.nickname, user.phone, user.registeredAt, user.lastLoginAt, user.aiUsageCount, user.propertyCount, user.postCount, user.orderAmount, user.reportCount, user.membershipStatus, user.tags?.join('|')]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${formatValue(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-segment-${selected}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchTag = async () => {
    if (!selectedUserIds.length) {
      setMessage('请先选择需要打标签的用户。');
      return;
    }
    await userSegmentsApi.applyManualSegment({ userIds: selectedUserIds, segment: selected, tags: [tag], reason: '后台用户分层批量打标签' });
    setMessage(`已为 ${selectedUserIds.length} 位用户添加「${tag}」标签。`);
  };

  if (loading) return <div className="module-page"><p className="eyebrow">用户分层</p><h1>正在加载用户分层...</h1></div>;

  return (
    <div className="user-segments-page">
      <div className="page-heading">
        <p className="eyebrow">用户分层运营</p>
        <h1>用户分层</h1>
        <p>基于注册时间、最近登录、AI 使用、房源、社区、订单、举报与会员状态，支持系统自动分层与管理员手动分层。</p>
      </div>

      {message ? <p className="status-message saved">{message}</p> : null}

      <section className="segment-grid">
        {segments.map((segment) => (
          <button className={`segment-card${String(segment.key) === selected ? ' active' : ''}`} type="button" key={segment.key} onClick={() => setSelected(String(segment.key))}>
            <span>{segment.mode === 'manual' ? '手动分层' : '自动分层'}</span>
            <strong>{segment.name}</strong>
            <b>{segment.count}</b>
            <small>{segment.description}</small>
          </button>
        ))}
      </section>

      <section className="segment-users-panel">
        <div className="segment-toolbar">
          <div>
            <h2>{currentSegment?.name ?? '分层用户'}用户列表</h2>
            <p>已选择 {selectedUserIds.length} 人，可批量导出或批量打标签。</p>
          </div>
          <div className="segment-actions">
            <input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="输入标签" />
            <button type="button" onClick={handleBatchTag}>批量打标签</button>
            <button type="button" onClick={handleExport} disabled={!users.length}>批量导出</button>
          </div>
        </div>

        {usersLoading ? <div className="api-panel">正在加载分层用户...</div> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>选择</th><th>用户</th><th>注册/登录</th><th>AI/房源/发帖</th><th>订单/举报</th><th>会员/标签</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleUser(user.id)} /></td>
                    <td><strong>{formatValue(user.nickname ?? user.id)}</strong><small>{formatValue(user.phone)}</small></td>
                    <td>{formatValue(user.registeredAt)}<small>{formatValue(user.lastLoginAt)}</small></td>
                    <td>{formatValue(user.aiUsageCount)} / {formatValue(user.propertyCount)} / {formatValue(user.postCount)}</td>
                    <td>¥{formatValue(user.orderAmount)} / {formatValue(user.reportCount)}</td>
                    <td>{formatValue(user.membershipStatus)}<small>{formatValue(user.tags)}</small></td>
                  </tr>
                ))}
                {!users.length ? <tr><td colSpan={6} className="empty-cell">暂无用户数据</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
