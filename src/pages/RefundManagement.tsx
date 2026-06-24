import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, RefundOrder, RefundStatus } from '../api/client';

type LoadState = 'idle' | 'loading' | 'error';
type SubmitState = 'idle' | 'submitting';

const statusLabels: Record<RefundStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  processing: '退款中',
  succeeded: '退款成功',
  failed: '退款失败',
};

const statusOptions: Array<{ value: '' | RefundStatus; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'processing', label: '退款中' },
  { value: 'succeeded', label: '退款成功' },
  { value: 'failed', label: '退款失败' },
];

function formatTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function normalizeStatus(status?: string): RefundStatus {
  if (status && status in statusLabels) {
    return status as RefundStatus;
  }

  return 'pending';
}

export function RefundManagement() {
  const [refunds, setRefunds] = useState<RefundOrder[]>([]);
  const [status, setStatus] = useState<'' | RefundStatus>('');
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ originalOrderId: '', userId: '', refundAmount: '', refundReason: '' });

  const query = useMemo(() => (status ? { status } : undefined), [status]);

  const loadRefunds = useCallback(async () => {
    setLoadState('loading');
    setMessage('');

    try {
      const data = await apiClient.getRefunds(query);
      setRefunds(data.items);
      setLoadState('idle');
    } catch (error) {
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : '退款列表加载失败');
    }
  }, [query]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRefunds();
    });
  }, [loadRefunds]);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('submitting');
    setMessage('');

    try {
      await apiClient.createRefund({
        originalOrderId: form.originalOrderId.trim(),
        userId: form.userId.trim(),
        refundAmount: Number(form.refundAmount),
        refundReason: form.refundReason.trim(),
      });
      setForm({ originalOrderId: '', userId: '', refundAmount: '', refundReason: '' });
      setMessage('退款申请已创建，等待审核。');
      await loadRefunds();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建退款申请失败');
    } finally {
      setSubmitState('idle');
    }
  };

  const handleAudit = async (refund: RefundOrder, approved: boolean) => {
    const auditReason = window.prompt(approved ? '请输入审核通过备注（可选）' : '请输入拒绝原因');

    if (!approved && !auditReason) {
      setMessage('拒绝退款必须填写原因。');
      return;
    }

    try {
      await apiClient.auditRefund(refund.id, { approved, auditReason: auditReason ?? undefined });
      setMessage(approved ? '退款申请已审核通过。' : '退款申请已拒绝。');
      await loadRefunds();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '审核操作失败');
    }
  };

  const handleExecute = async (refund: RefundOrder) => {
    const channel = window.prompt('请输入退款渠道：alipay 或 wechat', refund.paymentChannel ?? 'alipay');

    if (!channel) {
      return;
    }

    try {
      await apiClient.executeRefund(refund.id, { channel });
      setMessage('已提交第三方退款执行，请稍后刷新查看状态。');
      await loadRefunds();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '执行退款失败');
    }
  };

  return (
    <div className="refund-page">
      <div className="page-heading">
        <p className="eyebrow">财务中心</p>
        <h1>退款管理</h1>
        <p>创建退款申请，完成财务审核，并对接支付宝/微信渠道执行退款。</p>
      </div>

      <form className="refund-create-card" onSubmit={handleCreate}>
        <h2>创建退款申请</h2>
        <div className="form-grid">
          <label className="field-label">
            原订单 ID
            <input required value={form.originalOrderId} onChange={(event) => updateForm('originalOrderId', event.target.value)} placeholder="order_123" />
          </label>
          <label className="field-label">
            用户 ID
            <input required value={form.userId} onChange={(event) => updateForm('userId', event.target.value)} placeholder="user_123" />
          </label>
          <label className="field-label">
            退款金额
            <input required min="0.01" step="0.01" type="number" value={form.refundAmount} onChange={(event) => updateForm('refundAmount', event.target.value)} placeholder="0.00" />
          </label>
        </div>
        <label className="field-label">
          退款原因
          <textarea required rows={3} value={form.refundReason} onChange={(event) => updateForm('refundReason', event.target.value)} placeholder="请输入退款原因" />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={submitState === 'submitting'}>{submitState === 'submitting' ? '提交中...' : '提交退款申请'}</button>
        </div>
      </form>

      <section className="refund-list-card">
        <div className="refund-toolbar">
          <h2>退款申请列表</h2>
          <label>
            状态筛选
            <select value={status} onChange={(event) => setStatus(event.target.value as '' | RefundStatus)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {message ? <p className={`status-message ${loadState === 'error' ? 'error' : 'saved'}`}>{message}</p> : null}
        {loadState === 'loading' ? <div className="api-panel">正在加载退款数据...</div> : null}

        <div className="refund-table-wrap">
          <table className="refund-table">
            <thead>
              <tr>
                <th>退款单</th><th>原订单</th><th>用户</th><th>金额</th><th>原因</th><th>状态</th><th>审核信息</th><th>第三方单号</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => {
                const currentStatus = normalizeStatus(refund.status);
                return (
                  <tr key={refund.id}>
                    <td>{refund.id}</td><td>{refund.originalOrderId}</td><td>{refund.userId}</td><td>¥{Number(refund.refundAmount ?? 0).toFixed(2)}</td><td>{refund.refundReason}</td>
                    <td><span className={`refund-status ${currentStatus}`}>{statusLabels[currentStatus]}</span></td>
                    <td>{refund.auditor || '-'}<br /><small>{formatTime(refund.auditTime)}</small></td><td>{refund.thirdPartyRefundNo || '-'}</td>
                    <td className="table-actions">
                      <button type="button" disabled={currentStatus !== 'pending'} onClick={() => handleAudit(refund, true)}>通过</button>
                      <button type="button" className="danger-button" disabled={currentStatus !== 'pending'} onClick={() => handleAudit(refund, false)}>拒绝</button>
                      <button type="button" disabled={currentStatus !== 'approved'} onClick={() => handleExecute(refund)}>执行</button>
                    </td>
                  </tr>
                );
              })}
              {!refunds.length && loadState !== 'loading' ? <tr><td colSpan={9} className="empty-table">暂无退款申请</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
