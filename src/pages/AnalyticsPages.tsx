import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyticsApi,
  type AnalyticsOverview,
  type AnalyticsRange,
  type AnalyticsSection,
  type MetricCard,
  type RankingItem,
  type TrendPoint,
} from '../api/analytics';
import { fetchAdminTodos, type TodoCenter } from '../api/todos';
import { useAuthStore } from '../store/auth';

type RangePreset = AnalyticsRange['preset'];
type AnalyticsTabKey = 'overview' | 'users' | 'properties' | 'membership' | 'ai-review';

type RangeFilterProps = {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
};

type AnalyticsState = {
  data: AnalyticsOverview;
  loading: boolean;
  error?: string;
};

type SectionState = {
  data: AnalyticsSection;
  loading: boolean;
  error?: string;
};

const metrics: MetricCard[] = [
  { label: 'DAU', value: '8,426', delta: '+12.4%', hint: '今日活跃用户' },
  { label: 'WAU', value: '42,180', delta: '+8.1%', hint: '近 7 天活跃用户' },
  { label: 'MAU', value: '168,900', delta: '+15.7%', hint: '近 30 天活跃用户' },
  { label: '新增用户', value: '3,218', delta: '+9.6%', hint: '筛选周期内注册' },
  { label: '留存率', value: '41.8%', delta: '+3.2pp', hint: '次日/周期综合留存' },
  { label: '房源新增数', value: '1,086', delta: '+6.3%', hint: '新增有效房源' },
  { label: 'AI 评房调用数', value: '12,740', delta: '+18.9%', hint: 'AI 分析请求' },
  { label: '会员转化率', value: '7.6%', delta: '+1.1pp', hint: '付费会员/活跃用户' },
  { label: '订单金额', value: '¥486,200', delta: '+21.5%', hint: '会员与增值服务 GMV' },
  { label: '客单价', value: '¥129', delta: '+4.8%', hint: '订单金额/订单数' },
];

const trend: TrendPoint[] = [
  { date: '06-16', users: 3820, properties: 186, aiReviews: 920, revenue: 42800 },
  { date: '06-17', users: 4210, properties: 204, aiReviews: 1060, revenue: 48100 },
  { date: '06-18', users: 4680, properties: 226, aiReviews: 1180, revenue: 52600 },
  { date: '06-19', users: 5120, properties: 251, aiReviews: 1320, revenue: 58300 },
  { date: '06-20', users: 5760, properties: 279, aiReviews: 1490, revenue: 64100 },
  { date: '06-21', users: 6380, properties: 312, aiReviews: 1710, revenue: 70200 },
  { date: '06-22', users: 7020, properties: 341, aiReviews: 1940, revenue: 81100 },
];

const fallbackOverview: AnalyticsOverview = {
  rangeLabel: '近 7 天',
  cards: metrics,
  trend,
  rankings: [
    { name: '上海 · 浦东新区', value: '2,486', meta: 'AI 评房调用' },
    { name: '北京 · 朝阳区', value: '2,102', meta: '新增线索' },
    { name: '深圳 · 南山区', value: '1,846', meta: '会员订单' },
    { name: '杭州 · 余杭区', value: '1,274', meta: '新增房源' },
  ],
  funnel: [
    { label: '访问看房报告', count: 48600, rate: '100%' },
    { label: '触发 AI 评房', count: 12740, rate: '26.2%' },
    { label: '查看会员权益', count: 6120, rate: '12.6%' },
    { label: '完成会员支付', count: 3694, rate: '7.6%' },
  ],
};

