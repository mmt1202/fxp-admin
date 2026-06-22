import { useEffect, useMemo, useState } from 'react';
import {
  CommunityComment,
  CommunityContentStatus,
  CommunityModerationFilters,
  CommunityNote,
  communityApi,
} from '../api/community';

type TabKey = 'notes' | 'comments';

type ModerationAction = {
  label: string;
  status: CommunityContentStatus;
  tone: 'primary' | 'neutral' | 'danger';
};

const statusLabels: Record<CommunityContentStatus, string> = {
  published: '已发布',
  hidden_by_admin: '管理员隐藏',
  rejected: '已驳回',
};

const moderationActions: ModerationAction[] = [
  { label: '隐藏', status: 'hidden_by_admin', tone: 'neutral' },
  { label: '恢复', status: 'published', tone: 'primary' },
  { label: '驳回', status: 'rejected', tone: 'danger' },
];

const initialFilters: CommunityModerationFilters = {
  keyword: '',
  author: '',
  minReportCount: '',
  maxReportCount: '',
  publishedFrom: '',
  publishedTo: '',
  status: 'all',
};

export function ContentModeration() {
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [filters, setFilters] = useState<CommunityModerationFilters>(initialFilters);
  const [notes, setNotes] = useState<CommunityNote[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeItems = useMemo(() => (activeTab === 'notes' ? notes : comments), [activeTab, comments, notes]);

  useEffect(() => {
    let cancelled = false;

    async function loadModerationQueue() {
      setLoading(true);
      setError('');

      try {
        const response = activeTab === 'notes'
          ? await communityApi.listNotes(filters)
          : await communityApi.listComments(filters);

        if (cancelled) return;

        if (activeTab === 'notes') {
          setNotes(response.items as CommunityNote[]);
        } else {
          setComments(response.items as CommunityComment[]);
        }
        setTotal(response.total);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '内容审核列表加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadModerationQueue();

    return () => {
      cancelled = true;
    };
  }, [activeTab, filters]);

  const updateFilter = (key: keyof CommunityModerationFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateStatus = async (id: string, status: CommunityContentStatus) => {
    setError('');

    try {
      const updated = activeTab === 'notes'
        ? await communityApi.updateNoteStatus(id, status)
        : await communityApi.updateCommentStatus(id, status);

      if (activeTab === 'notes') {
        setNotes((current) => current.map((item) => (item.id === id ? updated as CommunityNote : item)));
      } else {
        setComments((current) => current.map((item) => (item.id === id ? updated as CommunityComment : item)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容状态更新失败');
    }
  };

  return (
    <div className="moderation-page">
      <div className="module-heading">
        <p className="eyebrow">Community Moderation</p>
        <h1>内容审核</h1>
        <p>集中处理社区笔记与评论，按关键词、作者、举报数量和发布时间筛选待审核内容。</p>
      </div>

      <div className="tab-bar" role="tablist" aria-label="内容审核类型">
        <button className={activeTab === 'notes' ? 'active' : ''} type="button" onClick={() => setActiveTab('notes')}>
          笔记审核
        </button>
        <button className={activeTab === 'comments' ? 'active' : ''} type="button" onClick={() => setActiveTab('comments')}>
          评论审核
        </button>
      </div>

      <section className="filter-panel" aria-label="审核筛选">
        <label>
          关键词
          <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="标题、正文、评论内容" />
        </label>
        <label>
          作者
          <input value={filters.author} onChange={(event) => updateFilter('author', event.target.value)} placeholder="作者昵称或 ID" />
        </label>
        <label>
          最少举报数
          <input min="0" type="number" value={filters.minReportCount} onChange={(event) => updateFilter('minReportCount', event.target.value)} />
        </label>
        <label>
          最多举报数
          <input min="0" type="number" value={filters.maxReportCount} onChange={(event) => updateFilter('maxReportCount', event.target.value)} />
        </label>
        <label>
          发布时间起
          <input type="date" value={filters.publishedFrom} onChange={(event) => updateFilter('publishedFrom', event.target.value)} />
        </label>
        <label>
          发布时间止
          <input type="date" value={filters.publishedTo} onChange={(event) => updateFilter('publishedTo', event.target.value)} />
        </label>
        <label>
          状态
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="all">全部</option>
            <option value="published">已发布</option>
            <option value="hidden_by_admin">管理员隐藏</option>
            <option value="rejected">已驳回</option>
          </select>
        </label>
      </section>

      {error && <p className="error-text">{error}</p>}

      <div className="moderation-summary">
        <span>{loading ? '加载中...' : `共 ${total} 条内容`}</span>
        <span>当前：{activeTab === 'notes' ? '笔记审核' : '评论审核'}</span>
      </div>

      <div className="moderation-list">
        {activeItems.map((item) => (
          <article className="moderation-item" key={item.id}>
            <div>
              <div className="item-title-row">
                <h3>{'title' in item ? item.title : `评论 #${item.id}`}</h3>
                <span className={`status-pill status-${item.status}`}>{statusLabels[item.status]}</span>
              </div>
              <p>{item.content}</p>
              <dl>
                <div><dt>作者</dt><dd>{item.author}</dd></div>
                <div><dt>举报次数</dt><dd>{item.reportCount}</dd></div>
                <div><dt>最近举报原因</dt><dd>{item.latestReportReason || '暂无'}</dd></div>
                <div><dt>发布时间</dt><dd>{new Date(item.publishedAt).toLocaleString('zh-CN')}</dd></div>
              </dl>
            </div>
            <div className="action-group">
              {moderationActions.map((action) => (
                <button
                  className={`action-${action.tone}`}
                  disabled={item.status === action.status}
                  key={action.status}
                  type="button"
                  onClick={() => updateStatus(item.id, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        ))}
        {!loading && activeItems.length === 0 && <div className="empty-state">暂无符合条件的内容</div>}
      </div>
    </div>
  );
}
