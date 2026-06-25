import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { pushApi, type PushAudienceType, type PushCampaign, type PushCampaignPayload, type PushCampaignStats } from '../api/push';

const audienceOptions: Array<{ value: PushAudienceType; label: string; hint: string }> = [
  { value: 'all', label: '全部用户', hint: '面向所有开启 Push 权限的 App 用户。' },
  { value: 'users', label: '指定用户', hint: '输入用户 ID，多个用户用逗号或换行分隔。' },
  { value: 'tags', label: '指定标签', hint: '输入用户标签，例如 high_intent、owner。' },
  { value: 'segments', label: '指定分层', hint: '输入用户分层，例如 新用户、沉睡用户、会员用户。' },
];

const statusLabels: Record<PushCampaign['status'], string> = {
  draft: '草稿',
  scheduled: '已定时',
  sending: '发送中',
  sent: '已发送',
  failed: '发送失败',
};

const defaultForm: PushCampaignPayload = {
  title: '',
  content: '',
  linkUrl: '',
  audience: { type: 'all', values: [] },
  scheduledAt: '',
};

function splitValues(value: string) {
  return value.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean);
}

function formatRate(value?: number) {
  if (typeof value !== 'number') return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '-';
}

function statsOf(campaign: PushCampaign, stats: Record<string, PushCampaignStats | undefined>) {
  return stats[campaign.id] ?? campaign.stats;
}

