import { useEffect, useState } from 'react';
import { AdminProperty, propertyApi } from '../api/properties';

type LoadState = {
  loading: boolean;
  error?: string;
  properties: AdminProperty[];
};

function getPropertyId(property: AdminProperty) {
  return String(property.id ?? property.propertyId ?? '-');
}
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminProperty,
  AdminPropertyReview,
  deleteAdminProperty,
  getAdminProperties,
  getAdminProperty,
  getAdminPropertyReviews,
  updateAdminPropertyVisibility,
} from '../api/properties';

const PAGE_SIZE = 10;

const visibilityText = (property: AdminProperty) => {
  if (typeof property.isPublic === 'boolean') {
    return property.isPublic ? '公开' : '已下架';
  }
  if (property.visibility === true) return '公开';
  if (property.visibility === false) return '已下架';
  if (property.visibility === 'public') return '公开';
  if (property.visibility === 'hidden') return '已下架';
  if (property.visibility === 'draft') return '草稿';
  if (property.visibility === 'archived') return '已归档';
  return '未知';
};

function getPropertyName(property: AdminProperty) {
  return String(property.name ?? property.title ?? '未命名房源');
}
const isPropertyPublic = (property: AdminProperty) => visibilityText(property) === '公开';

function getCompletenessScore(property: AdminProperty) {
  const score = property.completenessScore ?? property.completeness?.score;
  return typeof score === 'number' ? score : Number(score ?? 0);
}
const formatDate = (value?: string) => value ? new Date(value).toLocaleString('zh-CN') : '-';

