import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  benefitTypeLabels,
  CouponBatch,
  CouponBenefitType,
  marketingApi,
  RedeemCode,
} from '../api/marketing';

const benefitOptions: CouponBenefitType[] = ['membership_discount', 'free_ai_credits', 'membership_days'];

const fallbackCouponBatches: CouponBatch[] = [
  {
    id: 'batch-vip-summer',
    name: '暑期会员折扣券',
    benefitType: 'membership_discount',
    benefitValue: 85,
    totalCount: 1000,
    claimedCount: 328,
    usedCount: 91,
    status: 'active',
    startsAt: '2026-06-01T00:00:00Z',
    endsAt: '2026-08-31T23:59:59Z',
    createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'batch-ai-trial',
    name: '新用户 AI 试用包',
    benefitType: 'free_ai_credits',
    benefitValue: 20,
    totalCount: 500,
    claimedCount: 114,
    usedCount: 76,
    status: 'active',
    startsAt: '2026-06-10T00:00:00Z',
    endsAt: '2026-07-10T23:59:59Z',
    createdAt: '2026-06-08T09:30:00Z',
  },
];

const fallbackRedeemCodes: RedeemCode[] = [
  {
    id: 'code-1',
    code: 'FXP-VIP-7D9K',
    benefitType: 'membership_days',
    benefitValue: 7,
    status: 'redeemed',
    redeemedByUserId: 'user_1024',
    redeemedAt: '2026-06-18T12:45:00Z',
    expiresAt: '2026-07-31T23:59:59Z',
    createdAt: '2026-06-15T08:00:00Z',
  },
  {
    id: 'code-2',
    code: 'FXP-AI-3Q8M',
    benefitType: 'free_ai_credits',
    benefitValue: 30,
    status: 'unused',
    expiresAt: '2026-07-31T23:59:59Z',
    createdAt: '2026-06-15T08:00:00Z',
  },
];

const today = new Date().toISOString().slice(0, 10);

function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatBenefit(type: CouponBenefitType, value: number) {
  if (type === 'membership_discount') return `${value / 10} 折`;
  if (type === 'free_ai_credits') return `${value} 次`;
  return `${value} 天`;
}

