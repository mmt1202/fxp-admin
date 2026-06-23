import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiClient, ContentQualityScore, ContentType, ReviewStatus } from '../api/client';

type LoadState = {
  loading: boolean;
  error?: string;
};

const contentTypeLabels: Record<ContentType | 'all', string> = {
  all: '全部类型',
  community_note: '社区笔记',
  comment: '评论',
  property_review: '房源评价',
  ai_report: 'AI 报告',
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已驳回',
  adjusted: '已调分',
};

const riskLabels = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

const demoItems: ContentQualityScore[] = [
  {
    contentId: 'note-1024',
    contentType: 'community_note',
    title: '南山两居看房记录：采光、通勤与噪音实测',
    authorName: '运营示例用户',
    qualityScore: 94,
    riskLevel: 'low',
    reviewStatus: 'approved',
    dimensions: { completeness: 96, imageCount: 8, textLength: 1680, sensitiveHits: 0, reportCount: 0, likeCount: 128, favoriteCount: 46, shareCount: 19, suspectedAd: false },
    generatedAt: '2026-06-20 10:30',
  },
  {
    contentId: 'review-8848',
    contentType: 'property_review',
    title: '房源评价疑似导流广告',
    authorName: '匿名用户',
    qualityScore: 36,
    riskLevel: 'high',
    reviewStatus: 'pending',
    dimensions: { completeness: 42, imageCount: 0, textLength: 58, sensitiveHits: 3, reportCount: 7, likeCount: 1, favoriteCount: 0, shareCount: 0, suspectedAd: true },
    generatedAt: '2026-06-22 18:12',
  },
];

function scoreClass(score: number) {
  if (score >= 85) return 'good';
  if (score >= 60) return 'medium';
  return 'bad';
}

function getFallbackSections(items: ContentQualityScore[]) {
  return {
    highQuality: items.filter((item) => item.qualityScore >= 85),
    riskItems: items.filter((item) => item.qualityScore < 60 || item.riskLevel === 'high'),
  };
}

