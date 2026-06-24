import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { featureApi as apiClient, type RiskEvent, type RiskLevel, type RiskWatchlist, type RiskWatchlistPayload } from '../api/migratedFeatures';

type FormState = RiskWatchlistPayload;
type LoadState = { loading: boolean; saving: boolean; error?: string; message?: string };

const emptyForm: FormState = { userId: '', riskType: 'abusive_content', riskLevel: 'medium', reason: '', addedBy: '', expiresAt: '' };
const riskLevelLabels: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险', critical: '严重风险' };
const actionLabels: Record<string, string> = { post: '发帖', comment: '评论', ai_call: 'AI 调用', report: '举报' };

function formatDate(value?: string | null) {
  if (!value) return '长期有效';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function toInputDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function normalizePayload(form: FormState): RiskWatchlistPayload {
  return { ...form, userId: String(form.userId).trim(), reason: form.reason.trim(), addedBy: form.addedBy.trim(), expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null };
}

export function RiskWatchlistPage() {
  const [records, setRecords] = useState<RiskWatchlist[]>([]);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | undefined>();
  const [editingId, setEditingId] = useState<string | number | undefined>();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [state, setState] = useState<LoadState>({ loading: true, saving: false });

  const selectedRecord = useMemo(() => records.find((record) => String(record.id) === String(selectedId)), [records, selectedId]);

  const loadRecords = async () => {
    setState((current) => ({ ...current, loading: true, error: undefined }));
    try {
      const result = await apiClient.getRiskWatchlist();
      setRecords(result.items);
      setSelectedId((current) => current ?? result.items[0]?.id);
      setState((current) => ({ ...current, loading: false }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : '观察名单加载失败' }));
    }
  };

  useEffect(() => { void loadRecords(); }, []);
  useEffect(() => {
    if (!selectedId) { setEvents([]); return; }
    let ignore = false;
    apiClient.getRiskWatchlistEvents(selectedId).then((result) => { if (!ignore) setEvents(result.items); }).catch(() => { if (!ignore) setEvents(selectedRecord?.events ?? []); });
    return () => { ignore = true; };
  }, [selectedId, selectedRecord]);

  const resetForm = () => { setEditingId(undefined); setForm(emptyForm); };
  const startEdit = (record: RiskWatchlist) => { setEditingId(record.id); setForm({ userId: record.userId, riskType: record.riskType, riskLevel: record.riskLevel, reason: record.reason, addedBy: record.addedBy, expiresAt: toInputDateTime(record.expiresAt) }); };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try {
      const payload = normalizePayload(form);
      if (editingId) await apiClient.updateRiskWatchlist(editingId, payload);
      else await apiClient.createRiskWatchlist(payload);
      resetForm();
      await loadRecords();
      setState((current) => ({ ...current, saving: false, message: editingId ? '观察名单已更新' : '用户已加入观察名单' }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : '保存观察名单失败' }));
    }
  };

  const handleDelete = async (record: RiskWatchlist) => {
    setState((current) => ({ ...current, saving: true, error: undefined, message: undefined }));
    try {
      await apiClient.deleteRiskWatchlist(record.id);
      if (String(selectedId) === String(record.id)) setSelectedId(undefined);
      await loadRecords();
      setState((current) => ({ ...current, saving: false, message: `用户 ${record.userId} 已移出观察名单` }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error instanceof Error ? error.message : '移出观察名单失败' }));
    }
  };

  return (
    <div className="risk-watchlist-page"><div className="page-heading"><p className="eyebrow">Security Watchlist</p><h1>风险用户观察名单</h1><p>对高风险用户进行加入、编辑、移出管理，并查看发帖、评论、AI 调用、举报等命中事件。</p></div>{(state.error || state.message) && <p className={`status-message ${state.error ? 'error' : 'saved'}`}>{state.error ?? state.message}</p>}<div className="watchlist-layout"><form className="watchlist-form form-section" onSubmit={handleSubmit}><h2>{editingId ? '编辑观察记录' : '加入观察名单'}</h2><div className="form-grid"><label className="field-label">用户 ID<input required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} /></label><label className="field-label">风险类型<input required value={form.riskType} onChange={(event) => setForm({ ...form, riskType: event.target.value })} /></label><label className="field-label">风险等级<select value={form.riskLevel} onChange={(event) => setForm({ ...form, riskLevel: event.target.value as RiskLevel })}>{Object.entries(riskLevelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field-label">加入人<input required value={form.addedBy} onChange={(event) => setForm({ ...form, addedBy: event.target.value })} /></label><label className="field-label">过期时间<input type="datetime-local" value={form.expiresAt ?? ''} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label></div><label className="field-label">加入原因<textarea required rows={4} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label><div className="form-actions">{editingId && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}<button type="submit" disabled={state.saving}>{state.saving ? '提交中...' : editingId ? '保存修改' : '加入观察名单'}</button></div></form><section className="watchlist-table-card form-section"><h2>观察名单</h2>{state.loading ? <div className="api-panel">正在加载观察名单...</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>用户</th><th>风险</th><th>原因</th><th>过期时间</th><th>操作</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className={String(record.id) === String(selectedId) ? 'selected-row' : ''} onClick={() => setSelectedId(record.id)}><td>{record.userId}</td><td><span className={`risk-badge ${record.riskLevel}`}>{riskLevelLabels[record.riskLevel] ?? record.riskLevel}</span><small>{record.riskType}</small></td><td>{record.reason}</td><td>{formatDate(record.expiresAt)}</td><td><button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); startEdit(record); }}>编辑</button><button type="button" className="danger-button" onClick={(event) => { event.stopPropagation(); void handleDelete(record); }}>移出</button></td></tr>)}{!records.length && <tr><td colSpan={5}>暂无观察名单记录</td></tr>}</tbody></table></div>}</section></div><section className="timeline-card form-section"><h2>风险事件时间线{selectedRecord ? ` · 用户 ${selectedRecord.userId}` : ''}</h2><div className="timeline">{events.map((event) => <article key={event.id} className="timeline-item"><time>{formatDate(event.createdAt)}</time><strong>{actionLabels[event.action] ?? event.action}</strong><p>{event.summary}</p>{event.detail && <small>{event.detail}</small>}</article>)}{!events.length && <p className="empty-text">选择观察名单用户后，可查看其发帖、评论、AI 调用、举报等风险事件。</p>}</div></section></div>
  );
}
