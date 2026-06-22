import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminProperty,
  deleteAdminProperty,
  getAdminProperties,
  getAdminProperty,
  updateAdminPropertyVisibility,
} from '../api/properties';

const pageSize = 10;

type Filters = {
  keyword: string;
  userId: string;
  isPublic: string;
};

function getPropertyTitle(property: AdminProperty) {
  return property.title || property.name || `房源 #${property.id}`;
}

function getOwnerId(property: AdminProperty) {
  return property.userId ?? property.ownerId ?? '-';
}

function isPropertyPublic(property: AdminProperty) {
  if (typeof property.isPublic === 'boolean') {
    return property.isPublic;
  }

  return property.visibility === 'public' || property.visibility === true;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

export function Properties() {
  const [filters, setFilters] = useState<Filters>({ keyword: '', userId: '', isPublic: '' });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);
  const [page, setPage] = useState(1);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  useEffect(() => {
    let ignore = false;

    async function loadProperties() {
      setLoading(true);
      setError('');

      try {
        const result = await getAdminProperties({ ...appliedFilters, page, pageSize });
        if (!ignore) {
          setProperties(result.items);
          setTotal(result.total);
        }
      } catch {
        if (!ignore) {
          setError('房源列表加载失败，请确认后端 /admin/properties 接口已上线。');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, page]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleViewDetail = async (property: AdminProperty) => {
    setDetailLoading(true);
    setError('');

    try {
      const detail = await getAdminProperty(property.id);
      setSelectedProperty(detail);
    } catch {
      setError('房源详情加载失败。');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleVisibility = async (property: AdminProperty) => {
    const nextVisibility = !isPropertyPublic(property);
    setError('');

    try {
      const updated = await updateAdminPropertyVisibility(property.id, nextVisibility);
      setProperties((current) => current.map((item) => (item.id === property.id ? { ...item, ...updated } : item)));
      setSelectedProperty((current) => (current?.id === property.id ? { ...current, ...updated } : current));
    } catch {
      setError('公开状态修改失败。');
    }
  };

  const handleDelete = async (property: AdminProperty) => {
    const confirmed = window.confirm(`确认软删除“${getPropertyTitle(property)}”吗？`);
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteAdminProperty(property.id);
      setProperties((current) => current.filter((item) => item.id !== property.id));
      setTotal((current) => Math.max(0, current - 1));
      setSelectedProperty((current) => (current?.id === property.id ? null : current));
    } catch {
      setError('房源软删除失败。');
    }
  };

  return (
    <div className="module-page properties-page">
      <p className="eyebrow">房源管理</p>
      <h1>房源管理</h1>
      <p>通过管理员接口检索房源、查看详情、调整公开状态并软删除违规房源。</p>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          value={filters.keyword}
          onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          placeholder="关键词：标题 / 地址"
        />
        <input
          value={filters.userId}
          onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}
          placeholder="用户 ID"
        />
        <select
          value={filters.isPublic}
          onChange={(event) => setFilters((current) => ({ ...current, isPublic: event.target.value }))}
        >
          <option value="">全部公开状态</option>
          <option value="true">公开</option>
          <option value="false">不公开</option>
        </select>
        <button type="submit" disabled={loading}>查询</button>
      </form>

      {error && <div className="error-text">{error}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>房源</th>
              <th>位置</th>
              <th>用户 ID</th>
              <th>公开状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id}>
                <td>{getPropertyTitle(property)}</td>
                <td>{property.address || [property.city, property.district].filter(Boolean).join(' ') || '-'}</td>
                <td>{getOwnerId(property)}</td>
                <td><span className={`status-pill ${isPropertyPublic(property) ? 'success' : 'muted'}`}>{isPropertyPublic(property) ? '公开' : '不公开'}</span></td>
                <td>{formatDate(property.updatedAt || property.createdAt)}</td>
                <td className="action-group">
                  <button type="button" onClick={() => handleViewDetail(property)} disabled={detailLoading}>详情</button>
                  <button type="button" className="secondary-button" onClick={() => handleToggleVisibility(property)}>
                    {isPropertyPublic(property) ? '设为不公开' : '设为公开'}
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(property)}>软删除</button>
                </td>
              </tr>
            ))}
            {!loading && properties.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">暂无房源数据</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="loading-row">加载中...</div>}
      </div>

      <div className="pagination-bar">
        <span>共 {total} 条，第 {page} / {totalPages} 页</span>
        <div>
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>上一页</button>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>下一页</button>
        </div>
      </div>

      {selectedProperty && (
        <aside className="detail-panel">
          <div>
            <p className="eyebrow">房源详情</p>
            <h2>{getPropertyTitle(selectedProperty)}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => setSelectedProperty(null)}>关闭</button>
          <pre>{JSON.stringify(selectedProperty, null, 2)}</pre>
        </aside>
      )}
    </div>
  );
}
