import { useEffect, useMemo, useState } from 'react';
import { apiClient, type AdminOrder, type ListResult } from '../api/client';

type PageState = {
  loading: boolean;
  error?: string;
  result: ListResult<AdminOrder>;
};

const statusLabels: Record<string, string> = {
  paid: '已支付',
  pending: '待支付',
  refunded: '已退款',
  refunding: '退款中',
  cancelled: '已取消',
  completed: '已完成',
};

function text(record: AdminOrder, keys: string[], fallback = '-') {
  const value = keys.map((key) => record[key]).find((item) => item !== undefined && item !== null && item !== '');
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function money(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '-';
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN');
}

export function OrdersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ keyword: '', status: '' });
  const [state, setState] = useState<PageState>({ loading: true, result: { items: [] } });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setState((current) => ({ ...current, loading: true, error: undefined })); });
    apiClient.getOrders({ keyword: appliedFilters.keyword || undefined, status: appliedFilters.status || undefined })
      .then((result) => !cancelled && setState({ loading: false, result }))
      .catch((error: unknown) => !cancelled && setState({ loading: false, result: { items: [] }, error: error instanceof Error ? error.message : '订单接口加载失败。' }));
    return () => { cancelled = true; };
  }, [appliedFilters]);

  const summary = useMemo(() => {
    const items = state.result.items;
    const paidAmount = items.reduce((sum, order) => sum + (Number(order.amount ?? order.payAmount ?? order.totalAmount) || 0), 0);
    const refundCount = items.filter((order) => String(order.status ?? '').includes('refund')).length;
    return { total: state.result.total ?? items.length, paidAmount, refundCount };
  }, [state.result]);

  return (
    <div className="module-page orders-page">
      <p className="eyebrow">交易履约</p>
      <h1>订单管理</h1>
      <p>查看订单、支付状态、退款进度与履约记录。该页面已接入后端订单列表接口；若接口暂未返回数据，将明确展示空状态。</p>

      <form className="filter-panel" onSubmit={(event) => { event.preventDefault(); setAppliedFilters({ keyword, status }); }}>
        <input placeholder="搜索订单号、用户、商品" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="submit">查询</button>
      </form>

      <div className="placeholder-grid data-grid">
        <div><strong>订单总数</strong><span>{summary.total}</span></div>
        <div><strong>列表金额合计</strong><span>{money(summary.paidAmount)}</span></div>
        <div><strong>退款相关订单</strong><span>{summary.refundCount}</span></div>
      </div>

      {state.loading ? <p className="empty-state">正在加载订单列表...</p> : null}
      {state.error ? <p className="error-state">{state.error}</p> : null}
      {!state.loading && !state.error ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>订单号</th><th>用户</th><th>商品/权益</th><th>状态</th><th>金额</th><th>支付时间</th><th>退款进度</th></tr></thead>
            <tbody>
              {state.result.items.map((order, index) => {
                const rawStatus = text(order, ['status'], 'pending');
                return (
                  <tr key={text(order, ['id', 'orderId', '_id'], String(index))}>
                    <td>{text(order, ['orderNo', 'orderId', 'id', '_id'])}</td>
                    <td>{text(order, ['userName', 'nickname', 'userId'])}</td>
                    <td>{text(order, ['productName', 'planName', 'title', 'subject'])}</td>
                    <td>{statusLabels[rawStatus] ?? rawStatus}</td>
                    <td>{money(order.amount ?? order.payAmount ?? order.totalAmount)}</td>
                    <td>{formatDate(order.paidAt ?? order.payTime ?? order.createdAt)}</td>
                    <td>{text(order, ['refundStatus', 'refundProgress'], '无退款')}</td>
                  </tr>
                );
              })}
              {!state.result.items.length ? <tr><td colSpan={7}>暂无订单数据；如后端接口未完成，请等待后端接口。</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