export function PropertyManagement() {
  const [state, setState] = useState<LoadState>({ loading: true, properties: [] });
  const [filters, setFilters] = useState({ keyword: '', city: '', district: '', userId: '', visibility: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminProperty | null>(null);
  const [reviews, setReviews] = useState<AdminPropertyReview[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminProperties({ ...appliedFilters, page, pageSize: PAGE_SIZE });
      setProperties(result.items);
      setTotal(result.total);
    } catch {
      setError('房源列表加载失败，请检查后端管理员房源接口。');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadProperties();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProperties]);

    propertyApi.getProperties()
      .then((data) => {
        if (active) {
          setState({ loading: false, properties: data.items });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ loading: false, properties: [], error: error instanceof Error ? error.message : '房源列表加载失败' });
        }
      });
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleView = async (property: AdminProperty) => {
    setDetailLoading(true);
    setSelected(property);
    setReviews([]);
    try {
      const [detail, reviewList] = await Promise.all([
        getAdminProperty(property.id),
        getAdminPropertyReviews(property.id),
      ]);
      setSelected(detail);
      setReviews(reviewList);
    } catch {
      setError('房源详情或评价加载失败。');
    } finally {
      setDetailLoading(false);
    }
  };

    return () => {
      active = false;
    };
  }, []);
  const handleVisibility = async (property: AdminProperty, nextPublic: boolean) => {
    setActionLoadingId(property.id);
    setError('');
    try {
      await updateAdminPropertyVisibility(property.id, nextPublic);
      await loadProperties();
      if (selected?.id === property.id) {
        setSelected({ ...selected, isPublic: nextPublic, visibility: nextPublic ? 'public' : 'hidden' });
      }
    } catch {
      setError(nextPublic ? '恢复房源失败，请稍后重试。' : '下架房源失败，请稍后重试。');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (property: AdminProperty) => {
    if (!window.confirm(`确认删除房源「${property.title}」吗？此操作会写入后台操作日志。`)) return;
    setActionLoadingId(property.id);
    setError('');
    try {
      await deleteAdminProperty(property.id);
      setSelected((current) => current?.id === property.id ? null : current);
      await loadProperties();
    } catch {
      setError('删除房源失败，请稍后重试。');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="module-page">
      <p className="eyebrow">房源管理</p>
      <h1>房源管理</h1>
      <p>维护房源基础信息、上下架状态、区域与配套标签，并展示后端返回的房源完整度分数。</p>
    <div className="property-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Property Admin</p>
          <h1>房源管理</h1>
          <p>按关键词、城市/区域、用户 ID 和公开状态检索房源，并执行查看、下架、恢复、删除等管理员操作。</p>
        </div>
      </div>

      <form className="filter-panel" onSubmit={handleSearch}>
        <input placeholder="关键词：标题/地址" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
        <input placeholder="城市" value={filters.city} onChange={(event) => setFilters({ ...filters, city: event.target.value })} />
        <input placeholder="区域" value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} />
        <input placeholder="用户 ID" value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} />
        <select value={filters.visibility} onChange={(event) => setFilters({ ...filters, visibility: event.target.value })}>
          <option value="">全部状态</option>
          <option value="public">公开</option>
          <option value="hidden">已下架</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? '查询中...' : '查询'}</button>
      </form>

      {state.loading && <div className="api-panel">正在加载房源数据...</div>}
      {state.error && <div className="api-panel error">{state.error}</div>}
      {!state.loading && !state.error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>房源 ID</th>
                <th>房源名称</th>
                <th>完整度</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {state.properties.map((property) => {
                const score = getCompletenessScore(property);
                return (
                  <tr key={getPropertyId(property)}>
                    <td>{getPropertyId(property)}</td>
                    <td>{getPropertyName(property)}</td>
                    <td><span className={`score-badge ${score < 60 ? 'danger' : ''}`}>{score} 分</span></td>
                    <td>{String(property.status ?? property.onlineStatus ?? '-')}</td>
                  </tr>
                );
              })}
              {state.properties.length === 0 && <tr><td colSpan={4}>暂无房源数据</td></tr>}
            </tbody>
          </table>
      {error && <div className="error-text">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>房源 ID</th>
              <th>标题/地址</th>
              <th>所属用户</th>
              <th>城市/区域</th>
              <th>公开状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => {
              const isActionLoading = actionLoadingId === property.id;
              return (
              <tr key={property.id}>
                <td>{property.id}</td>
                <td><strong>{property.title}</strong><span>{property.address ?? '-'}</span></td>
                <td>{property.userName ?? property.userId ?? '-'}</td>
                <td>{property.city ?? '-'} / {property.district ?? property.area ?? '-'}</td>
                <td><span className={`status-pill ${isPropertyPublic(property) ? 'online' : 'offline'}`}>{visibilityText(property)}</span></td>
                <td>{formatDate(property.createdAt)}</td>
                <td>{formatDate(property.updatedAt)}</td>
                <td className="actions">
                  <button type="button" className="secondary" disabled={isActionLoading} onClick={() => void handleView(property)}>详情</button>
                  {isPropertyPublic(property) ? (
                    <button type="button" className="warning" disabled={isActionLoading} onClick={() => void handleVisibility(property, false)}>{isActionLoading ? '处理中' : '下架'}</button>
                  ) : (
                    <button type="button" disabled={isActionLoading} onClick={() => void handleVisibility(property, true)}>{isActionLoading ? '处理中' : '恢复'}</button>
                  )}
                  <button type="button" className="danger" disabled={isActionLoading} onClick={() => void handleDelete(property)}>删除</button>
                </td>
              </tr>
              );
            })}
            {!loading && properties.length === 0 && <tr><td colSpan={8} className="empty-cell">暂无房源数据</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <span>共 {total} 条，第 {page} / {totalPages} 页</span>
        <div>
          <button type="button" className="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>上一页</button>
          <button type="button" className="secondary" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>下一页</button>
        </div>
      </div>

      {selected && (
        <aside className="detail-panel">
          <button type="button" className="close-button" onClick={() => setSelected(null)}>×</button>
          <p className="eyebrow">房源详情</p>
          <h2>{selected.title}</h2>
          <p>{selected.address ?? '暂无地址'}</p>
          <dl>
            <dt>房源 ID</dt><dd>{selected.id}</dd>
            <dt>所属用户</dt><dd>{selected.userName ?? selected.userId ?? '-'}</dd>
            <dt>城市/区域</dt><dd>{selected.city ?? '-'} / {selected.district ?? selected.area ?? '-'}</dd>
            <dt>公开状态</dt><dd>{visibilityText(selected)}</dd>
            <dt>创建时间</dt><dd>{formatDate(selected.createdAt)}</dd>
            <dt>更新时间</dt><dd>{formatDate(selected.updatedAt)}</dd>
          </dl>
          <h3>房源评价</h3>
          {detailLoading && <p>加载中...</p>}
          {!detailLoading && reviews.length === 0 && <p>暂无评价</p>}
          {reviews.map((review) => <div className="review-item" key={review.id}><strong>{review.userName ?? '匿名用户'} · {review.rating ?? '-'} 分</strong><p>{review.content ?? '-'}</p></div>)}
        </aside>
      )}
    </div>
  );
}
