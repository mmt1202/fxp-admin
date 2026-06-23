import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiClient, type CampaignStatus, type MarketingCampaign, type MarketingCampaignPayload } from '../api/client';

const statusLabels: Record<CampaignStatus, string> = {
  draft: '草稿',
  active: '启用中',
  paused: '已停用',
  ended: '已结束',
};

const emptyForm: MarketingCampaignPayload = {
  name: '',
  type: '拉新活动',
  startTime: '',
  endTime: '',
  status: 'draft',
  targetUsers: '全部用户',
  rewardType: '积分',
  rewardQuantity: 0,
  triggerCondition: '',
};

function toForm(campaign: MarketingCampaign): MarketingCampaignPayload {
  return {
    name: campaign.name,
    type: campaign.type,
    startTime: campaign.startTime?.slice(0, 16) ?? '',
    endTime: campaign.endTime?.slice(0, 16) ?? '',
    status: campaign.status,
    targetUsers: campaign.targetUsers,
    rewardType: campaign.rewardType,
    rewardQuantity: campaign.rewardQuantity,
    triggerCondition: campaign.triggerCondition,
  };
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value ?? 0);
}

export function MarketingCampaigns() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [form, setForm] = useState<MarketingCampaignPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const totals = useMemo(() => campaigns.reduce(
    (sum, campaign) => ({
      participants: sum.participants + (campaign.metrics?.participants ?? 0),
      rewardsIssued: sum.rewardsIssued + (campaign.metrics?.rewardsIssued ?? 0),
      conversions: sum.conversions + (campaign.metrics?.conversions ?? 0),
      orderAmount: sum.orderAmount + (campaign.metrics?.orderAmount ?? 0),
    }),
    { participants: 0, rewardsIssued: 0, conversions: 0, orderAmount: 0 },
  ), [campaigns]);

  async function loadCampaigns() {
    setLoading(true);
    setError(undefined);
    try {
      const result = await apiClient.getMarketingCampaigns();
      setCampaigns(result.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '活动列表加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial API hydration should enter the loading state immediately.
    void loadCampaigns();
  }, []);

  function updateField<K extends keyof MarketingCampaignPayload>(key: K, value: MarketingCampaignPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    setMessage(undefined);

    try {
      if (editingId) {
        await apiClient.updateMarketingCampaign(editingId, form);
        setMessage('活动已更新，App 端将按最新配置判断触发条件并发放奖励。');
      } else {
        await apiClient.createMarketingCampaign(form);
        setMessage('活动已创建，可启用后面向目标用户生效。');
      }
      resetForm();
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '活动保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(campaign: MarketingCampaign, status: CampaignStatus) {
    setError(undefined);
    setMessage(undefined);
    try {
      await apiClient.updateMarketingCampaignStatus(campaign.id, status);
      setMessage(`活动“${campaign.name}”已${status === 'active' ? '启用' : '停用'}。`);
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '活动状态更新失败');
    }
  }

  async function removeCampaign(campaign: MarketingCampaign) {
    setError(undefined);
    setMessage(undefined);
    try {
      await apiClient.deleteMarketingCampaign(campaign.id);
      setMessage(`活动“${campaign.name}”已删除。`);
      if (editingId === campaign.id) resetForm();
      await loadCampaigns();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '活动删除失败');
    }
  }

  return (
    <div className="marketing-page">
      <div className="page-heading">
        <p className="eyebrow">Marketing Campaigns</p>
        <h1>运营活动</h1>
        <p>统一配置活动类型、投放时间、目标用户、触发条件和奖励规则，并查看参与、奖励、转化与订单金额效果。</p>
      </div>

      <section className="metric-grid" aria-label="活动效果汇总">
        <div><span>参与人数</span><strong>{totals.participants}</strong></div>
        <div><span>奖励发放量</span><strong>{totals.rewardsIssued}</strong></div>
        <div><span>转化人数</span><strong>{totals.conversions}</strong></div>
        <div><span>订单金额</span><strong>{formatMoney(totals.orderAmount)}</strong></div>
      </section>

      {message && <p className="status-message saved">{message}</p>}
      {error && <p className="status-message error">{error}</p>}

      <form className="campaign-form" onSubmit={handleSubmit}>
        <h2>{editingId ? '编辑活动' : '创建活动'}</h2>
        <div className="form-grid">
          <label className="field-label">活动名称<input value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></label>
          <label className="field-label">活动类型<input value={form.type} onChange={(event) => updateField('type', event.target.value)} required /></label>
          <label className="field-label">开始时间<input type="datetime-local" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} required /></label>
          <label className="field-label">结束时间<input type="datetime-local" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} required /></label>
          <label className="field-label">活动状态<select value={form.status} onChange={(event) => updateField('status', event.target.value as CampaignStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field-label">目标用户<input value={form.targetUsers} onChange={(event) => updateField('targetUsers', event.target.value)} required /></label>
          <label className="field-label">奖励类型<input value={form.rewardType} onChange={(event) => updateField('rewardType', event.target.value)} required /></label>
          <label className="field-label">奖励数量<input type="number" min="0" value={form.rewardQuantity} onChange={(event) => updateField('rewardQuantity', Number(event.target.value))} required /></label>
        </div>
        <label className="field-label">触发条件<textarea value={form.triggerCondition} onChange={(event) => updateField('triggerCondition', event.target.value)} placeholder="例如：新用户完成首单且订单金额 ≥ 100 元" required /></label>
        <div className="form-actions"><button type="button" className="secondary-button" onClick={resetForm}>重置</button><button type="submit" disabled={saving}>{saving ? '保存中...' : '保存活动'}</button></div>
      </form>

      <section className="campaign-list">
        <h2>活动列表</h2>
        {loading && <div className="api-panel">正在加载活动...</div>}
        {!loading && campaigns.length === 0 && <div className="api-panel">暂无活动，请先创建运营活动。</div>}
        {!loading && campaigns.map((campaign) => (
          <article className="campaign-card" key={campaign.id}>
            <div className="campaign-card-header"><div><h3>{campaign.name}</h3><p>{campaign.type} · {campaign.targetUsers}</p></div><span className={`campaign-status ${campaign.status}`}>{statusLabels[campaign.status] ?? campaign.status}</span></div>
            <dl><div><dt>活动时间</dt><dd>{campaign.startTime} - {campaign.endTime}</dd></div><div><dt>奖励规则</dt><dd>{campaign.rewardType} × {campaign.rewardQuantity}</dd></div><div><dt>触发条件</dt><dd>{campaign.triggerCondition}</dd></div></dl>
            <div className="campaign-metrics"><span>参与 {campaign.metrics?.participants ?? 0}</span><span>奖励 {campaign.metrics?.rewardsIssued ?? 0}</span><span>转化 {campaign.metrics?.conversions ?? 0}</span><span>{formatMoney(campaign.metrics?.orderAmount)}</span></div>
            <div className="campaign-actions"><button type="button" className="secondary-button" onClick={() => { setEditingId(campaign.id); setForm(toForm(campaign)); }}>编辑</button><button type="button" onClick={() => changeStatus(campaign, campaign.status === 'active' ? 'paused' : 'active')}>{campaign.status === 'active' ? '停用' : '启用'}</button><button type="button" className="danger-button" onClick={() => removeCampaign(campaign)}>删除</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}