export function MarketingTools() {
  const [couponBatches, setCouponBatches] = useState<CouponBatch[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [couponKeyword, setCouponKeyword] = useState('');
  const [codeKeyword, setCodeKeyword] = useState('');
  const [couponForm, setCouponForm] = useState({
    name: '',
    benefitType: 'membership_discount' as CouponBenefitType,
    benefitValue: 85,
    totalCount: 100,
    startsAt: today,
    endsAt: today,
  });
  const [codeForm, setCodeForm] = useState({
    batchName: '',
    benefitType: 'membership_days' as CouponBenefitType,
    benefitValue: 7,
    quantity: 50,
    expiresAt: today,
  });

  useEffect(() => {
    let ignore = false;
    Promise.all([marketingApi.getCoupons(), marketingApi.getRedeemCodes()])
      .then(([couponResponse, codeResponse]) => {
        if (ignore) return;
        setCouponBatches(couponResponse.items);
        setRedeemCodes(codeResponse.items);
      })
      .catch(() => {
        if (ignore) return;
        setCouponBatches(fallbackCouponBatches);
        setRedeemCodes(fallbackRedeemCodes);
        setNotice('当前展示本地示例数据；后端接入 /admin/marketing 后将自动展示真实数据。');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalCoupons = couponBatches.reduce((sum, item) => sum + item.totalCount, 0);
    const claimed = couponBatches.reduce((sum, item) => sum + item.claimedCount, 0);
    const used = couponBatches.reduce((sum, item) => sum + item.usedCount, 0);
    const redeemedCodes = redeemCodes.filter((item) => item.status === 'redeemed').length;
    return { totalCoupons, claimed, used, redeemedCodes };
  }, [couponBatches, redeemCodes]);

  const filteredCouponBatches = useMemo(() => {
    const keyword = couponKeyword.trim().toLowerCase();
    if (!keyword) return couponBatches;
    return couponBatches.filter((item) => (
      item.name.toLowerCase().includes(keyword)
      || item.status.toLowerCase().includes(keyword)
      || benefitTypeLabels[item.benefitType].toLowerCase().includes(keyword)
    ));
  }, [couponBatches, couponKeyword]);

  const filteredRedeemCodes = useMemo(() => {
    const keyword = codeKeyword.trim().toLowerCase();
    if (!keyword) return redeemCodes;
    return redeemCodes.filter((item) => (
      item.code.toLowerCase().includes(keyword)
      || item.status.toLowerCase().includes(keyword)
      || item.redeemedByUserId?.toLowerCase().includes(keyword)
      || benefitTypeLabels[item.benefitType].toLowerCase().includes(keyword)
    ));
  }, [codeKeyword, redeemCodes]);

  const handleCreateCoupon = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...couponForm,
      startsAt: new Date(couponForm.startsAt).toISOString(),
      endsAt: new Date(couponForm.endsAt).toISOString(),
    };
    try {
      const created = await marketingApi.createCouponBatch(payload);
      setCouponBatches((items) => [created, ...items]);
      setNotice('优惠券批次创建成功。');
    } catch {
      const optimistic: CouponBatch = {
        id: `local-${Date.now()}`,
        ...payload,
        claimedCount: 0,
        usedCount: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      setCouponBatches((items) => [optimistic, ...items]);
      setNotice('后端暂不可用，已在页面中预览新建优惠券批次。');
    }
  };

  const handleToggleCouponStatus = async (batch: CouponBatch) => {
    const nextStatus = batch.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await marketingApi.updateCouponBatch(batch.id, { status: nextStatus });
      setCouponBatches((items) => items.map((item) => (item.id === batch.id ? updated : item)));
      setNotice(`已${nextStatus === 'active' ? '启用' : '暂停'}优惠券批次。`);
    } catch {
      setCouponBatches((items) => items.map((item) => (item.id === batch.id ? { ...item, status: nextStatus } : item)));
      setNotice(`后端暂不可用，已在页面中预览${nextStatus === 'active' ? '启用' : '暂停'}状态。`);
    }
  };

  const handleCreateCodes = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...codeForm, expiresAt: new Date(codeForm.expiresAt).toISOString() };
    try {
      const created = await marketingApi.createRedeemCodeBatch(payload);
      setRedeemCodes((items) => [...created.items, ...items]);
      setNotice('兑换码生成成功。');
    } catch {
      const previewCodes = Array.from({ length: Math.min(codeForm.quantity, 5) }, (_, index): RedeemCode => ({
        id: `local-code-${Date.now()}-${index}`,
        code: `FXP-${codeForm.benefitType === 'membership_days' ? 'VIP' : 'AI'}-${String(index + 1).padStart(4, '0')}`,
        benefitType: codeForm.benefitType,
        benefitValue: codeForm.benefitValue,
        status: 'unused',
        expiresAt: payload.expiresAt,
        createdAt: new Date().toISOString(),
      }));
      setRedeemCodes((items) => [...previewCodes, ...items]);
      setNotice('后端暂不可用，已生成前 5 个兑换码预览。');
    }
  };

  return (
    <div className="marketing-page">
      <div className="page-heading">
        <p className="eyebrow">Marketing Tools</p>
        <h1>营销工具</h1>
        <p>集中管理优惠券批次、兑换码生成、领取记录和使用记录。</p>
      </div>

      {notice && <div className="notice-banner">{notice}</div>}

      <div className="stats-grid">
        <div><strong>{stats.totalCoupons}</strong><span>优惠券总量</span></div>
        <div><strong>{stats.claimed}</strong><span>已领取</span></div>
        <div><strong>{stats.used}</strong><span>已使用</span></div>
        <div><strong>{stats.redeemedCodes}</strong><span>已兑换码</span></div>
      </div>

      <div className="marketing-grid">
        <form className="marketing-form" onSubmit={handleCreateCoupon}>
          <h2>创建优惠券批次</h2>
          <label>批次名称<input value={couponForm.name} required onChange={(event) => setCouponForm({ ...couponForm, name: event.target.value })} /></label>
          <label>权益类型<select value={couponForm.benefitType} onChange={(event) => setCouponForm({ ...couponForm, benefitType: event.target.value as CouponBenefitType })}>{benefitOptions.map((type) => <option key={type} value={type}>{benefitTypeLabels[type]}</option>)}</select></label>
          <label>权益值<input type="number" min="1" value={couponForm.benefitValue} onChange={(event) => setCouponForm({ ...couponForm, benefitValue: Number(event.target.value) })} /></label>
          <label>发放数量<input type="number" min="1" value={couponForm.totalCount} onChange={(event) => setCouponForm({ ...couponForm, totalCount: Number(event.target.value) })} /></label>
          <div className="form-row"><label>开始日期<input type="date" value={couponForm.startsAt} onChange={(event) => setCouponForm({ ...couponForm, startsAt: event.target.value })} /></label><label>结束日期<input type="date" value={couponForm.endsAt} onChange={(event) => setCouponForm({ ...couponForm, endsAt: event.target.value })} /></label></div>
          <button type="submit">创建批次</button>
        </form>

        <form className="marketing-form" onSubmit={handleCreateCodes}>
          <h2>生成兑换码</h2>
          <label>活动名称<input value={codeForm.batchName} required onChange={(event) => setCodeForm({ ...codeForm, batchName: event.target.value })} /></label>
          <label>权益类型<select value={codeForm.benefitType} onChange={(event) => setCodeForm({ ...codeForm, benefitType: event.target.value as CouponBenefitType })}>{benefitOptions.map((type) => <option key={type} value={type}>{benefitTypeLabels[type]}</option>)}</select></label>
          <label>权益值<input type="number" min="1" value={codeForm.benefitValue} onChange={(event) => setCodeForm({ ...codeForm, benefitValue: Number(event.target.value) })} /></label>
          <label>生成数量<input type="number" min="1" max="10000" value={codeForm.quantity} onChange={(event) => setCodeForm({ ...codeForm, quantity: Number(event.target.value) })} /></label>
          <label>过期日期<input type="date" value={codeForm.expiresAt} onChange={(event) => setCodeForm({ ...codeForm, expiresAt: event.target.value })} /></label>
          <button type="submit">批量生成</button>
        </form>
      </div>

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>领取和使用记录</h2>
            <p>按批次查看发放、领取、使用和有效期，支持暂停或启用批次。</p>
          </div>
          <input aria-label="搜索优惠券批次" placeholder="搜索批次/状态/权益" value={couponKeyword} onChange={(event) => setCouponKeyword(event.target.value)} />
        </div>
        {loading ? <p>加载中...</p> : (
          <table>
            <thead><tr><th>批次</th><th>权益</th><th>状态</th><th>领取/总量</th><th>使用率</th><th>有效期</th><th>操作</th></tr></thead>
            <tbody>{filteredCouponBatches.map((item) => <tr key={item.id}><td>{item.name}</td><td>{benefitTypeLabels[item.benefitType]} · {formatBenefit(item.benefitType, item.benefitValue)}</td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td><td>{item.claimedCount}/{item.totalCount}</td><td>{item.claimedCount ? `${Math.round((item.usedCount / item.claimedCount) * 100)}%` : '0%'}</td><td>{formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}</td><td><button className="secondary-button" type="button" onClick={() => handleToggleCouponStatus(item)}>{item.status === 'active' ? '暂停' : '启用'}</button></td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h2>兑换码记录</h2>
            <p>记录兑换用户与兑换时间，便于追踪重复兑换和异常使用。</p>
          </div>
          <input aria-label="搜索兑换码" placeholder="搜索兑换码/用户/状态" value={codeKeyword} onChange={(event) => setCodeKeyword(event.target.value)} />
        </div>
        <table>
          <thead><tr><th>兑换码</th><th>权益</th><th>状态</th><th>兑换用户</th><th>兑换时间</th><th>过期时间</th></tr></thead>
          <tbody>{filteredRedeemCodes.map((item) => <tr key={item.id}><td><code>{item.code}</code></td><td>{benefitTypeLabels[item.benefitType]} · {formatBenefit(item.benefitType, item.benefitValue)}</td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td><td>{item.redeemedByUserId ?? '-'}</td><td>{formatDateTime(item.redeemedAt)}</td><td>{formatDateTime(item.expiresAt)}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="risk-card">
        <h2>后端模型与 App 兑换接入清单</h2>
        <div className="checklist-grid">
          <div><strong>CouponBatch</strong><span>批次名称、权益类型、权益值、总量、领取/使用计数、有效期和状态。</span></div>
          <div><strong>Coupon</strong><span>归属批次、领取用户、领取时间、使用时间、使用订单或权益流水。</span></div>
          <div><strong>RedeemCode</strong><span>唯一 code、权益、状态、兑换用户、兑换时间、过期时间和风控来源。</span></div>
        </div>
        <ul>
          <li>App 端新增“兑换码”入口，调用兑换接口时提交用户 ID、设备 ID、IP 与兑换码。</li>
          <li>后端使用唯一索引和事务锁防止同一兑换码重复使用，记录 redeemedByUserId 与 redeemedAt。</li>
          <li>按用户、设备和 IP 增加限频策略，异常失败次数触发冷却，降低批量撞库和刷码风险。</li>
        </ul>
      </section>
    </div>
  );
}
