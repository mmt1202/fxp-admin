import { useEffect, useMemo, useState } from 'react';
import { featureApi as apiClient, type AiCostByUser, type AiCostOverview, type AiCostRecord } from '../api/migratedFeatures';

type Filters = { startDate: string; endDate: string; model: string; userId: string };
type PageState = { loading: boolean; error?: string; overview?: AiCostOverview; records: AiCostRecord[]; users: AiCostByUser[] };

const initialFilters: Filters = {
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  model: '',
  userId: '',
};

function asNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function readNumber(source: Record<string, unknown> | undefined, keys: string[]) {
  return keys.reduce((found, key) => (found !== undefined ? found : source?.[key]), undefined as unknown | undefined);
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(asNumber(value));
}

function formatInteger(value: unknown) {
  return new Intl.NumberFormat('zh-CN').format(asNumber(value));
}

function getText(source: Record<string, unknown>, keys: string[], fallback = '-') {
  const value = keys.reduce((found, key) => (found !== undefined ? found : source[key]), undefined as unknown | undefined);
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function buildQuery(filters: Filters) {
  return { startTime: filters.startDate || undefined, endTime: filters.endDate || undefined, model: filters.model || undefined, userId: filters.userId || undefined };
}

function downloadCsv(records: AiCostRecord[]) {
  const headers = ['调用时间', '模型', '用户 ID', '房源 ID', '输入 Token', '输出 Token', '预估成本'];
  const rows = records.map((record) => {
    const row = record as Record<string, unknown>;
    return [getText(row, ['calledAt', 'createdAt', 'callTime', 'time']), getText(row, ['model', 'modelName']), getText(row, ['userId', 'uid']), getText(row, ['propertyId', 'listingId', 'houseId']), getText(row, ['inputTokens', 'promptTokens']), getText(row, ['outputTokens', 'completionTokens']), getText(row, ['estimatedCost', 'cost'])];
  });
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-cost-records-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AiCostMonitor() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [state, setState] = useState<PageState>({ loading: true, records: [], users: [] });
  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.getAiCostOverview(query),
      apiClient.getAiCostRecords({ ...query, page: 1, pageSize: 100 }),
      apiClient.getAiCostsByUser(query),
    ])
      .then(([overview, records, users]) => {
        if (!ignore) setState({ loading: false, overview, records: records.items, users: users.items });
      })
      .catch((error: unknown) => {
        if (!ignore) setState((previous) => ({ ...previous, loading: false, error: error instanceof Error ? error.message : 'AI 成本接口请求失败' }));
      });
    return () => { ignore = true; };
  }, [query]);

  const overview = state.overview as Record<string, unknown> | undefined;
  const todayCost = readNumber(overview, ['todayCost', 'dailyCost', 'costToday']);
  const monthCost = readNumber(overview, ['monthCost', 'monthlyCost', 'costThisMonth']);
  const avgUserCost = readNumber(overview, ['avgUserCost', 'averageUserCost', 'perUserAverageCost']);

  return (
    <div className="ai-cost-page">
      <div className="page-heading"><p className="eyebrow">AI Cost Monitor</p><h1>AI 成本监控</h1><p>按时间、模型、用户筛选 AI 调用记录，统计 Token 消耗与预估成本，并支持导出明细。</p></div>
      <div className="filter-bar"><label>开始日期<input type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></label><label>结束日期<input type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></label><label>模型<input placeholder="如 gpt-4.1-mini" value={filters.model} onChange={(event) => setFilters({ ...filters, model: event.target.value })} /></label><label>用户 ID<input placeholder="输入用户 ID" value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} /></label><button type="button" onClick={() => downloadCsv(state.records)} disabled={!state.records.length}>导出明细</button></div>
      {state.error && <div className="api-panel error">{state.error}</div>}
      <div className="metric-grid"><article><span>今日成本</span><strong>{formatCurrency(todayCost)}</strong></article><article><span>本月成本</span><strong>{formatCurrency(monthCost)}</strong></article><article><span>单用户平均成本</span><strong>{formatCurrency(avgUserCost)}</strong></article><article><span>调用记录</span><strong>{formatInteger(state.records.length)}</strong></article></div>
      <section className="table-section"><div className="section-title"><h2>高成本用户排行</h2><span>{state.loading ? '加载中...' : `${state.users.length} 位用户`}</span></div><table><thead><tr><th>用户 ID</th><th>调用次数</th><th>Token 总量</th><th>预估成本</th></tr></thead><tbody>{state.users.map((user, index) => { const row = user as Record<string, unknown>; return <tr key={`${getText(row, ['userId', 'uid'])}-${index}`}><td>{getText(row, ['userId', 'uid'])}</td><td>{formatInteger(readNumber(row, ['callCount', 'calls']))}</td><td>{formatInteger(readNumber(row, ['totalTokens', 'tokens']))}</td><td>{formatCurrency(readNumber(row, ['estimatedCost', 'totalCost', 'cost']))}</td></tr>; })}</tbody></table></section>
      <section className="table-section"><div className="section-title"><h2>调用明细</h2><span>{state.loading ? '加载中...' : `${state.records.length} 条记录`}</span></div><table><thead><tr><th>调用时间</th><th>模型</th><th>用户 ID</th><th>房源 ID</th><th>输入 Token</th><th>输出 Token</th><th>成本</th></tr></thead><tbody>{state.records.map((record, index) => { const row = record as Record<string, unknown>; return <tr key={`${getText(row, ['id', 'callId'], String(index))}`}><td>{getText(row, ['calledAt', 'createdAt', 'callTime', 'time'])}</td><td>{getText(row, ['model', 'modelName'])}</td><td>{getText(row, ['userId', 'uid'])}</td><td>{getText(row, ['propertyId', 'listingId', 'houseId'])}</td><td>{formatInteger(readNumber(row, ['inputTokens', 'promptTokens']))}</td><td>{formatInteger(readNumber(row, ['outputTokens', 'completionTokens']))}</td><td>{formatCurrency(readNumber(row, ['estimatedCost', 'cost']))}</td></tr>; })}</tbody></table></section>
    </div>
  );
}
