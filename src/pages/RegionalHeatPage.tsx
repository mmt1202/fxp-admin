import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi, CommunityAnalyticsItem, LocationAnalyticsFilters, LocationAnalyticsItem } from '../api/analytics';

const metricCards = [
  { key: 'propertyCount', label: '城市房源数量' },
  { key: 'communityCount', label: '小区房源覆盖' },
  { key: 'reviewCount', label: '小区评价数量' },
  { key: 'aiReviewCount', label: 'AI 评房次数' },
  { key: 'favoriteAndViewCount', label: '收藏/浏览次数' },
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function toRequestFilters(filters: LocationAnalyticsFilters) {
  return {
    city: filters.city?.trim() || undefined,
    district: filters.district?.trim() || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };
}

export function RegionalHeatPage() {
  const [filters, setFilters] = useState<LocationAnalyticsFilters>({});
  const [draftFilters, setDraftFilters] = useState<LocationAnalyticsFilters>({});
  const [locations, setLocations] = useState<LocationAnalyticsItem[]>([]);
  const [communities, setCommunities] = useState<CommunityAnalyticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const [locationResponse, communityResponse] = await Promise.all([
          analyticsApi.getLocations(filters),
          analyticsApi.getCommunities(filters),
        ]);

        if (!isMounted) return;
        setLocations(locationResponse.items);
        setCommunities(communityResponse.items);
      } catch (loadError) {
        if (!isMounted) return;
        setLocations([]);
        setCommunities([]);
        setError(loadError instanceof Error ? loadError.message : '区域热度数据加载失败');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const totals = useMemo(() => locations.reduce((summary, item) => ({
    propertyCount: summary.propertyCount + item.propertyCount,
    communityCount: summary.communityCount + item.communityCount,
    reviewCount: summary.reviewCount + item.reviewCount,
    aiReviewCount: summary.aiReviewCount + item.aiReviewCount,
    favoriteAndViewCount: summary.favoriteAndViewCount + item.favoriteCount + item.viewCount,
  }), { propertyCount: 0, communityCount: 0, reviewCount: 0, aiReviewCount: 0, favoriteAndViewCount: 0 }), [locations]);

  const hasLocationRows = locations.length > 0;
  const hasCommunityRows = communities.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(toRequestFilters(draftFilters));
  };

  const handleReset = () => {
    setDraftFilters({});
    setFilters({});
  };

  return (
    <div className="regional-heat-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">地理维度统计</p>
          <h1>区域热度</h1>
          <p>按城市、区域与时间范围分析房源供给、评价互动、AI 评房和用户收藏/浏览热度。</p>
        </div>
        <span className="map-badge">地图可视化预留</span>
      </div>

      <form className="filter-bar" onSubmit={handleSubmit}>
        <label>
          城市
          <input value={draftFilters.city ?? ''} placeholder="如：上海" onChange={(event) => setDraftFilters((value) => ({ ...value, city: event.target.value }))} />
        </label>
        <label>
          区域
          <input value={draftFilters.district ?? ''} placeholder="如：浦东新区" onChange={(event) => setDraftFilters((value) => ({ ...value, district: event.target.value }))} />
        </label>
        <label>
          开始时间
          <input type="date" value={draftFilters.startDate ?? ''} onChange={(event) => setDraftFilters((value) => ({ ...value, startDate: event.target.value }))} />
        </label>
        <label>
          结束时间
          <input type="date" value={draftFilters.endDate ?? ''} onChange={(event) => setDraftFilters((value) => ({ ...value, endDate: event.target.value }))} />
        </label>
        <div className="filter-actions">
          <button type="submit" disabled={isLoading}>{isLoading ? '加载中' : '查询'}</button>
          <button className="button-secondary" type="button" onClick={handleReset} disabled={isLoading}>重置</button>
        </div>
      </form>

      {error && <p className="analytics-warning">区域热度接口加载失败：{error}</p>}

      <div className="metric-grid" aria-busy={isLoading}>
        {metricCards.map((metric) => <div className="metric-card" key={metric.key}><span>{metric.label}</span><strong>{formatNumber(totals[metric.key])}</strong></div>)}
      </div>

      <section className="ranking-section">
        <h2>城市排行</h2>
        <div className="analytics-table">
          <div className="table-row table-head"><span>城市/区域</span><span>房源</span><span>小区</span><span>评价</span><span>AI 评房</span><span>收藏/浏览</span><span>热度</span></div>
          {hasLocationRows ? locations.map((item) => (
            <div className="table-row" key={`${item.city}-${item.district ?? 'all'}`}>
              <span>{item.city}{item.district ? ` · ${item.district}` : ''}</span><span>{formatNumber(item.propertyCount)}</span><span>{formatNumber(item.communityCount)}</span><span>{formatNumber(item.reviewCount)}</span><span>{formatNumber(item.aiReviewCount)}</span><span>{formatNumber(item.favoriteCount)} / {formatNumber(item.viewCount)}</span><strong>{item.heatScore}</strong>
            </div>
          )) : <div className="empty-state">暂无城市热度数据，请调整筛选条件后重试。</div>}
        </div>
      </section>

      <section className="ranking-section">
        <h2>小区排行</h2>
        {hasCommunityRows ? (
          <div className="community-grid">
            {communities.map((item) => (
              <Link className="community-card" key={item.id} to={`/properties?communityId=${encodeURIComponent(item.id)}`}>
                <div><strong>{item.name}</strong><span>{item.city}{item.district ? ` · ${item.district}` : ''}</span></div>
                <b>{item.heatScore}</b>
                <p>{formatNumber(item.propertyCount)} 套房源 · {formatNumber(item.reviewCount)} 条评价 · {formatNumber(item.aiReviewCount)} 次 AI 评房</p>
                <small>收藏 {formatNumber(item.favoriteCount)} / 浏览 {formatNumber(item.viewCount)}，点击查看房源列表</small>
              </Link>
            ))}
          </div>
        ) : <div className="empty-state">暂无小区热度数据，请调整筛选条件后重试。</div>}
      </section>
    </div>
  );
}
