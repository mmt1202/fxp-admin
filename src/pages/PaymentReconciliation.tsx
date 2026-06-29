import { useCallback, useEffect, useMemo, useState } from 'react';
import { featureApi as apiClient, type PaymentRecord, type ReconciliationRecord, type ReconciliationSummary } from '../api/migratedFeatures';

type FilterState = {
  startDate: string;
  endDate: string;
  channel: string;
};

const channelOptions = [
  { value: '', label: '全部渠道' },
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'manual', label: '人工入账' },
];

const emptySummary: ReconciliationSummary = { success: 0, failed: 0, exception: 0, total: 0 };

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '-';
}

function getOrderNo(record: ReconciliationRecord | PaymentRecord) {
  return record.localOrderNo ?? record.orderNo ?? '-';
}

function getTransactionNo(record: ReconciliationRecord | PaymentRecord) {
  return record.thirdPartyTransactionNo ?? record.transactionNo ?? '-';
}

function getDifferenceReason(record: ReconciliationRecord) {
  return record.differenceReason ?? record.diffReason ?? (record.result === 'success' ? '无差异' : '-');
}

function normalizeResult(record: ReconciliationRecord) {
  const result = record.result ?? '';
  if (['success', 'paid', 'matched'].includes(result)) return 'success';
  if (['failed', 'fail'].includes(result)) return 'failed';
  if (record.differenceReason || record.diffReason) return 'exception';
  return 'exception';
}

function resultLabel(result: string) {
  return ({ success: '成功', failed: '失败', exception: '异常' } as Record<string, string>)[result] ?? result;
}

function toCsv(records: ReconciliationRecord[]) {
  const headers = ['本地订单号', '第三方交易号', '支付渠道', '支付金额', '本地状态', '第三方状态', '差异原因'];
  const rows = records.map((record) => [
    getOrderNo(record),
    getTransactionNo(record),
    record.channel ?? '-',
    String(record.amount ?? record.paidAmount ?? 0),
    record.localStatus ?? '-',
    record.thirdPartyStatus ?? '-',
    getDifferenceReason(record),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function PaymentReconciliation() {
  const [filters, setFilters] = useState<FilterState>({ startDate: '', endDate: '', channel: '' });
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [repairingOrderNo, setRepairingOrderNo] = useState<string>();
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const queryParams = useMemo(() => ({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    channel: filters.channel || undefined,
  }), [filters]);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) queueMicrotask(() => setLoading(true));
    setError(undefined);
    try {
      const [reconciliation, payments] = await Promise.all([
        apiClient.getReconciliation(queryParams),
        apiClient.getPaymentRecords(queryParams),
      ]);
      setRecords(reconciliation.items);
      setSummary(reconciliation.summary);
      setPaymentRecords(payments.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '支付对账数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    queueMicrotask(() => { void loadData(false); });
  }, [loadData]);

  const handleRun = async () => {
    setRunning(true);
    setMessage(undefined);
    setError(undefined);
    try {
      await apiClient.runReconciliation(queryParams);
      setMessage('已触发手动对账，结果已刷新。');
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '手动对账触发失败');
    } finally {
      setRunning(false);
    }
  };

  const handleRepair = async (record: ReconciliationRecord) => {
    const orderNo = getOrderNo(record);
    if (orderNo === '-') return;

    setRepairingOrderNo(orderNo);
    setMessage(undefined);
    setError(undefined);
    try {
      await apiClient.repairReconciliation(orderNo);
      setMessage(`异常订单 ${orderNo} 已提交修复。`);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '异常订单修复失败');
    } finally {
      setRepairingOrderNo(undefined);
    }
  };

  const handleExport = () => {
    const blob = new Blob([`\ufeff${toCsv(records)}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reconciliation-page">
      <div className="page-heading">
        <p className="eyebrow">Finance</p>
        <h1>支付对账</h1>
        <p>核对本地支付流水与第三方交易状态，支持手动触发对账、导出结果与异常订单修复。</p>
      </div>

      <div className="reconciliation-toolbar filter-bar">
        <label>开始日期<input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} /></label>
        <label>结束日期<input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} /></label>
        <label>支付渠道<select value={filters.channel} onChange={(event) => setFilters((prev) => ({ ...prev, channel: event.target.value }))}>{channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <button type="button" onClick={handleRun} disabled={running}>{running ? '对账中...' : '手动对账'}</button>
        <button type="button" className="secondary-button" onClick={handleExport} disabled={!records.length}>导出结果</button>
      </div>

      {message && <p className="status-message saved">{message}</p>}
      {error && <p className="status-message error">{error}</p>}

      <div className="summary-grid metric-grid">
        <div><strong>{summary.total ?? records.length}</strong><span>对账总数</span></div>
        <div><strong>{summary.success}</strong><span>成功订单</span></div>
        <div><strong>{summary.failed}</strong><span>失败订单</span></div>
        <div><strong>{summary.exception}</strong><span>异常订单</span></div>
      </div>

      <section className="table-section">
        <div className="section-title"><h2>对账结果</h2><span>{loading ? '加载中...' : `${records.length} 条记录`}</span></div>
        <div className="table-scroll"><table><thead><tr><th>本地订单号</th><th>第三方交易号</th><th>支付渠道</th><th>支付金额</th><th>本地状态</th><th>第三方状态</th><th>差异原因</th><th>结果</th><th>操作</th></tr></thead><tbody>{records.map((record, index) => { const result = normalizeResult(record); const orderNo = getOrderNo(record); return <tr key={`${orderNo}-${getTransactionNo(record)}-${index}`}><td>{orderNo}</td><td>{getTransactionNo(record)}</td><td>{record.channel ?? '-'}</td><td>{formatMoney(record.amount ?? record.paidAmount)}</td><td>{record.localStatus ?? '-'}</td><td>{record.thirdPartyStatus ?? '-'}</td><td>{getDifferenceReason(record)}</td><td><span className={`result-badge ${result}`}>{resultLabel(result)}</span></td><td><button type="button" className="table-action" disabled={result !== 'exception' || repairingOrderNo === orderNo} onClick={() => handleRepair(record)}>{repairingOrderNo === orderNo ? '修复中' : '修复'}</button></td></tr>; })}{!loading && records.length === 0 && <tr><td colSpan={9} className="empty-cell">暂无对账结果</td></tr>}</tbody></table></div>
      </section>

      <section className="table-section compact">
        <div className="section-title"><h2>支付流水</h2><span>{paymentRecords.length} 条流水</span></div>
        <div className="table-scroll"><table><thead><tr><th>本地订单号</th><th>第三方交易号</th><th>支付渠道</th><th>支付金额</th><th>本地状态</th><th>支付时间</th></tr></thead><tbody>{paymentRecords.slice(0, 8).map((record, index) => <tr key={`${getOrderNo(record)}-${index}`}><td>{getOrderNo(record)}</td><td>{getTransactionNo(record)}</td><td>{record.channel ?? '-'}</td><td>{formatMoney(record.amount ?? record.paidAmount)}</td><td>{record.localStatus ?? '-'}</td><td>{record.paidAt ?? record.createdAt ?? '-'}</td></tr>)}{!loading && paymentRecords.length === 0 && <tr><td colSpan={6} className="empty-cell">暂无支付流水</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
