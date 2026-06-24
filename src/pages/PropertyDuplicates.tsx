import { useEffect, useMemo, useState } from 'react';
import { apiClient, type DuplicateGroup, type DuplicateMergePayload, type DuplicateProperty } from '../api/client';

type PageState = {
  loading: boolean;
  error?: string;
  groups: DuplicateGroup[];
};

const compareFields: Array<{ key: keyof DuplicateProperty; label: string }> = [
  { key: 'address', label: '地址' },
  { key: 'communityName', label: '小区名称' },
  { key: 'building', label: '楼栋' },
  { key: 'roomNumber', label: '房号' },
  { key: 'area', label: '面积' },
  { key: 'layout', label: '户型' },
];

function getGroupId(group: DuplicateGroup) {
  return group.groupId ?? group.id;
}

function getProperties(group?: DuplicateGroup) {
  return group?.properties ?? group?.candidates ?? [];
}

function formatPercent(value?: number) {
  if (typeof value !== 'number') {
    return '--';
  }

  return `${Math.round(value * 100)}%`;
}

function fieldValue(property: DuplicateProperty, key: keyof DuplicateProperty) {
  const value = property[key];
  if (value === undefined || value === null || value === '') {
    return '--';
  }

  return String(value);
}

export function PropertyDuplicates() {
  const [state, setState] = useState<PageState>({ loading: true, groups: [] });
  const [selectedGroupId, setSelectedGroupId] = useState<string | number>();
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup>();
  const [primaryPropertyId, setPrimaryPropertyId] = useState<string | number>();
  const [actionMessage, setActionMessage] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    apiClient.getPropertyDuplicateGroups({ status: 'pending' })
      .then((result) => {
        if (ignore) {
          return;
        }

        setState({ loading: false, groups: result.items });
        const firstGroupId = result.items[0] ? getGroupId(result.items[0]) : undefined;
        setSelectedGroupId(firstGroupId);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setState({ loading: false, groups: [], error: error instanceof Error ? error.message : '重复房源接口请求失败' });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      return;
    }

    let ignore = false;
    apiClient.getPropertyDuplicateGroup(selectedGroupId)
      .then((group) => {
        if (ignore) {
          return;
        }

        setSelectedGroup(group);
        const firstProperty = getProperties(group)[0];
        setPrimaryPropertyId(firstProperty?.id);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setActionError(error instanceof Error ? error.message : '重复组详情请求失败');
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedGroupId]);

  const selectedProperties = useMemo(() => getProperties(selectedGroup), [selectedGroup]);

  const submitAction = async (action: DuplicateMergePayload['action']) => {
    if (!selectedGroupId) {
      return;
    }

    setActionLoading(true);
    setActionMessage(undefined);
    setActionError(undefined);

    try {
      await apiClient.mergePropertyDuplicateGroup(selectedGroupId, {
        action,
        primaryPropertyId,
        propertyIds: selectedProperties.map((property) => property.id).filter((id): id is string | number => id !== undefined),
      });
      setActionMessage(action === 'merge' ? '已提交合并' : action === 'ignore' ? '已忽略该重复组' : action === 'confirm' ? '已人工确认重复' : '已标记为非重复');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="duplicates-page">
      <div className="page-heading">
        <p className="eyebrow">重复房源识别</p>
        <h1>重复房源</h1>
        <p>基于地址、小区名称、楼栋、房号、面积、户型与图片相似度生成重复组，支持人工确认、合并、忽略或标记非重复。</p>
      </div>

      {state.loading && <div className="api-panel">正在加载重复房源组...</div>}
      {state.error && <div className="api-panel error">{state.error}</div>}

      {!state.loading && !state.error && (
        <div className="duplicates-layout">
          <aside className="duplicate-groups">
            <div className="duplicate-groups-header">
              <strong>待处理重复组</strong>
              <span>{state.groups.length} 组</span>
            </div>
            {state.groups.length === 0 && <p className="empty-text">暂无待处理重复房源。</p>}
            {state.groups.map((group) => {
              const groupId = getGroupId(group);
              return (
                <button
                  className={`duplicate-group-card${selectedGroupId === groupId ? ' active' : ''}`}
                  key={String(groupId)}
                  type="button"
                  onClick={() => setSelectedGroupId(groupId)}
                >
                  <span>重复组 #{groupId}</span>
                  <small>置信度 {formatPercent(group.confidence)} · 图片 {formatPercent(group.imageSimilarity)}</small>
                </button>
              );
            })}
          </aside>

          <section className="duplicate-detail">
            {!selectedGroup && <div className="api-panel">请选择重复组查看详情。</div>}
            {selectedGroup && (
              <>
                <div className="duplicate-summary">
                  <div>
                    <span>组 ID</span>
                    <strong>{String(getGroupId(selectedGroup))}</strong>
                  </div>
                  <div>
                    <span>状态</span>
                    <strong>{selectedGroup.status ?? 'pending'}</strong>
                  </div>
                  <div>
                    <span>整体置信度</span>
                    <strong>{formatPercent(selectedGroup.confidence)}</strong>
                  </div>
                  <div>
                    <span>图片相似度</span>
                    <strong>{formatPercent(selectedGroup.imageSimilarity)}</strong>
                  </div>
                </div>

                <div className="property-card-grid">
                  {selectedProperties.map((property, index) => (
                    <article className="property-duplicate-card" key={String(property.id ?? index)}>
                      {property.imageUrl && <img src={property.imageUrl} alt={property.title ?? '房源图片'} />}
                      <div>
                        <label className="radio-label">
                          <input
                            checked={primaryPropertyId === property.id}
                            name="primaryProperty"
                            type="radio"
                            onChange={() => setPrimaryPropertyId(property.id)}
                          />
                          主房源
                        </label>
                        <h3>{property.title ?? `房源 ${property.id ?? index + 1}`}</h3>
                        <p>{property.address ?? '暂无地址'}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="compare-table-wrap">
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>对比字段</th>
                        {selectedProperties.map((property, index) => <th key={String(property.id ?? index)}>房源 {property.id ?? index + 1}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {compareFields.map((field) => (
                        <tr key={field.key}>
                          <td>{field.label}</td>
                          {selectedProperties.map((property, index) => <td key={String(property.id ?? index)}>{fieldValue(property, field.key)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="duplicate-actions">
                  <button disabled={actionLoading} type="button" onClick={() => submitAction('confirm')}>人工确认重复</button>
                  <button disabled={actionLoading || !primaryPropertyId} type="button" onClick={() => submitAction('merge')}>合并到主房源</button>
                  <button className="secondary-button" disabled={actionLoading} type="button" onClick={() => submitAction('ignore')}>忽略</button>
                  <button className="danger-button" disabled={actionLoading} type="button" onClick={() => submitAction('mark_not_duplicate')}>标记非重复</button>
                </div>
                {actionMessage && <p className="status-message saved">{actionMessage}</p>}
                {actionError && <p className="status-message error">{actionError}</p>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