const fallbackSections: Record<Exclude<AnalyticsTabKey, 'overview'>, AnalyticsSection> = {
  users: {
    title: '用户分析',
    cards: metrics.slice(0, 5),
    trend,
    table: [
      { name: '新用户注册', value: '3,218', meta: '转化率 18.6%' },
      { name: '活跃用户回访', value: '42,180', meta: 'WAU' },
      { name: '沉默用户召回', value: '1,126', meta: '短信/Push 触达' },
    ],
  },
  properties: {
    title: '房源分析',
    cards: [metrics[5], metrics[6], metrics[0], metrics[4]],
    trend,
    table: fallbackOverview.rankings,
  },
  membership: {
    title: '会员转化',
    cards: [metrics[7], metrics[8], metrics[9], metrics[3]],
    trend,
    table: [
      { name: '月度会员', value: '2,184', meta: '¥29 档' },
      { name: '季度会员', value: '948', meta: '¥79 档' },
      { name: '年度会员', value: '562', meta: '¥199 档' },
    ],
  },
  'ai-review': {
    title: 'AI 评房',
    cards: [metrics[6], metrics[5], metrics[7], metrics[8]],
    trend,
    table: [
      { name: '户型风险识别', value: '4,812', meta: '调用量' },
      { name: '小区配套分析', value: '3,624', meta: '调用量' },
      { name: '价格合理性评估', value: '2,986', meta: '调用量' },
    ],
  },
};


const fallbackTodos: TodoCenter = {
  total: 39,
  role: 'demo',
  updatedAt: '2026-06-25 09:30',
  categories: [
    {
      type: 'content_moderation',
      label: '内容审核',
      description: '社区笔记、评论与举报内容待处理',
      count: 12,
      targetUrl: '/content-moderation?status=pending&source=todos',
      items: [
        { id: 'CM-1024', title: '社区笔记疑似营销内容', description: '命中广告关键词，等待审核', createdAt: '10 分钟前', targetUrl: '/content-moderation?status=pending&contentId=CM-1024' },
        { id: 'CM-1025', title: '评论举报待复核', description: '3 位用户举报同一评论', createdAt: '26 分钟前', targetUrl: '/content-moderation?status=pending&contentId=CM-1025' },
      ],
    },
    {
      type: 'property_review',
      label: '房源治理',
      description: '重复房源、低完整度与上下架审核',
      count: 9,
      targetUrl: '/property-governance?status=pending&source=todos',
      items: [
        { id: 'PG-221', title: '浦东新区房源缺少产权信息', description: '完整度低于 60 分', createdAt: '35 分钟前', targetUrl: '/property-governance?status=pending&propertyId=PG-221' },
      ],
    },
    {
      type: 'refund_review',
      label: '退款审核',
      description: '会员订单退款与支付异常复核',
      count: 7,
      targetUrl: '/finance/refunds?status=pending&source=todos',
      items: [
        { id: 'RF-087', title: '年度会员退款申请', description: '用户提交重复扣款凭证', createdAt: '1 小时前', targetUrl: '/finance/refunds?status=pending&refundId=RF-087' },
      ],
    },
    {
      type: 'support_ticket',
      label: '客服工单',
      description: '待分派、待回复与超时工单',
      count: 8,
      targetUrl: '/support/tickets?status=open&source=todos',
      items: [
        { id: 'ST-310', title: 'AI 评房报告未生成', description: 'SLA 剩余 25 分钟', createdAt: '18 分钟前', targetUrl: '/support/tickets?status=open&ticketId=ST-310' },
      ],
    },
    {
      type: 'ai_review',
      label: 'AI 结果抽检',
      description: '高风险 AI 输出与问题样本待复核',
      count: 3,
      targetUrl: '/ai/reviews?status=pending&source=todos',
      items: [
        { id: 'AI-066', title: '价格合理性结论需复核', description: '模型置信度低于阈值', createdAt: '2 小时前', targetUrl: '/ai/reviews?status=pending&sampleId=AI-066' },
      ],
    },
  ],
};

function useTodoCenter() {
  const currentAdmin = useAuthStore((state) => state.currentAdmin);
  const role = currentAdmin?.role.id ?? currentAdmin?.role.name;
  const [state, setState] = useState<{ data: TodoCenter; loading: boolean; error?: string }>({ data: fallbackTodos, loading: true });

  useEffect(() => {
    let ignore = false;
    fetchAdminTodos({ role })
      .then((data) => {
        if (!ignore) setState({ data, loading: false });
      })
      .catch(() => {
        if (!ignore) setState({ data: { ...fallbackTodos, role }, loading: false, error: '待办接口暂不可用，当前展示演示数据' });
      });
    return () => {
      ignore = true;
    };
  }, [role]);

  return state;
}

