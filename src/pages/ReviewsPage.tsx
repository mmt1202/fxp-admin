import { useEffect, useMemo, useState } from 'react';
import { apiClient, type ListResult, type Review } from '../api/client';

type ReviewState = {
  loading: boolean;
  error?: string;
  result: ListResult<Review>;
};

const statusLabels: Record<string, string> = {
  visible: '展示中',
  hidden: '已隐藏',
  deleted: '已删除',
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

function text(record: Review, keys: string[], fallback = '-') {
  const value = keys.map((key) => record[key]).find((item) => item !== undefined && item !== null && item !== '');
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN');
}

function formatRating(value: unknown) {
  const rating = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(rating) ? `${rating.toFixed(1)} 分` : '-';
}

export function ReviewsPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ keyword: '', status: '' });
  const [state, setState] = useState<ReviewState>({ loading: true, result: { items: [] } });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setState((current) => ({ ...current, loading: true, error: undefined })); });
    apiClient.getReviews({ keyword: appliedFilters.keyword || undefined, status: appliedFilters.status || undefined })
      .then((result) => !cancelled && setState({ loading: false, result }))
      .catch((error: unknown) => !cancelled && setState({ loading: false, result: { items: [] }, error: error instanceof Error ? error.message : '评价接口加载失败。' }));
    return () => { cancelled = true; };
  }, [appliedFilters]);

  const summary = useMemo(() => {
    const items = state.result.items;
    const visibleCount = items.filter((review) => ['visible', 'approved'].includes(String(review.status ?? review.reviewStatus ?? ''))).length;
    const averageRating = items.length ? items.reduce((sum, review) => sum + (Number(review.rating ?? review.score) || 0), 0) / items.length : 0;
    return { total: state.result.total ?? items.length, visibleCount, averageRating };
  }, [state.result]);

  return (
    <div className="module-page reviews-page">
      <p className="eyebrow">内容运营</p>
      <h1>评价管理</h1>
      <p>查看房源评价、评分维度、内容质量与互动数据。该页面已接入后端评价列表接口；接口未完成或无数据时不会伪装成已完成。</p>

      <form className="filter-panel" onSubmit={(event) => { event.preventDefault(); setAppliedFilters({ keyword, status }); }}>
        <input placeholder="搜索评价内容、用户、房源 ID" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="submit">查询</button>
      </form>

      <div className="placeholder-grid data-grid">
        <div><strong>评价总数</strong><span>{summary.total}</span></div>
        <div><strong>展示中</strong><span>{summary.visibleCount}</span></div>
        <div><strong>列表平均分</strong><span>{summary.averageRating ? formatRating(summary.averageRating) : '-'}</span></div>
      </div>

      {state.loading ? <p className="empty-state">正在加载评价列表...</p> : null}
      {state.error ? <p className="error-state">{state.error}</p> : null}
      {!state.loading && !state.error ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>评价 ID</th><th>用户</th><th>房源</th><th>评分</th><th>状态</th><th>内容</th><th>创建时间</th></tr></thead>
            <tbody>
              {state.result.items.map((review, index) => {
                const rawStatus = text(review, ['status', 'reviewStatus'], 'pending');
                return (
                  <tr key={text(review, ['id', 'reviewId', '_id'], String(index))}>
                    <td>{text(review, ['id', 'reviewId', '_id'])}</td>
                    <td>{text(review, ['userName', 'nickname', 'userId'])}</td>
                    <td>{text(review, ['propertyTitle', 'houseTitle', 'propertyId', 'houseId'])}</td>
                    <td>{formatRating(review.rating ?? review.score)}</td>
                    <td>{statusLabels[rawStatus] ?? rawStatus}</td>
                    <td>{text(review, ['content', 'comment', 'summary'])}</td>
                    <td>{formatDate(review.createdAt ?? review.updatedAt)}</td>
                  </tr>
                );
              })}
              {!state.result.items.length ? <tr><td colSpan={7}>暂无评价数据；如后端接口未完成，请等待后端接口。</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
