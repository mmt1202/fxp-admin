import { useEffect, useState } from 'react';
import { PropertyCompleteness, propertyApi } from '../api/properties';

type LoadState = {
  loading: boolean;
  error?: string;
  items: PropertyCompleteness[];
};

export function PropertyGovernance() {
  const [onlyLowScore, setOnlyLowScore] = useState(false);
  const [state, setState] = useState<LoadState>({ loading: true, items: [] });

  useEffect(() => {
    let active = true;

    propertyApi.getPropertyCompletenessList(onlyLowScore ? { belowScore: 60 } : undefined)
      .then((data) => {
        if (active) {
          setState({ loading: false, items: data.items });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ loading: false, items: [], error: error instanceof Error ? error.message : '完整度数据加载失败' });
        }
      });

    return () => {
      active = false;
    };
  }, [onlyLowScore]);

  return (
    <div className="governance-page">
      <div className="page-heading governance-heading">
        <div>
          <p className="eyebrow">房源数据治理</p>
          <h1>房源数据治理</h1>
          <p>按基础信息、地址信息、图片信息、周边信息、评价信息与 AI 评房信息检查房源完整度。</p>
        </div>
        <label className="filter-toggle">
          <input type="checkbox" checked={onlyLowScore} onChange={(event) => {
            setOnlyLowScore(event.target.checked);
            setState((current) => ({ ...current, loading: true, error: undefined }));
          }} />
          仅查看低于 60 分
        </label>
      </div>

      {state.loading && <div className="api-panel">正在加载完整度评分...</div>}
      {state.error && <div className="api-panel error">{state.error}</div>}
      {!state.loading && !state.error && (
        <div className="governance-grid">
          {state.items.map((item) => (
            <article className="governance-card" key={item.propertyId}>
              <div className="card-title-row">
                <div>
                  <strong>{item.propertyName}</strong>
                  <span>ID：{item.propertyId}</span>
                </div>
                <span className={`score-badge ${item.score < 60 ? 'danger' : ''}`}>{item.score} 分</span>
              </div>

              <div className="dimension-list">
                {item.dimensions.map((dimension) => (
                  <div className="dimension-row" key={dimension.key}>
                    <span>{dimension.label}</span>
                    <meter min="0" max="100" value={dimension.score}>{dimension.score}</meter>
                    <b>{dimension.score}</b>
                  </div>
                ))}
              </div>

              <details className="missing-details">
                <summary>查看缺失项（{item.missingItems.length}）</summary>
                {item.missingItems.length > 0 ? (
                  <ul>{item.missingItems.map((missing) => <li key={missing}>{missing}</li>)}</ul>
                ) : <p>暂无缺失项</p>}
              </details>
            </article>
          ))}
          {state.items.length === 0 && <div className="empty-state">暂无符合条件的房源</div>}
        </div>
      )}
    </div>
  );
}
