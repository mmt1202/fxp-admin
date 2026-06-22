import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminOperationLog, getOperationLogs, OperationLogFilters, OperationLogValue } from '../api/operationLogs';

const pageSize = 10;

const emptyFilters: OperationLogFilters = {
  adminName: '',
  action: '',
  targetType: '',
  targetId: '',
  startTime: '',
  endTime: '',
};

function stringifyValue(value: OperationLogValue) {
  if (value === null || value === undefined || value === '') {
    return '无';
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

function diffEntries(beforeValue: OperationLogValue, afterValue: OperationLogValue) {
  if (!beforeValue || !afterValue || typeof beforeValue !== 'object' || typeof afterValue !== 'object' || Array.isArray(beforeValue) || Array.isArray(afterValue)) {
    return [];
  }

  const beforeRecord = beforeValue as Record<string, unknown>;
  const afterRecord = afterValue as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]));

  return keys
    .map((key) => ({ key, before: beforeRecord[key], after: afterRecord[key] }))
    .filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.after));
}

export function OperationLogs() {
  const [filters, setFilters] = useState<OperationLogFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<OperationLogFilters>({ page: 1, pageSize });
  const [logs, setLogs] = useState<AdminOperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AdminOperationLog | null>(null);

  const currentPage = appliedFilters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let ignore = false;
    getOperationLogs(appliedFilters)
      .then((response) => {
        if (!ignore) {
          setLogs(response.items);
          setTotal(response.total);
          setSelectedLog((current) => current && response.items.some((item) => item.id === current.id) ? current : null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : '操作日志加载失败');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedFilters]);

  const selectedDiffs = useMemo(() => selectedLog ? diffEntries(selectedLog.beforeValue, selectedLog.afterValue) : [], [selectedLog]);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAppliedFilters({ ...filters, page: 1, pageSize });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setLoading(true);
    setError('');
    setAppliedFilters({ page: 1, pageSize });
  };

  const changePage = (page: number) => {
    setLoading(true);
    setError('');
    setAppliedFilters((current) => ({ ...current, page, pageSize }));
  };

  return (
    <div className="operation-logs-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">审计追踪</p>
          <h1>操作日志</h1>
          <p>查询后台管理员对用户、举报、房源、内容和订单等对象的操作记录。</p>
        </div>
      </div>

      <form className="filter-panel" onSubmit={handleFilter}>
        <label>
          管理员
          <input value={filters.adminName} onChange={(event) => setFilters((current) => ({ ...current, adminName: event.target.value }))} placeholder="姓名或账号" />
        </label>
        <label>
          操作类型
          <input value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="如 update_user_status" />
        </label>
        <label>
          目标对象
          <input value={filters.targetType} onChange={(event) => setFilters((current) => ({ ...current, targetType: event.target.value }))} placeholder="user/report/property" />
        </label>
        <label>
          目标 ID
          <input value={filters.targetId} onChange={(event) => setFilters((current) => ({ ...current, targetId: event.target.value }))} placeholder="精确匹配" />
        </label>
        <label>
          开始时间
          <input type="datetime-local" value={filters.startTime} onChange={(event) => setFilters((current) => ({ ...current, startTime: event.target.value }))} />
        </label>
        <label>
          结束时间
          <input type="datetime-local" value={filters.endTime} onChange={(event) => setFilters((current) => ({ ...current, endTime: event.target.value }))} />
        </label>
        <div className="filter-actions">
          <button type="submit">筛选</button>
          <button className="secondary-button" type="button" onClick={resetFilters}>重置</button>
        </div>
      </form>

      {error && <div className="error-text">{error}</div>}

      <div className="logs-layout">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>管理员</th>
                <th>操作</th>
                <th>目标</th>
                <th>来源 IP</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={selectedLog?.id === log.id ? 'selected-row' : ''}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.adminName}<span className="muted-text">#{log.adminId}</span></td>
                  <td><span className="tag">{log.action}</span></td>
                  <td>{log.targetType}<span className="muted-text">{log.targetId}</span></td>
                  <td>{log.ip || '未知'}</td>
                  <td><button type="button" className="link-button" onClick={() => setSelectedLog(log)}>查看</button></td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="empty-cell">暂无操作日志</td></tr>
              )}
              {loading && (
                <tr><td colSpan={6} className="empty-cell">加载中...</td></tr>
              )}
            </tbody>
          </table>
          <div className="pagination">
            <button type="button" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}>上一页</button>
            <span>第 {currentPage} / {totalPages} 页，共 {total} 条</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)}>下一页</button>
          </div>
        </div>

        <aside className="detail-card">
          {selectedLog ? (
            <>
              <h2>日志详情</h2>
              <dl>
                <dt>操作人</dt><dd>{selectedLog.adminName}（{selectedLog.adminId}）</dd>
                <dt>操作类型</dt><dd>{selectedLog.action}</dd>
                <dt>目标对象</dt><dd>{selectedLog.targetType} / {selectedLog.targetId}</dd>
                <dt>User Agent</dt><dd>{selectedLog.userAgent || '未知'}</dd>
              </dl>
              <h3>字段差异</h3>
              {selectedDiffs.length > 0 ? selectedDiffs.map((item) => (
                <div className="diff-row" key={item.key}>
                  <strong>{item.key}</strong>
                  <div><span>前：</span><code>{stringifyValue(item.before as OperationLogValue)}</code></div>
                  <div><span>后：</span><code>{stringifyValue(item.after as OperationLogValue)}</code></div>
                </div>
              )) : <p className="muted-text">未检测到结构化字段差异，请查看完整快照。</p>}
              <div className="snapshot-grid">
                <div><h3>操作前</h3><pre>{stringifyValue(selectedLog.beforeValue)}</pre></div>
                <div><h3>操作后</h3><pre>{stringifyValue(selectedLog.afterValue)}</pre></div>
              </div>
            </>
          ) : (
            <div className="empty-detail">选择一条日志查看操作前后差异。</div>
          )}
        </aside>
      </div>
    </div>
  );
}
