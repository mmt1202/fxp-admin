import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, type AiReviewRecord, type AiReviewStatus } from '../api/client';

const statusLabels: Record<AiReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  corrected: '已修正',
  rejected: '已驳回',
};

const statusOptions: Array<{ value: AiReviewStatus | 'all'; label: string }> = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'corrected', label: '已修正' },
  { value: 'rejected', label: '已驳回' },
  { value: 'all', label: '全部' },
];

function displayStatus(record?: AiReviewRecord) {
  const status = (record?.auditStatus ?? record?.status ?? 'pending') as AiReviewStatus;
  return statusLabels[status] ?? String(status);
}

function stringifyBlock(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '暂无数据';
  }

  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function getRecordTitle(record: AiReviewRecord) {
  const property = record.propertyInfo ?? record.property;
  if (property && typeof property === 'object' && !Array.isArray(property)) {
    const info = property as Record<string, unknown>;
    return String(info.title ?? info.name ?? info.address ?? `记录 #${record.id}`);
  }

  return String(record.title ?? record.propertyTitle ?? `记录 #${record.id}`);
}

export function AiReviewPage() {
  const [records, setRecords] = useState<AiReviewRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | number>();
  const [selectedRecord, setSelectedRecord] = useState<AiReviewRecord>();
  const [status, setStatus] = useState<AiReviewStatus | 'all'>('pending');
  const [correctionComment, setCorrectionComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selected = useMemo(
    () => selectedRecord ?? records.find((record) => record.id === selectedId),
    [records, selectedId, selectedRecord],
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await apiClient.getAiReviewRecords(status === 'all' ? undefined : { status });
      setRecords(result.items);
      const firstId = result.items[0]?.id;
      setSelectedId((current) => current ?? firstId);
      if (!firstId) {
        setSelectedRecord(undefined);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI 评房审核记录加载失败');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadRecords();
    });
  }, [loadRecords]);

  useEffect(() => {
    if (selectedId === undefined) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setDetailLoading(true);
      }
    });

    apiClient.getAiReviewRecord(selectedId)
      .then((data) => {
        if (active) {
          setSelectedRecord(data);
          setCorrectionComment(data.correctionComment ?? '');
        }
      })
      .catch(() => {
        if (active) {
          const fallback = records.find((record) => record.id === selectedId);
          setSelectedRecord(fallback);
          setCorrectionComment(fallback?.correctionComment ?? '');
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [records, selectedId]);

  const audit = async (nextStatus: AiReviewStatus) => {
    if (!selected) {
      return;
    }

    setMessage('');

    try {
      const updated = await apiClient.auditAiReviewRecord(selected.id, {
        status: nextStatus,
        correctionComment: correctionComment.trim() || undefined,
      });
      setSelectedRecord(updated);
      setRecords((current) => current.map((record) => (record.id === updated.id ? { ...record, ...updated } : record)));
      setMessage(`记录 #${updated.id} 已更新为「${displayStatus(updated)}」。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '审核操作失败，请稍后重试');
    }
  };

  const exportProblemSamples = () => {
    const samples = records.filter((record) => {
      const recordStatus = record.auditStatus ?? record.status;
      return recordStatus === 'corrected' || recordStatus === 'rejected' || (record.riskKeywords?.length ?? 0) > 0;
    });
    const blob = new Blob([JSON.stringify(samples, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-review-problem-samples-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-review-page">
      <div className="page-heading review-heading">
        <div>
          <p className="eyebrow">AI 结果审核</p>
          <h1>AI 评房结果抽检和审核</h1>
          <p>高风险关键词命中的 AI 结果自动进入待审核池，管理员可通过、驳回或填写修正意见。</p>
        </div>
        <button type="button" className="secondary-button" onClick={exportProblemSamples} disabled={!records.length}>导出问题样本</button>
      </div>

      <div className="review-toolbar">
        {statusOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            className={status === option.value ? 'filter-button active' : 'filter-button'}
            onClick={() => {
              setStatus(option.value);
              setSelectedId(undefined);
              setSelectedRecord(undefined);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message ? <p className="status-message saved">{message}</p> : null}

      <div className="review-layout">
        <aside className="review-list">
          {loading ? <div className="empty-state">正在加载审核池...</div> : null}
          {!loading && records.length === 0 ? <div className="empty-state">暂无审核记录</div> : null}
          {records.map((record) => (
            <button
              type="button"
              key={record.id}
              className={selected?.id === record.id ? 'record-card active' : 'record-card'}
              onClick={() => setSelectedId(record.id)}
            >
              <strong>{getRecordTitle(record)}</strong>
              <span>{displayStatus(record)}</span>
              <small>{record.riskKeywords?.join('、') || '未命中高风险关键词'}</small>
            </button>
          ))}
        </aside>

        <section className="review-detail">
          {!selected ? <div className="empty-state">请选择一条 AI 评房记录</div> : null}
          {selected ? (
            <>
              <div className="detail-title">
                <div>
                  <h2>{getRecordTitle(selected)}</h2>
                  <p>记录 ID：{selected.id} · 当前状态：{detailLoading ? '加载中...' : displayStatus(selected)}</p>
                </div>
                <span className="status-pill">{displayStatus(selected)}</span>
              </div>

              <div className="detail-grid">
                <article>
                  <h3>原始房源信息</h3>
                  <pre>{stringifyBlock(selected.propertyInfo ?? selected.property)}</pre>
                </article>
                <article>
                  <h3>AI 输出结果</h3>
                  <pre>{stringifyBlock(selected.aiOutput ?? selected.aiResult)}</pre>
                </article>
                <article>
                  <h3>用户反馈</h3>
                  <pre>{stringifyBlock(selected.userFeedback ?? selected.feedback)}</pre>
                </article>
                <article>
                  <h3>高风险关键词</h3>
                  <pre>{stringifyBlock(selected.riskKeywords)}</pre>
                </article>
              </div>

              <label className="field-label audit-comment">
                修正意见 / 问题标记
                <textarea
                  rows={4}
                  value={correctionComment}
                  onChange={(event) => setCorrectionComment(event.target.value)}
                  placeholder="填写 AI 输出问题、建议修正文案或驳回原因"
                />
              </label>

              <div className="audit-actions">
                <button type="button" onClick={() => audit('approved')}>通过</button>
                <button type="button" className="secondary-button" onClick={() => audit('corrected')}>标记问题/已修正</button>
                <button type="button" className="danger-button" onClick={() => audit('rejected')}>驳回</button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
