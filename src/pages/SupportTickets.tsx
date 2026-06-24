import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { featureApi as apiClient, type SupportTicket, type SupportTicketDetail, type SupportTicketMessage, type SupportTicketStatus } from '../api/migratedFeatures';

const statusOptions: Array<{ value: SupportTicketStatus; label: string }> = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '处理中' },
  { value: 'waiting_user', label: '等待用户' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];
const statusLabels = statusOptions.reduce<Record<string, string>>((acc, item) => { acc[item.value] = item.label; return acc; }, {});
const demoAgents = [{ id: 'agent-001', name: '客服 A' }, { id: 'agent-002', name: '客服 B' }, { id: 'agent-003', name: '客服主管' }];
function getTicketTitle(ticket: SupportTicket) { return ticket.subject ?? ticket.title ?? `工单 #${ticket.id}`; }
function getStatusText(status?: string) { return status ? statusLabels[status] ?? status : '待处理'; }
function formatTime(value?: string) { return value ? new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '暂无时间'; }

export function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | number>();
  const [detail, setDetail] = useState<SupportTicketDetail>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { let active = true; apiClient.getSupportTickets().then((result) => { if (active) { setTickets(result.items); setSelectedId(result.items[0]?.id); } }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : '客服工单列表加载失败'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!selectedId) { setDetail(undefined); return; } let active = true; setDetailLoading(true); apiClient.getSupportTicket(selectedId).then((ticket) => { if (active) { setDetail(ticket); setAssigneeId(ticket.assigneeId ? String(ticket.assigneeId) : ''); } }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : '工单详情加载失败'); }).finally(() => { if (active) setDetailLoading(false); }); return () => { active = false; }; }, [selectedId]);
  const selectedTicket = useMemo(() => detail ?? tickets.find((ticket) => ticket.id === selectedId), [detail, selectedId, tickets]);
  const patchTicket = (updated: Partial<SupportTicket>) => { setTickets((current) => current.map((ticket) => ticket.id === selectedId ? { ...ticket, ...updated } : ticket)); setDetail((current) => current ? { ...current, ...updated } : current); };
  const handleStatusChange = async (status: SupportTicketStatus) => { if (!selectedId) return; const updated = await apiClient.updateSupportTicketStatus(selectedId, status); patchTicket({ ...updated, status }); };
  const handleAssigneeChange = async (nextAssigneeId: string) => { if (!selectedId) return; setAssigneeId(nextAssigneeId); const updated = await apiClient.updateSupportTicketAssignee(selectedId, nextAssigneeId); const agent = demoAgents.find((item) => item.id === nextAssigneeId); patchTicket({ ...updated, assigneeId: nextAssigneeId, assigneeName: updated.assigneeName ?? agent?.name }); };
  const handleMessageSubmit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selectedId || !reply.trim()) return; setSubmitting(true); try { const message = await apiClient.createSupportTicketMessage(selectedId, { content: reply.trim(), isInternal }); setDetail((current) => current ? { ...current, messages: [...(current.messages ?? []), normalizeMessage(message, reply.trim(), isInternal)] } : current); setReply(''); setIsInternal(false); } finally { setSubmitting(false); } };

  return <div className="support-page"><div className="page-heading"><p className="eyebrow">客服工单</p><h1>客服工单管理</h1><p>左侧查看用户工单队列，右侧处理对话、记录内部备注并转派处理人。</p></div>{error ? <p className="status-message error">{error}</p> : null}<div className="ticket-workspace"><aside className="ticket-list-panel form-section"><div className="ticket-list-header"><strong>工单列表</strong><span>{tickets.length} 个</span></div>{loading ? <div className="empty-state">正在加载工单...</div> : null}{!loading && tickets.length === 0 ? <div className="empty-state">暂无客服工单</div> : null}{tickets.map((ticket) => <button className={`ticket-list-item${ticket.id === selectedId ? ' active' : ''}`} key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)}><span className="ticket-title">{getTicketTitle(ticket)}</span><span className="ticket-meta">{ticket.userName ?? `用户 ${ticket.userId ?? '-'}`} · {formatTime(ticket.lastMessageAt ?? ticket.updatedAt)}</span><span className={`ticket-status status-${ticket.status ?? 'pending'}`}>{getStatusText(ticket.status)}</span></button>)}</aside><section className="ticket-detail-panel form-section">{!selectedTicket ? <div className="empty-state">请选择一个工单</div> : null}{selectedTicket ? <><header className="ticket-detail-header"><div><h2>{getTicketTitle(selectedTicket)}</h2><p>工单 #{selectedTicket.id} · {selectedTicket.userName ?? `用户 ${selectedTicket.userId ?? '-'}`}</p></div><div className="ticket-actions"><label>状态<select value={selectedTicket.status ?? 'pending'} onChange={(event) => void handleStatusChange(event.target.value as SupportTicketStatus)}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>处理人<select value={assigneeId} onChange={(event) => void handleAssigneeChange(event.target.value)}><option value="">未分配</option>{demoAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label></div></header><div className="message-list">{detailLoading ? <div className="empty-state">正在加载对话...</div> : null}{(detail?.messages ?? []).map((message) => <article className={`message-bubble${message.isInternal ? ' internal' : ''}`} key={message.id}><div className="message-meta"><strong>{message.isInternal ? '内部备注' : message.senderName ?? (message.senderType === 'user' ? '用户' : '客服')}</strong><span>{formatTime(message.createdAt)}</span></div><p>{message.content}</p></article>)}</div><form className="reply-box" onSubmit={handleMessageSubmit}><label className="switch-card inline-switch"><input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} /><span><strong>内部备注</strong><small>勾选后消息仅后台客服可见。</small></span></label><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={isInternal ? '记录内部处理备注...' : '回复用户...'} rows={4} /><div className="form-actions"><button type="submit" disabled={submitting || !reply.trim()}>{submitting ? '发送中...' : isInternal ? '添加备注' : '发送回复'}</button></div></form></> : null}</section></div></div>;
}

function normalizeMessage(message: SupportTicketMessage, content: string, isInternal: boolean): SupportTicketMessage {
  return { id: message.id ?? `local-${Date.now()}`, content: message.content ?? content, isInternal: message.isInternal ?? isInternal, senderName: message.senderName ?? '当前客服', senderType: message.senderType ?? 'agent', createdAt: message.createdAt ?? new Date().toISOString() };
}
