import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { type InAppMessage, type InAppMessagePayload, type InAppMessageTargetType, type InAppMessageType, messageStatusLabels, messagesApi, messageTypeLabels, targetTypeLabels } from '../api/messages';

const fallbackMessages: InAppMessage[] = [
  { id: 'msg-1001', title: '端午假期服务通知', content: '端午假期客服响应时间调整，紧急问题请通过在线客服提交。', type: 'system_announcement', status: 'sent', targetType: 'all', deliveredCount: 28640, readCount: 17220, senderName: '运营团队', sentAt: '2026-06-18T09:00:00Z', createdAt: '2026-06-17T14:20:00Z' },
  { id: 'msg-1002', title: '会员权益即将到期提醒', content: '您的会员权益将在 3 天后到期，续费后可继续使用 AI 评房额度与高级筛选。', type: 'membership_notice', status: 'draft', targetType: 'segment', targetSegment: 'membership_expiring_3d', deliveredCount: 0, readCount: 0, senderName: '会员运营', createdAt: '2026-06-20T11:00:00Z' },
];

const emptyForm: InAppMessagePayload = { title: '', content: '', type: 'system_announcement', targetType: 'all', targetUserIds: [], targetSegment: '', linkUrl: '', sendAt: '' };

function formatDateTime(value?: string) {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
}

function parseUserIds(value: string) {
  return value.split(/[，,\s]+/).map((item) => item.trim()).filter(Boolean);
}

function buildPayload(form: InAppMessagePayload): InAppMessagePayload {
  return {
    title: form.title.trim(),
    content: form.content.trim(),
    type: form.type,
    targetType: form.targetType,
    targetUserIds: form.targetType === 'users' ? form.targetUserIds : undefined,
    targetSegment: form.targetType === 'segment' ? form.targetSegment?.trim() : undefined,
    linkUrl: form.linkUrl?.trim() || undefined,
    sendAt: form.sendAt ? new Date(form.sendAt).toISOString() : undefined,
  };
}

