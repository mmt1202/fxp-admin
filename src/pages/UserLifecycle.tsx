import { useEffect, useMemo, useState } from 'react';
import { apiClient, type LifecycleStage, type UserLifecycleUser } from '../api/client';

const defaultStages: Array<Omit<LifecycleStage, 'value' | 'users'>> = [
  { key: 'registeredUsers', label: '注册用户数', description: '时间范围内完成注册的用户。' },
  { key: 'profileCompletedUsers', label: '完善资料用户数', description: '已补全头像、昵称、联系方式等资料。' },
  { key: 'firstPropertyUsers', label: '创建首个房源用户数', description: '至少创建过 1 个房源的用户。' },
  { key: 'aiValuationUsers', label: '使用 AI 评房用户数', description: '发起过 AI 房源评估的用户。' },
  { key: 'reportSharedUsers', label: '分享报告用户数', description: '分享过评估报告或房源报告的用户。' },
  { key: 'membershipPurchasedUsers', label: '购买会员用户数', description: '购买过会员权益的用户。' },
  { key: 'repurchasedUsers', label: '复购用户数', description: '发生过 2 次及以上付费行为的用户。' },
  { key: 'churnedUsers', label: '流失用户数', description: '在设定周期内未再次活跃或续费的用户。' },
];

const quickRanges = [
  { label: '近 7 天', days: 7 },
  { label: '近 30 天', days: 30 },
  { label: '近 90 天', days: 90 },
];

type Filters = {
  startDate: string;
  endDate: string;
};

type PageState = {
  loading: boolean;
  error?: string;
  stages: LifecycleStage[];
};

type UserListState = {
  loading: boolean;
  error?: string;
  users: UserLifecycleUser[];
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultFilters(): Filters {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
}

function stageValue(stage: LifecycleStage) {
  return typeof stage.value === 'number' ? stage.value : 0;
}

function normalizeStages(stages: LifecycleStage[]) {
  return defaultStages.map((fallback) => {
    const matched = stages.find((stage) => stage.key === fallback.key || stage.label === fallback.label);
    return {
      ...fallback,
      ...matched,
      key: matched?.key ?? fallback.key,
      label: matched?.label ?? fallback.label,
      description: matched?.description ?? fallback.description,
      value: stageValue(matched ?? { ...fallback, value: 0 }),
    };
  });
}

function formatUserField(user: UserLifecycleUser, keys: string[], fallback = '-') {
  const value = keys.map((key) => user[key]).find((item) => item !== undefined && item !== null && item !== '');
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

export function UserLifecycle() {
  const [filters, setFilters] = useState<Filters>(() => defaultFilters());
  const [state, setState] = useState<PageState>({ loading: true, stages: [] });
  const [selectedStage, setSelectedStage] = useState<LifecycleStage | null>(null);
  const [userList, setUserList] = useState<UserListState>({ loading: false, users: [] });

  const params = useMemo(() => ({ startDate: filters.startDate, endDate: filters.endDate }), [filters]);

  useEffect(() => {
    let ignore = false;

    apiClient.getUserLifecycle(params)
      .then((data) => {
        if (!ignore) {
          setState({ loading: false, stages: normalizeStages(data.stages) });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setState({ loading: false, error: error instanceof Error ? error.message : '用户生命周期接口请求失败', stages: [] });
        }
      });

    return () => {
      ignore = true;
    };
  }, [params]);

  const maxValue = Math.max(...state.stages.map(stageValue), 1);

  const updateFilters = (nextFilters: Filters) => {
    setFilters(nextFilters);
    setState((previous) => ({ ...previous, loading: true, error: undefined }));
  };

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    updateFilters({ startDate: toInputDate(start), endDate: toInputDate(end) });
  };

  const openStageUsers = (stage: LifecycleStage) => {
    setSelectedStage(stage);
    if (stage.users?.length) {
      setUserList({ loading: false, users: stage.users });
      return;
    }

    setUserList({ loading: true, users: [] });
    apiClient.getUserLifecycleUsers({ ...params, stage: stage.key })
      .then((users) => setUserList({ loading: false, users: users.items }))
      .catch((error: unknown) => setUserList({ loading: false, users: [], error: error instanceof Error ? error.message : '用户列表接口请求失败' }));
  };

  return (
    <div className="lifecycle-page">
      <div className="page-heading lifecycle-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>用户生命周期</h1>
          <p>按注册、资料完善、首个房源、AI 评房、报告分享、会员购买、复购与流失阶段追踪用户转化。</p>
        </div>
        <div className="date-filter-card">
          <label>
            开始日期
            <input type="date" value={filters.startDate} onChange={(event) => updateFilters({ ...filters, startDate: event.target.value })} />
          </label>
          <label>
            结束日期
            <input type="date" value={filters.endDate} onChange={(event) => updateFilters({ ...filters, endDate: event.target.value })} />
          </label>
        </div>
      </div>

      <div className="quick-range-row">
        {quickRanges.map((range) => (
          <button key={range.days} type="button" className="secondary-button" onClick={() => applyQuickRange(range.days)}>{range.label}</button>
        ))}
      </div>

      {state.loading && <div className="api-panel">正在加载用户生命周期数据...</div>}
      {state.error && <div className="api-panel error">{state.error}</div>}
      {!state.loading && !state.error && (
        <div className="lifecycle-funnel" aria-label="用户生命周期漏斗">
          {state.stages.map((stage, index) => {
            const value = stageValue(stage);
            const previousValue = index === 0 ? value : stageValue(state.stages[index - 1]);
            const conversion = previousValue > 0 ? Math.round((value / previousValue) * 1000) / 10 : 0;
            const width = Math.max(8, (value / maxValue) * 100);

            return (
              <button key={stage.key} type="button" className="lifecycle-stage-card" onClick={() => openStageUsers(stage)}>
                <span className="stage-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="stage-content">
                  <strong>{stage.label}</strong>
                  <small>{stage.description}</small>
                  <span className="funnel-bar"><span style={{ width: `${width}%` }} /></span>
                </span>
                <span className="stage-metrics">
                  <strong>{value.toLocaleString()}</strong>
                  <small>{index === 0 ? '起始阶段' : `上阶段转化 ${conversion}%`}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedStage && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setSelectedStage(null)}>
          <aside className="user-drawer" aria-label={`${selectedStage.label}用户列表`} onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p className="eyebrow">用户列表</p>
                <h2>{selectedStage.label}</h2>
                <p>{filters.startDate} 至 {filters.endDate}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setSelectedStage(null)}>关闭</button>
            </header>
            {userList.loading && <div className="api-panel">正在加载用户列表...</div>}
            {userList.error && <div className="api-panel error">{userList.error}</div>}
            {!userList.loading && !userList.error && (
              <div className="user-list-table">
                <div className="user-list-head"><span>用户</span><span>联系方式</span><span>阶段时间</span></div>
                {userList.users.length === 0 && <div className="empty-row">暂无用户明细</div>}
                {userList.users.map((user, index) => (
                  <div className="user-list-row" key={formatUserField(user, ['id', 'userId'], String(index))}>
                    <span>{formatUserField(user, ['nickname', 'name', 'username', 'id', 'userId'])}</span>
                    <span>{formatUserField(user, ['phone', 'mobile', 'email'])}</span>
                    <span>{formatUserField(user, ['stageAt', 'createdAt', 'updatedAt'])}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
