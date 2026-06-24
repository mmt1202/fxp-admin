import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, FeedbackStatus, UserFeedbackItem } from '../api/client';

const feedbackTypes = [
  { value: '', label: '全部类型' },
  { value: 'bug', label: '功能异常' },
  { value: 'suggestion', label: '产品建议' },
  { value: 'property', label: '房源问题' },
  { value: 'account', label: '账号问题' },
  { value: 'other', label: '其他' },
];

const feedbackStatuses: Array<{ value: '' | FeedbackStatus; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'replied', label: '已回复' },
  { value: 'resolved', label: '已完成' },
  { value: 'closed', label: '已关闭' },
];

const statusText: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  replied: '已回复',
  resolved: '已完成',
  closed: '已关闭',
};

const typeText: Record<string, string> = {
  bug: '功能异常',
  suggestion: '产品建议',
  property: '房源问题',
  account: '账号问题',
  other: '其他',
};

type Filters = {
  status: '' | FeedbackStatus;
  type: string;
  startDate: string;
  endDate: string;
};

type PageState = {
  loading: boolean;
  error?: string;
  items: UserFeedbackItem[];
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';
}

export function UserFeedback() {
  const [filters, setFilters] = useState<Filters>({ status: '', type: '', startDate: '', endDate: '' });
  const [state, setState] = useState<PageState>({ loading: true, items: [] });
  const [selectedId, setSelectedId] = useState<string>();
  const [selected, setSelected] = useState<UserFeedbackItem>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [nextStatus, setNextStatus] = useState<FeedbackStatus>('processing');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const query = useMemo(() => ({
    status: filters.status || undefined,
    type: filters.type || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  }), [filters]);

  const loadList = useCallback(() => {
    queueMicrotask(() => setState((current) => ({ ...current, loading: true, error: undefined })));
    apiClient.getFeedback(query)
      .then((result) => {
        setState({ loading: false, items: result.items });
        if (!selectedId && result.items[0]) setSelectedId(String(result.items[0].id));
      })
      .catch((error: unknown) => setState({ loading: false, items: [], error: error instanceof Error ? error.message : '反馈列表加载失败' }));
  }, [query, selectedId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => setSelected(undefined));
      return;
    }

    queueMicrotask(() => setDetailLoading(true));
    apiClient.getFeedbackDetail(selectedId)
      .then((detail) => {
        setSelected(detail);
        setReply(detail.handlerRemark ?? '');
        setNextStatus(detail.status === 'resolved' ? 'resolved' : 'processing');
      })
      .catch(() => {
        const fallback = state.items.find((item) => String(item.id) === selectedId);
        setSelected(fallback);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId, state.items]);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadList();
  };

  const handleStatusUpdate = async (status: FeedbackStatus) => {
    if (!selected) return;

    setSaving(true);
    setMessage('');
    try {
      const updated = await apiClient.updateFeedbackStatus(String(selected.id), {
        status,
        handlerRemark: reply,
      });
      setSelected(updated);
      setMessage(status === 'resolved' ? '反馈已标记处理完成。' : '反馈状态与回复已保存。');
      loadList();
    } catch {
      setMessage('保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="page-heading">
        <p className="eyebrow">用户反馈</p>
        <h1>用户反馈管理</h1>
        <p>查看 App 用户提交的反馈，按状态、类型和时间筛选，并完成回复、流转和用户详情关联。</p>
      </div>

      <form className="feedback-filters" onSubmit={handleFilter}>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as Filters['status'] }))}>
          {feedbackStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
          {feedbackTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
        <input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
        <button type="submit">筛选</button>
      </form>

      <div className="feedback-layout">
        <section className="feedback-list-panel">
          {state.loading && <div className="api-panel">正在加载反馈列表...</div>}
          {state.error && <div className="api-panel error">{state.error}</div>}
          {!state.loading && !state.error && state.items.length === 0 && <div className="api-panel">暂无符合条件的反馈。</div>}
          {state.items.map((item) => (
            <button type="button" className={`feedback-list-item${String(item.id) === selectedId ? ' active' : ''}`} key={String(item.id)} onClick={() => setSelectedId(String(item.id))}>
              <span className={`feedback-status ${item.status}`}>{statusText[item.status] ?? item.status}</span>
              <strong>{typeText[item.type] ?? item.type}</strong>
              <small>{item.content}</small>
              <em>{formatDate(item.createdAt)}</em>
            </button>
          ))}
        </section>

        <section className="feedback-detail-panel">
          {detailLoading && <div className="api-panel">正在加载反馈详情...</div>}
          {!detailLoading && selected && (
            <>
              <div className="feedback-detail-header">
                <div>
                  <span className={`feedback-status ${selected.status}`}>{statusText[selected.status] ?? selected.status}</span>
                  <h2>{typeText[selected.type] ?? selected.type}</h2>
                </div>
                <a href={`/users?userId=${selected.userId}`}>查看用户详情 #{selected.userId}</a>
              </div>
              <dl className="feedback-meta">
                <div><dt>提交时间</dt><dd>{formatDate(selected.createdAt)}</dd></div>
                <div><dt>联系方式</dt><dd>{selected.contact || '-'}</dd></div>
                <div><dt>处理人</dt><dd>{selected.handlerName || selected.handlerId || '-'}</dd></div>
                <div><dt>更新时间</dt><dd>{formatDate(selected.updatedAt)}</dd></div>
              </dl>
              <article className="feedback-content">{selected.content}</article>
              {selected.images?.length ? (
                <div className="feedback-images">{selected.images.map((image) => <img key={image} src={image} alt="用户反馈截图" />)}</div>
              ) : null}
              <label className="field-label">
                回复/处理备注
                <textarea rows={5} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="填写回复用户或内部处理备注" />
              </label>
              <div className="feedback-actions">
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as FeedbackStatus)}>
                  {feedbackStatuses.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <button type="button" disabled={saving} onClick={() => handleStatusUpdate(nextStatus)}>{saving ? '保存中...' : '保存回复'}</button>
                <button type="button" disabled={saving} onClick={() => handleStatusUpdate('resolved')}>标记完成</button>
              </div>
              {message && <p className="status-message saved">{message}</p>}
            </>
          )}
          {!detailLoading && !selected && <div className="api-panel">请选择一条反馈查看详情。</div>}
        </section>
      </div>
    </div>
  );
}