function TodoCenterPanel() {
  const navigate = useNavigate();
  const todos = useTodoCenter();
  return (
    <section className="todo-center">
      <div className="todo-center-header">
        <div>
          <p className="eyebrow">待办中心</p>
          <h2>待办总数 <strong>{todos.data.total}</strong></h2>
          <span>按当前管理员角色过滤 · {todos.data.updatedAt ? `更新于 ${todos.data.updatedAt}` : '实时统计'}</span>
        </div>
        {todos.error ? <span className="todo-warning">{todos.error}</span> : todos.loading ? <span className="todo-loading">加载中...</span> : null}
      </div>
      <div className="todo-card-grid">
        {todos.data.categories.map((category) => (
          <button key={category.type} type="button" className="todo-card" onClick={() => navigate(category.targetUrl)}>
            <span>{category.label}</span>
            <strong>{category.count}</strong>
            <small>{category.description}</small>
            <em>查看并处理 →</em>
          </button>
        ))}
      </div>
      <div className="todo-recent-list">
        {todos.data.categories.flatMap((category) => category.items.map((item) => ({ ...item, category: category.label }))).slice(0, 5).map((item) => (
          <button key={`${item.category}-${item.id}`} type="button" className="todo-recent-item" onClick={() => navigate(item.targetUrl)}>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <small>{item.description} · {item.createdAt}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

const tabs: Array<{ key: AnalyticsTabKey; label: string }> = [
  { key: 'overview', label: '总览' },
  { key: 'users', label: '用户分析' },
  { key: 'properties', label: '房源分析' },
  { key: 'membership', label: '会员转化' },
  { key: 'ai-review', label: 'AI 评房' },
];

const sectionLoaders = {
  users: analyticsApi.getUsers,
  properties: analyticsApi.getProperties,
  membership: analyticsApi.getMembership,
  'ai-review': analyticsApi.getAiReview,
};

function RangeFilter({ value, onChange }: RangeFilterProps) {
  const showCustom = value.preset === 'custom';
  const updatePreset = (preset: RangePreset) => onChange({ ...value, preset });
  return (
    <div className="range-filter" aria-label="时间范围筛选">
      {(['today', '7d', '30d', 'custom'] as RangePreset[]).map((item) => (
        <button key={item} type="button" className={value.preset === item ? 'active' : ''} onClick={() => updatePreset(item)}>
          {item === 'today' ? '今日' : item === '7d' ? '近 7 天' : item === '30d' ? '近 30 天' : '自定义时间'}
        </button>
      ))}
      {showCustom && (
        <div className="custom-range">
          <input type="date" value={value.startDate ?? ''} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
          <span>至</span>
          <input type="date" value={value.endDate ?? ''} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
        </div>
      )}
    </div>
  );
}

function useOverview(range: AnalyticsRange) {
  const [state, setState] = useState<AnalyticsState>({ data: fallbackOverview, loading: true });

  useEffect(() => {
    let ignore = false;
    analyticsApi.getOverview(range)
      .then((data) => {
        if (!ignore) setState({ data, loading: false });
      })
      .catch(() => {
        if (!ignore) setState({ data: fallbackOverview, loading: false, error: '接口暂不可用，当前展示演示数据' });
      });
    return () => {
      ignore = true;
    };
  }, [range]);

  return state;
}

function useSection(tab: AnalyticsTabKey, range: AnalyticsRange) {
  const fallback = tab === 'overview' ? fallbackSections.users : fallbackSections[tab];
  const [state, setState] = useState<SectionState>({ data: fallback, loading: false });

  useEffect(() => {
    if (tab === 'overview') return;
    let ignore = false;
    sectionLoaders[tab](range)
      .then((data) => {
        if (!ignore) setState({ data, loading: false });
      })
      .catch(() => {
        if (!ignore) setState({ data: fallbackSections[tab], loading: false, error: '接口暂不可用，当前展示演示数据' });
      });
    return () => {
      ignore = true;
    };
  }, [fallback, range, tab]);

  return state;
}

function MetricGrid({ cards, compact = false }: { cards: MetricCard[]; compact?: boolean }) {
  return (
    <div className={`metric-grid${compact ? ' compact' : ''}`}>
      {cards.map((card) => (
        <article className="metric-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.delta} · {card.hint}</small>
        </article>
      ))}
    </div>
  );
}

function StatusMessage({ loading, error }: { loading: boolean; error?: string }) {
  if (loading) return <p className="status-text">正在加载最新统计数据...</p>;
  if (error) return <p className="status-text warning">{error}</p>;
  return null;
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = useMemo(() => Math.max(...data.map((item) => item.users), 1), [data]);
  return (
    <section className="analysis-panel wide">
      <h2>趋势图</h2>
      <div className="bar-chart">
        {data.map((item) => (
          <div className="bar-item" key={item.date}>
            <div className="bar" style={{ height: `${(item.users / max) * 100}%` }} title={`${item.users} 活跃用户`} />
            <span>{item.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RankingTable({ items }: { items: RankingItem[] }) {
  return (
    <section className="analysis-panel">
      <h2>排行表</h2>
      <table>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.name}>
              <td>#{index + 1}</td>
              <td>{item.name}<small>{item.meta}</small></td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Funnel({ data }: { data: AnalyticsOverview['funnel'] }) {
  const max = Math.max(data[0]?.count ?? 1, 1);
  return (
    <section className="analysis-panel">
      <h2>转化漏斗</h2>
      <div className="funnel">
        {data.map((step) => (
          <div className="funnel-step" key={step.label} style={{ width: `${Math.max((step.count / max) * 100, 42)}%` }}>
            <strong>{step.label}</strong><span>{step.count.toLocaleString()} · {step.rate}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [range, setRange] = useState<AnalyticsRange>({ preset: '7d' });
  const overview = useOverview(range);
  return (
    <div className="analytics-page">
      <p className="eyebrow">核心指标</p>
      <div className="page-heading"><div><h1>数据看板</h1><p>首页聚焦 DAU、收入、会员转化与 AI 调用等核心经营指标。</p></div><RangeFilter value={range} onChange={setRange} /></div>
      <StatusMessage loading={overview.loading} error={overview.error} />
      <TodoCenterPanel />
      <MetricGrid cards={overview.data.cards.slice(0, 6)} compact />
    </div>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>({ preset: '7d' });
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>('overview');
  const overview = useOverview(range);
  const section = useSection(activeTab, range);
  const activeCards = activeTab === 'overview' ? overview.data.cards : section.data.cards;
  const activeTrend = activeTab === 'overview' ? overview.data.trend : section.data.trend;
  const activeRanking = activeTab === 'overview' ? overview.data.rankings : section.data.table;
  const isLoading = activeTab === 'overview' ? overview.loading : section.loading;
  const error = activeTab === 'overview' ? overview.error : section.error;

  return (
    <div className="analytics-page">
      <p className="eyebrow">详细分析</p>
      <div className="page-heading"><div><h1>数据分析</h1><p>对接 /admin/analytics/* 接口，支持按时间范围查看用户、房源、会员和 AI 评房表现。</p></div><RangeFilter value={range} onChange={setRange} /></div>
      <div className="analysis-tabs">{tabs.map((tab) => <button type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)} key={tab.key}>{tab.label}</button>)}</div>
      <StatusMessage loading={isLoading} error={error} />
      <MetricGrid cards={activeCards} />
      <div className="analysis-grid"><TrendChart data={activeTrend} /><RankingTable items={activeRanking} /><Funnel data={overview.data.funnel} /></div>
    </div>
  );
}