export function ContentQuality() {
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');
  const [items, setItems] = useState<ContentQualityScore[]>([]);
  const [highQuality, setHighQuality] = useState<ContentQualityScore[]>([]);
  const [riskItems, setRiskItems] = useState<ContentQualityScore[]>([]);
  const [selected, setSelected] = useState<ContentQualityScore | null>(null);
  const [reviewScore, setReviewScore] = useState(80);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('adjusted');
  const [reviewNote, setReviewNote] = useState('');
  const [state, setState] = useState<LoadState>({ loading: true });
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiClient.getContentQuality({ contentType })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setHighQuality(data.highQuality.length ? data.highQuality : getFallbackSections(data.items).highQuality);
        setRiskItems(data.riskItems.length ? data.riskItems : getFallbackSections(data.items).riskItems);
        setState({ loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const filtered = contentType === 'all' ? demoItems : demoItems.filter((item) => item.contentType === contentType);
        const fallback = getFallbackSections(filtered);
        setItems(filtered);
        setHighQuality(fallback.highQuality);
        setRiskItems(fallback.riskItems);
        setState({ loading: false, error: error instanceof Error ? error.message : '内容质量接口请求失败，当前展示示例数据。' });
      });

    return () => {
      active = false;
    };
  }, [contentType]);

  const summary = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.reviewStatus === 'pending').length,
    risk: riskItems.length,
    averageScore: items.length ? Math.round(items.reduce((sum, item) => sum + item.qualityScore, 0) / items.length) : 0,
  }), [items, riskItems.length]);

  const selectItem = async (item: ContentQualityScore) => {
    setSelected(item);
    setReviewScore(item.qualityScore);
    setReviewStatus(item.reviewStatus === 'pending' ? 'adjusted' : item.reviewStatus);
    setReviewNote(item.reviewNote ?? '');
    setReviewMessage('');

    try {
      const detail = await apiClient.getContentQualityDetail(item.contentId);
      setSelected(detail);
      setReviewScore(detail.qualityScore);
      setReviewStatus(detail.reviewStatus === 'pending' ? 'adjusted' : detail.reviewStatus);
      setReviewNote(detail.reviewNote ?? '');
    } catch {
      // 列表数据已足够支持复核预览；详情接口失败时不打断操作。
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    try {
      const reviewed = await apiClient.reviewContentQuality(selected.contentId, {
        qualityScore: reviewScore,
        reviewStatus,
        reviewNote,
      });
      setSelected(reviewed);
      setItems((current) => current.map((item) => item.contentId === reviewed.contentId ? reviewed : item));
      setReviewMessage('人工复核评分已保存。');
    } catch {
      setReviewMessage('复核接口保存失败，请稍后重试。');
    }
  };

  return (
    <div className="content-quality-page">
      <div className="page-heading">
        <p className="eyebrow">内容质量</p>
        <h1>内容质量评分</h1>
        <p>基于完整度、图片数量、文本长度、敏感词、举报、互动与广告嫌疑，为社区笔记、评论、房源评价、AI 报告生成质量分。</p>
      </div>

      <div className="quality-toolbar">
        <label className="field-label compact-field">
          内容类型
          <select value={contentType} onChange={(event) => { setContentType(event.target.value as ContentType | 'all'); setState({ loading: true }); setReviewMessage(''); }}>
            {Object.entries(contentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="metric-grid">
        <div><strong>{summary.total}</strong><span>评分内容</span></div>
        <div><strong>{summary.averageScore}</strong><span>平均质量分</span></div>
        <div><strong>{summary.risk}</strong><span>低质/风险</span></div>
        <div><strong>{summary.pending}</strong><span>待人工复核</span></div>
      </div>

      {state.loading && <div className="api-panel">正在加载内容质量数据...</div>}
      {state.error && <div className="api-panel error">{state.error}（已回退到本地示例数据，便于预览页面能力。）</div>}

      <section className="quality-section">
        <h2>高质量内容榜单</h2>
        <div className="quality-list">
          {highQuality.map((item) => <QualityCard key={item.contentId} item={item} onSelect={selectItem} />)}
        </div>
      </section>

      <section className="quality-section">
        <h2>低质量/风险内容</h2>
        <div className="quality-list">
          {riskItems.map((item) => <QualityCard key={item.contentId} item={item} onSelect={selectItem} />)}
        </div>
      </section>

      {selected && (
        <section className="quality-review-panel">
          <div>
            <p className="eyebrow">人工复核</p>
            <h2>{selected.title}</h2>
            <p>{contentTypeLabels[selected.contentType]} · {riskLabels[selected.riskLevel]} · {reviewStatusLabels[selected.reviewStatus]}</p>
            <div className="dimension-grid">
              <span>完整度：{selected.dimensions.completeness}</span>
              <span>图片：{selected.dimensions.imageCount}</span>
              <span>文本：{selected.dimensions.textLength} 字</span>
              <span>敏感词：{selected.dimensions.sensitiveHits}</span>
              <span>举报：{selected.dimensions.reportCount}</span>
              <span>互动：{selected.dimensions.likeCount + selected.dimensions.favoriteCount + selected.dimensions.shareCount}</span>
              <span>疑似广告：{selected.dimensions.suspectedAd ? '是' : '否'}</span>
            </div>
          </div>

          <form className="review-form" onSubmit={submitReview}>
            <label className="field-label">
              复核质量分
              <input type="number" min="0" max="100" value={reviewScore} onChange={(event) => setReviewScore(Number(event.target.value))} />
            </label>
            <label className="field-label">
              复核状态
              <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as ReviewStatus)}>
                {Object.entries(reviewStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field-label">
              复核备注
              <textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="请输入人工复核意见" />
            </label>
            {reviewMessage ? <p className="status-message saved">{reviewMessage}</p> : null}
            <button type="submit">保存复核结果</button>
          </form>
        </section>
      )}
    </div>
  );
}

function QualityCard({ item, onSelect }: { item: ContentQualityScore; onSelect: (item: ContentQualityScore) => void }) {
  return (
    <article className="quality-card">
      <div className="quality-card-header">
        <span className={`score-pill ${scoreClass(item.qualityScore)}`}>{item.qualityScore}</span>
        <span>{contentTypeLabels[item.contentType]}</span>
        <span>{riskLabels[item.riskLevel]}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.authorName ?? '未知作者'} · {reviewStatusLabels[item.reviewStatus]}</p>
      <div className="dimension-grid">
        <span>完整度 {item.dimensions.completeness}</span>
        <span>图片 {item.dimensions.imageCount}</span>
        <span>文本 {item.dimensions.textLength}</span>
        <span>敏感词 {item.dimensions.sensitiveHits}</span>
        <span>举报 {item.dimensions.reportCount}</span>
        <span>点赞/收藏/分享 {item.dimensions.likeCount}/{item.dimensions.favoriteCount}/{item.dimensions.shareCount}</span>
        <span>广告 {item.dimensions.suspectedAd ? '疑似' : '否'}</span>
      </div>
      <button type="button" onClick={() => onSelect(item)}>查看并复核</button>
    </article>
  );
}
