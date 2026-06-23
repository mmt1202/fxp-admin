import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  contentTypeLabels,
  recommendationApi,
  statusLabels,
  type RecommendationContentType,
  type RecommendationPool,
  type RecommendationPoolItemPayload,
  type RecommendationPoolStatus,
} from '../api/recommendation';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const initialPoolForm = {
  name: '',
  code: 'home_feed',
  description: '',
  status: 'draft' as RecommendationPoolStatus,
};

const initialItemForm: RecommendationPoolItemPayload = {
  itemId: '',
  contentType: 'community_note',
  title: '',
  summary: '',
  coverUrl: '',
  sortOrder: 0,
  pinned: false,
  startsAt: '',
  endsAt: '',
  status: 'online',
};

const contentTypes = Object.keys(contentTypeLabels) as RecommendationContentType[];
const statuses = Object.keys(statusLabels) as RecommendationPoolStatus[];

export function RecommendationPools() {
  const [pools, setPools] = useState<RecommendationPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [poolForm, setPoolForm] = useState(initialPoolForm);
  const [itemForm, setItemForm] = useState<RecommendationPoolItemPayload>(initialItemForm);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');

  const selectedPool = useMemo(
    () => pools.find((pool) => pool.id === selectedPoolId) ?? pools[0],
    [pools, selectedPoolId],
  );

  const loadPools = async () => {
    setLoading(true);
    try {
      const data = await recommendationApi.getPools();
      setPools(data);
      setSelectedPoolId((current) => current || data[0]?.id || '');
      setMessage('');
      setSaveState('idle');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '推荐池读取失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadPools);
  }, []);

  const handleCreatePool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      const created = await recommendationApi.createPool(poolForm);
      setPools((current) => [created, ...current]);
      setSelectedPoolId(created.id);
      setPoolForm(initialPoolForm);
      setSaveState('saved');
      setMessage('推荐池已创建，可继续添加首页推荐内容。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '创建推荐池失败。');
    }
  };

  const handleUpdatePoolStatus = async (pool: RecommendationPool, status: RecommendationPoolStatus) => {
    setSaveState('saving');
    try {
      const updated = await recommendationApi.updatePool(pool.id, { status });
      setPools((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSaveState('saved');
      setMessage('推荐池状态已更新。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '更新推荐池失败。');
    }
  };

  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPool) {
      setSaveState('error');
      setMessage('请先创建或选择一个推荐池。');
      return;
    }

    setSaveState('saving');
    try {
      await recommendationApi.addPoolItem(selectedPool.id, itemForm);
      await loadPools();
      setItemForm({ ...initialItemForm, sortOrder: itemForm.sortOrder + 10 });
      setSelectedPoolId(selectedPool.id);
      setSaveState('saved');
      setMessage('推荐内容已添加，App 首页会读取该推荐池配置。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '添加推荐内容失败。');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedPool || !window.confirm('确认移除该推荐内容？')) {
      return;
    }

    setSaveState('saving');
    try {
      await recommendationApi.removePoolItem(selectedPool.id, itemId);
      setPools((current) => current.map((pool) => pool.id === selectedPool.id
        ? { ...pool, items: pool.items.filter((item) => item.id !== itemId && item.itemId !== itemId) }
        : pool));
      setSaveState('saved');
      setMessage('推荐内容已移除。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '移除推荐内容失败。');
    }
  };

  if (loading) {
    return <div className="module-page"><p className="eyebrow">推荐池管理</p><h1>正在加载推荐池...</h1></div>;
  }

  return (
    <div className="recommendation-page">
      <div className="page-heading">
        <p className="eyebrow">内容运营</p>
        <h1>推荐池管理</h1>
        <p>维护 App 首页推荐池，支持社区笔记、房源评价、AI 报告与官方文章的排序、置顶和定时上下线。</p>
      </div>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <div className="recommendation-layout">
        <section className="form-section">
          <h2>创建推荐池</h2>
          <form className="stack-form" onSubmit={handleCreatePool}>
            <label className="field-label">
              推荐池名称
              <input value={poolForm.name} onChange={(event) => setPoolForm({ ...poolForm, name: event.target.value })} placeholder="例如：首页精选" required />
            </label>
            <label className="field-label">
              推荐池编码
              <input value={poolForm.code} onChange={(event) => setPoolForm({ ...poolForm, code: event.target.value })} placeholder="home_feed" required />
            </label>
            <label className="field-label">
              状态
              <select value={poolForm.status} onChange={(event) => setPoolForm({ ...poolForm, status: event.target.value as RecommendationPoolStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
            <label className="field-label">
              说明
              <textarea value={poolForm.description} onChange={(event) => setPoolForm({ ...poolForm, description: event.target.value })} rows={3} />
            </label>
            <button type="submit" disabled={saveState === 'saving'}>创建推荐池</button>
          </form>
        </section>

        <section className="form-section">
          <h2>推荐池列表</h2>
          <div className="pool-list">
            {pools.length === 0 ? <p className="muted-text">暂无推荐池，请先创建。</p> : pools.map((pool) => (
              <button className={`pool-card ${selectedPool?.id === pool.id ? 'active' : ''}`} type="button" key={pool.id} onClick={() => setSelectedPoolId(pool.id)}>
                <strong>{pool.name}</strong>
                <span>{pool.code} · {statusLabels[pool.status]} · {pool.items.length} 条内容</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selectedPool ? (
        <section className="form-section recommendation-detail">
          <div className="section-title-row">
            <div>
              <h2>{selectedPool.name}</h2>
              <p className="muted-text">{selectedPool.description || '管理该推荐池的内容、顺序、置顶与生效时间。'}</p>
            </div>
            <select value={selectedPool.status} onChange={(event) => handleUpdatePoolStatus(selectedPool, event.target.value as RecommendationPoolStatus)}>
              {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </div>

          <form className="item-form" onSubmit={handleAddItem}>
            <label className="field-label">内容 ID<input value={itemForm.itemId} onChange={(event) => setItemForm({ ...itemForm, itemId: event.target.value })} required /></label>
            <label className="field-label">内容类型<select value={itemForm.contentType} onChange={(event) => setItemForm({ ...itemForm, contentType: event.target.value as RecommendationContentType })}>{contentTypes.map((type) => <option key={type} value={type}>{contentTypeLabels[type]}</option>)}</select></label>
            <label className="field-label">标题<input value={itemForm.title} onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })} required /></label>
            <label className="field-label">排序<input type="number" value={itemForm.sortOrder} onChange={(event) => setItemForm({ ...itemForm, sortOrder: Number(event.target.value) })} /></label>
            <label className="field-label">定时上线<input type="datetime-local" value={itemForm.startsAt} onChange={(event) => setItemForm({ ...itemForm, startsAt: event.target.value })} /></label>
            <label className="field-label">定时下线<input type="datetime-local" value={itemForm.endsAt} onChange={(event) => setItemForm({ ...itemForm, endsAt: event.target.value })} /></label>
            <label className="field-label wide-field">摘要<input value={itemForm.summary} onChange={(event) => setItemForm({ ...itemForm, summary: event.target.value })} /></label>
            <label className="switch-card inline-switch"><input type="checkbox" checked={itemForm.pinned} onChange={(event) => setItemForm({ ...itemForm, pinned: event.target.checked })} /><span><strong>置顶</strong><small>置顶内容优先展示在 App 首页。</small></span></label>
            <button type="submit" disabled={saveState === 'saving'}>添加内容</button>
          </form>

          <div className="recommendation-table">
            <div className="table-row table-head"><span>排序</span><span>内容</span><span>类型</span><span>上线时间</span><span>下线时间</span><span>操作</span></div>
            {[...selectedPool.items].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.sortOrder - b.sortOrder).map((item) => (
              <div className="table-row" key={item.id || item.itemId}>
                <span>{item.pinned ? '📌 ' : ''}{item.sortOrder}</span>
                <span><strong>{item.title}</strong><small>{item.itemId}</small></span>
                <span>{contentTypeLabels[item.contentType]}</span>
                <span>{item.startsAt || '立即'}</span>
                <span>{item.endsAt || '长期'}</span>
                <span><button className="danger-button" type="button" onClick={() => handleRemoveItem(item.id || item.itemId)}>移除</button></span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
