import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

type Report = {
  id?: string | number;
  reportId?: string | number;
  type?: string;
  reportType?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
};

type ListPayload<T> = T[] | { data?: T[]; list?: T[]; items?: T[]; records?: T[] };

function unwrapList<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.list ?? payload.items ?? payload.records ?? [];
}

function getReportId(report: Report) {
  return report.id ?? report.reportId ?? '';
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

export function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiClient.get<ListPayload<Report>>('/admin/community/reports');
      setReports(unwrapList(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : '举报列表加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

  async function reviewReport(report: Report, approved: boolean) {
    const reportId = String(getReportId(report));
    const actionText = approved ? '通过举报并隐藏内容' : '驳回举报';
    if (!window.confirm(`确认${actionText}（举报 ID：${reportId}）吗？`)) return;

    setActionId(reportId);
    try {
      await apiClient.put(`/admin/community/reports/${reportId}`, {
        action: approved ? 'approve_hide' : 'reject',
        status: approved ? 'approved' : 'rejected',
        hideContent: approved,
      });
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : '举报审核操作失败');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="module-page">
      <p className="eyebrow">举报审核</p>
      <h1>举报/审核管理</h1>
      <p>审核社区举报线索，支持通过后隐藏内容或驳回举报。</p>
      {error && <div className="error-text">{error}</div>}
      <div className="table-toolbar">
        <button onClick={() => void loadReports()} disabled={loading}>{loading ? '刷新中...' : '刷新列表'}</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>举报 ID</th><th>举报类型</th><th>举报原因</th><th>当前状态</th><th>创建时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const reportId = String(getReportId(report));
              return (
                <tr key={reportId}>
                  <td>{reportId}</td>
                  <td>{report.reportType ?? report.type ?? '-'}</td>
                  <td>{report.reason ?? '-'}</td>
                  <td><span className="status-pill muted">{report.status ?? '-'}</span></td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="danger-button" disabled={actionId === reportId} onClick={() => void reviewReport(report, true)}>通过举报并隐藏内容</button>
                      <button className="secondary-button" disabled={actionId === reportId} onClick={() => void reviewReport(report, false)}>驳回举报</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && reports.length === 0 && <tr><td colSpan={6} className="empty-cell">暂无举报数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
