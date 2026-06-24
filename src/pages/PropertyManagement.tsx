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

function getPropertyName(property: AdminProperty) {
  return String(property.name ?? property.title ?? '未命名房源');
}

function getCompletenessScore(property: AdminProperty) {
  const score = property.completenessScore ?? property.completeness?.score;
  return typeof score === 'number' ? score : Number(score ?? 0);
}

export function PropertyManagement() {
  const [state, setState] = useState<LoadState>({ loading: true, properties: [] });

  useEffect(() => {
    let active = true;

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

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="module-page">
      <p className="eyebrow">房源管理</p>
      <h1>房源管理</h1>
      <p>维护房源基础信息、上下架状态、区域与配套标签，并展示后端返回的房源完整度分数。</p>

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
        </div>
      )}
    </div>
  );
}