export function PushCampaigns() {
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [form, setForm] = useState<PushCampaignPayload>(defaultForm);
  const [audienceText, setAudienceText] = useState('');
  const [stats, setStats] = useState<Record<string, PushCampaignStats | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedAudience = useMemo(
    () => audienceOptions.find((item) => item.value === form.audience.type) ?? audienceOptions[0],
    [form.audience.type],
  );

  const totals = useMemo(() => campaigns.reduce((sum, campaign) => {
    const campaignStats = statsOf(campaign, stats);
    return {
      targetCount: sum.targetCount + (campaignStats?.targetCount ?? 0),
      deliveredCount: sum.deliveredCount + (campaignStats?.deliveredCount ?? 0),
      clickedCount: sum.clickedCount + (campaignStats?.clickedCount ?? 0),
    };
  }, { targetCount: 0, deliveredCount: 0, clickedCount: 0 }), [campaigns, stats]);

  async function loadCampaigns() {
    setLoading(true);
    setError('');
    try {
      const result = await pushApi.getCampaigns();
      setCampaigns(result.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Push 任务列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadCampaigns();
    });
  }, []);

  function updateForm<K extends keyof PushCampaignPayload>(key: K, value: PushCampaignPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateAudienceType(type: PushAudienceType) {
    setAudienceText('');
    updateForm('audience', { type, values: [] });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload: PushCampaignPayload = {
      ...form,
      linkUrl: form.linkUrl?.trim() || undefined,
      scheduledAt: form.scheduledAt || undefined,
      audience: {
        type: form.audience.type,
        values: form.audience.type === 'all' ? [] : splitValues(audienceText),
      },
    };
    if (payload.audience.type !== 'all' && payload.audience.values.length === 0) {
      setSaving(false);
      setError('请选择目标人群明细，例如用户 ID、标签或分层名称。');
      return;
    }
    try {
      await pushApi.createCampaign(payload);
      setMessage(payload.scheduledAt ? 'Push 任务已创建并等待定时发送。' : 'Push 任务已创建，可在列表中手动发送。');
      setForm(defaultForm);
      setAudienceText('');
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Push 任务创建失败');
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign(campaign: PushCampaign) {
    setError('');
    setMessage('');
    try {
      await pushApi.sendCampaign(campaign.id);
      setMessage(`Push 任务“${campaign.title}”已提交发送。`);
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Push 任务发送失败');
    }
  }

  async function loadStats(campaign: PushCampaign) {
    setError('');
    try {
      const campaignStats = await pushApi.getCampaignStats(campaign.id);
      setStats((current) => ({ ...current, [campaign.id]: campaignStats }));
      setMessage(`已刷新“${campaign.title}”的送达率与点击率。`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Push 效果数据加载失败');
    }
  }

  return (
    <div className="push-page">
      <div className="page-heading"><p className="eyebrow">Push Operations</p><h1>Push 推送</h1><p>创建 PushCampaign 推送任务，配置标题、内容、跳转链接、目标人群和定时发送时间，并跟踪送达率与点击率。</p></div>
      <section className="metric-grid" aria-label="Push 效果汇总"><div><span>目标用户</span><strong>{formatCount(totals.targetCount)}</strong></div><div><span>送达用户</span><strong>{formatCount(totals.deliveredCount)}</strong></div><div><span>点击用户</span><strong>{formatCount(totals.clickedCount)}</strong></div><div><span>整体点击率</span><strong>{formatRate(totals.deliveredCount ? totals.clickedCount / totals.deliveredCount : undefined)}</strong></div></section>
      {message ? <p className="status-message saved">{message}</p> : null}
      {error ? <p className="status-message error">{error}</p> : null}
      <form className="campaign-form form-section" onSubmit={handleSubmit}><h2>创建 Push 任务</h2><div className="form-grid"><label className="field-label">标题<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="例如：你关注的小区有新评价" required /></label><label className="field-label">跳转链接<input value={form.linkUrl} onChange={(event) => updateForm('linkUrl', event.target.value)} placeholder="app://property/123 或 https://..." /></label><label className="field-label">目标人群<select value={form.audience.type} onChange={(event) => updateAudienceType(event.target.value as PushAudienceType)}>{audienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="field-label">定时推送<input type="datetime-local" value={form.scheduledAt} onChange={(event) => updateForm('scheduledAt', event.target.value)} /></label></div><label className="field-label">内容<textarea value={form.content} onChange={(event) => updateForm('content', event.target.value)} placeholder="请输入 Push 正文内容" rows={4} required /></label>{form.audience.type !== 'all' ? <label className="field-label">人群明细<textarea value={audienceText} onChange={(event) => setAudienceText(event.target.value)} placeholder="支持逗号或换行分隔" rows={3} required /></label> : null}<p className="form-hint">{selectedAudience.hint}</p><div className="form-actions"><button type="submit" disabled={saving}>{saving ? '创建中...' : '创建 Push 任务'}</button></div></form>
      <section className="campaign-list form-section"><div className="section-title-row"><h2>Push 任务列表</h2><button type="button" className="secondary-button" onClick={() => void loadCampaigns()} disabled={loading}>刷新</button></div>{loading ? <div className="api-panel">正在加载 Push 任务...</div> : null}{!loading && campaigns.length === 0 ? <div className="api-panel">暂无 Push 任务，请先创建。</div> : null}{!loading && campaigns.map((campaign) => { const campaignStats = statsOf(campaign, stats); const audience = audienceOptions.find((item) => item.value === campaign.audience.type)?.label ?? campaign.audience.type; return <article className="campaign-card" key={campaign.id}><div className="campaign-card-header"><div><h3>{campaign.title}</h3><p>{audience}{campaign.audience.values.length ? ` · ${campaign.audience.values.join('、')}` : ''}</p></div><span className={`campaign-status ${campaign.status}`}>{statusLabels[campaign.status] ?? campaign.status}</span></div><p className="task-content">{campaign.content}</p><dl><div><dt>跳转链接</dt><dd>{campaign.linkUrl || '-'}</dd></div><div><dt>定时发送</dt><dd>{campaign.scheduledAt || '-'}</dd></div><div><dt>实际发送</dt><dd>{campaign.sentAt || '-'}</dd></div></dl><div className="campaign-metrics"><span>目标 {formatCount(campaignStats?.targetCount)}</span><span>已发送 {formatCount(campaignStats?.sentCount)}</span><span>送达率 {formatRate(campaignStats?.deliveryRate)}</span><span>点击率 {formatRate(campaignStats?.clickRate)}</span></div><div className="campaign-actions"><button type="button" onClick={() => void sendCampaign(campaign)} disabled={campaign.status === 'sending'}>发送</button><button type="button" className="secondary-button" onClick={() => void loadStats(campaign)}>查看效果</button></div></article>; })}</section>
    </div>
  );
}