export function InAppMessages() {
  const [messages, setMessages] = useState<InAppMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selected, setSelected] = useState<InAppMessage>();
  const [form, setForm] = useState<InAppMessagePayload>(emptyForm);
  const [userIdsText, setUserIdsText] = useState('');
  const [filterType, setFilterType] = useState<'' | InAppMessageType>('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    messagesApi.getMessages(filterType ? { type: filterType } : undefined)
      .then((result) => { if (!ignore) { setMessages(result.items); setSelectedId(result.items[0]?.id); } })
      .catch(() => { if (!ignore) { setMessages(fallbackMessages); setSelectedId(fallbackMessages[0]?.id); setNotice('当前展示本地示例数据；后端接入 /admin/messages 后将自动展示真实站内信。'); } })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [filterType]);

  useEffect(() => {
    if (!selectedId) { queueMicrotask(() => setSelected(undefined)); return; }
    messagesApi.getMessage(selectedId)
      .then(setSelected)
      .catch(() => setSelected(messages.find((item) => item.id === selectedId)));
  }, [messages, selectedId]);

  const stats = useMemo(() => ({
    total: messages.length,
    sent: messages.filter((item) => item.status === 'sent').length,
    delivered: messages.reduce((sum, item) => sum + (item.deliveredCount ?? 0), 0),
    readRate: messages.reduce((sum, item) => sum + (item.readCount ?? 0), 0),
  }), [messages]);

  const previewTargets = form.targetType === 'all' ? '全部 App 用户' : form.targetType === 'segment' ? (form.targetSegment || '未选择分群') : `${parseUserIds(userIdsText).length} 位指定用户`;

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    const payload = buildPayload({ ...form, targetUserIds: parseUserIds(userIdsText) });
    try {
      const created = await messagesApi.createMessage(payload);
      setMessages((items) => [created, ...items]);
      setSelectedId(created.id);
      setForm(emptyForm);
      setUserIdsText('');
      setNotice('站内信已创建，可在预览确认后发送。');
    } catch {
      const optimistic: InAppMessage = { id: `local-${Date.now()}`, ...payload, status: 'draft', deliveredCount: 0, readCount: 0, senderName: '当前管理员', createdAt: new Date().toISOString() };
      setMessages((items) => [optimistic, ...items]);
      setSelectedId(optimistic.id);
      setNotice('后端暂不可用，已在页面中创建草稿预览。');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (message: InAppMessage) => {
    setSaving(true);
    try {
      const sent = await messagesApi.sendMessage(message.id);
      setMessages((items) => items.map((item) => (item.id === message.id ? sent : item)));
      setSelected(sent);
      setNotice('站内信已发送。');
    } catch {
      const sent = { ...message, status: 'sent' as const, sentAt: new Date().toISOString(), deliveredCount: message.deliveredCount || (message.targetType === 'users' ? message.targetUserIds?.length ?? 1 : 1280) };
      setMessages((items) => items.map((item) => (item.id === message.id ? sent : item)));
      setSelected(sent);
      setNotice('后端暂不可用，已在页面中预览发送状态。');
    } finally {
      setSaving(false);
    }
  };

  return <div className="messages-page"><div className="page-heading"><p className="eyebrow">In-app Messages</p><h1>站内信管理</h1><p>创建系统公告、个人通知、活动通知、审核通知和会员通知，选择目标用户，预览内容并发送到 App 站内信。</p></div>{notice && <div className="notice-banner">{notice}</div>}<div className="messages-stats metric-grid"><div><strong>{stats.total}</strong><span>消息总数</span></div><div><strong>{stats.sent}</strong><span>已发送</span></div><div><strong>{stats.delivered}</strong><span>触达用户</span></div><div><strong>{stats.readRate}</strong><span>累计已读</span></div></div><div className="messages-layout"><section className="form-section"><h2>创建消息</h2><form className="message-form" onSubmit={handleCreate}><label className="field-label">消息类型<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as InAppMessageType }))}>{Object.entries(messageTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field-label">标题<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="请输入站内信标题" /></label><label className="field-label">正文<textarea required rows={6} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="请输入 App 用户将看到的消息内容" /></label><label className="field-label">目标用户<select value={form.targetType} onChange={(event) => setForm((current) => ({ ...current, targetType: event.target.value as InAppMessageTargetType }))}>{Object.entries(targetTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{form.targetType === 'users' && <label className="field-label">用户 ID<textarea rows={3} value={userIdsText} onChange={(event) => setUserIdsText(event.target.value)} placeholder="支持逗号、空格或换行分隔，例如 user_1001,user_1002" /></label>}{form.targetType === 'segment' && <label className="field-label">用户分群<input value={form.targetSegment} onChange={(event) => setForm((current) => ({ ...current, targetSegment: event.target.value }))} placeholder="例如 membership_expiring_3d" /></label>}<label className="field-label">跳转链接<input value={form.linkUrl} onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))} placeholder="可选，例如 /membership" /></label><label className="field-label">定时发送<input type="datetime-local" value={form.sendAt} onChange={(event) => setForm((current) => ({ ...current, sendAt: event.target.value }))} /></label><div className="message-preview"><span>预览</span><h3>{form.title || '站内信标题'}</h3><p>{form.content || '站内信正文将在这里预览。'}</p><small>{messageTypeLabels[form.type]} · {previewTargets}</small></div><button type="submit" disabled={saving}>{saving ? '保存中...' : '创建消息'}</button></form></section><section className="form-section"><div className="message-list-header"><h2>消息列表</h2><select value={filterType} onChange={(event) => setFilterType(event.target.value as '' | InAppMessageType)}><option value="">全部类型</option>{Object.entries(messageTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{loading && <div className="api-panel">正在加载站内信...</div>}<div className="message-list">{messages.map((item) => <button type="button" key={item.id} className={`message-list-item${item.id === selectedId ? ' active' : ''}`} onClick={() => setSelectedId(item.id)}><strong>{item.title}</strong><span>{messageTypeLabels[item.type]} · {messageStatusLabels[item.status]}</span><small>{formatDateTime(item.createdAt)}</small></button>)}</div></section><section className="form-section"><h2>预览与发送</h2>{selected ? <div className="message-detail"><span className={`message-status ${selected.status}`}>{messageStatusLabels[selected.status]}</span><h3>{selected.title}</h3><p>{selected.content}</p><dl><div><dt>类型</dt><dd>{messageTypeLabels[selected.type]}</dd></div><div><dt>目标</dt><dd>{targetTypeLabels[selected.targetType]}{selected.targetSegment ? ` · ${selected.targetSegment}` : ''}</dd></div><div><dt>发送人</dt><dd>{selected.senderName || '-'}</dd></div><div><dt>发送时间</dt><dd>{formatDateTime(selected.sentAt || selected.sendAt)}</dd></div><div><dt>触达/已读</dt><dd>{selected.deliveredCount ?? 0} / {selected.readCount ?? 0}</dd></div></dl><button type="button" disabled={saving || selected.status === 'sent'} onClick={() => handleSend(selected)}>{selected.status === 'sent' ? '已发送' : '确认发送'}</button></div> : <div className="api-panel">请选择消息查看预览。</div>}</section></div></div>;
}
