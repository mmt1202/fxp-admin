import { useEffect, useState } from 'react';
import { featureApi as apiClient, type DuplicateGroup } from '../api/migratedFeatures';

function groupKey(group: DuplicateGroup) {
  return group.groupId ?? group.id;
}

function candidateCount(group: DuplicateGroup) {
  return (group.properties ?? group.candidates ?? []).length;
}

export function PropertyDuplicates() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadGroups = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getPropertyDuplicateGroups({ status: 'pending' });
      setGroups(result.items);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '重复房源加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => { void loadGroups(); }); }, []);

  const runAction = async (group: DuplicateGroup, action: 'confirm' | 'merge' | 'ignore') => {
    const id = groupKey(group);
    if (!id) return;
    try {
      await apiClient.mergePropertyDuplicateGroup(id, { action });
      setMessage('操作已提交。');
      await loadGroups();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败');
    }
  };

  return (
    <div className="duplicates-page">
      <div className="page-heading">
        <p className="eyebrow">重复房源识别</p>
        <h1>重复房源处理</h1>
        <p>查看待处理重复房源组，支持确认、合并和忽略。</p>
      </div>
      {message && <p className="status-message saved">{message}</p>}
      {loading ? <div className="api-panel">正在加载...</div> : null}
      <section className="table-section">
        <table className="data-table">
          <thead><tr><th>重复组</th><th>状态</th><th>候选房源数</th><th>置信度</th><th>操作</th></tr></thead>
          <tbody>
            {groups.map((group) => <tr key={String(groupKey(group))}><td>{String(groupKey(group))}</td><td>{String(group.status ?? 'pending')}</td><td>{candidateCount(group)}</td><td>{typeof group.confidence === 'number' ? `${Math.round(group.confidence * 100)}%` : '-'}</td><td className="table-actions"><button type="button" onClick={() => runAction(group, 'confirm')}>确认</button><button type="button" onClick={() => runAction(group, 'merge')}>合并</button><button type="button" className="secondary-button" onClick={() => runAction(group, 'ignore')}>忽略</button></td></tr>)}
            {!groups.length && !loading ? <tr><td colSpan={5} className="empty-cell">暂无待处理数据</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
