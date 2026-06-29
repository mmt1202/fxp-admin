import { useCallback, useEffect, useState } from 'react';
import { exportTasksApi, exportTaskStatusLabels, exportTaskTypeLabels, type ExportTask } from '../api/exportTasks';

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function progressOf(task: ExportTask) {
  if (typeof task.progress === 'number') return Math.min(100, Math.max(0, task.progress));
  if (task.totalRows && task.exportedRows) return Math.round((task.exportedRows / task.totalRows) * 100);
  return task.status === 'success' ? 100 : 0;
}

export function ExportTaskCenter() {
  const [tasks, setTasks] = useState<ExportTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await exportTasksApi.getTasks();
      setTasks(result.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '导出任务加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadTasks(); });
    const timer = window.setInterval(() => void loadTasks(), 10000);
    return () => window.clearInterval(timer);
  }, [loadTasks]);

  return (
    <div className="module-page export-center-page">
      <p className="eyebrow">Export Center</p>
      <h1>导出中心</h1>
      <p>统一查看用户列表、订单列表、举报列表、AI 用量与支付流水等异步导出任务进度，成功文件会按后端过期时间自动失效。</p>

      {error && <div className="error-text">{error}</div>}
      <div className="table-toolbar">
        <button type="button" onClick={() => void loadTasks()} disabled={loading}>{loading ? '刷新中...' : '刷新任务'}</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>任务 ID</th><th>导出类型</th><th>状态</th><th>进度</th><th>文件名</th><th>创建时间</th><th>过期时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const progress = progressOf(task);
              const canDownload = task.status === 'success';
              return (
                <tr key={String(task.id)}>
                  <td>{task.id}</td>
                  <td>{exportTaskTypeLabels[task.type] ?? task.type}</td>
                  <td><span className={`status-pill export-status-${task.status}`}>{exportTaskStatusLabels[task.status] ?? task.status}</span></td>
                  <td><div className="progress-cell"><span style={{ width: `${progress}%` }} /> </div><small>{progress}%</small></td>
                  <td>{task.fileName ?? '-'}</td>
                  <td>{formatDate(task.createdAt)}</td>
                  <td>{formatDate(task.expiresAt)}</td>
                  <td>{canDownload ? <a className="button-link" href={exportTasksApi.downloadUrl(task.id)}>下载</a> : (task.errorMessage ?? '-')}</td>
                </tr>
              );
            })}
            {!loading && tasks.length === 0 && <tr><td colSpan={8} className="empty-cell">暂无导出任务，请在业务列表点击“导出”创建任务。</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
