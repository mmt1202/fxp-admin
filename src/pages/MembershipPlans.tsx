import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { MembershipPlan, MembershipPlanPayload, membershipPlanApi } from '../api/membershipPlans';

const emptyForm: MembershipPlanPayload = {
  name: '',
  type: 'monthly',
  price: 0,
  validityDays: 30,
  aiQuota: 100,
  enabled: true,
  sortOrder: 0,
};

const planTypes = [
  { value: 'monthly', label: '月度会员' },
  { value: 'quarterly', label: '季度会员' },
  { value: 'yearly', label: '年度会员' },
  { value: 'custom', label: '自定义' },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(price);
}

export function MembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [form, setForm] = useState<MembershipPlanPayload>(emptyForm);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionPlanId, setActionPlanId] = useState<MembershipPlan['id'] | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder || String(a.id).localeCompare(String(b.id))),
    [plans],
  );

  const loadPlans = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');
    try {
      setPlans(await membershipPlanApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : '套餐列表加载失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    membershipPlanApi.list()
      .then(setPlans)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '套餐列表加载失败');
      })
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPlan(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingPlan) {
        await membershipPlanApi.update(editingPlan.id, form);
        setSuccess('套餐已更新');
      } else {
        await membershipPlanApi.create(form);
        setSuccess('套餐已新增');
      }
      resetForm();
      await loadPlans(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '套餐保存失败');
    } finally {
      setSaving(false);
    }
  };

  const editPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      type: plan.type,
      price: plan.price,
      validityDays: plan.validityDays,
      aiQuota: plan.aiQuota,
      enabled: plan.enabled,
      sortOrder: plan.sortOrder,
    });
    setSuccess('');
    setError('');
  };

  const togglePlan = async (plan: MembershipPlan) => {
    setActionPlanId(plan.id);
    setError('');
    setSuccess('');
    try {
      await membershipPlanApi.update(plan.id, {
        name: plan.name,
        type: plan.type,
        price: plan.price,
        validityDays: plan.validityDays,
        aiQuota: plan.aiQuota,
        enabled: !plan.enabled,
        sortOrder: plan.sortOrder,
      });
      setSuccess(plan.enabled ? '套餐已停用' : '套餐已启用');
      await loadPlans(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '状态更新失败');
    } finally {
      setActionPlanId(null);
    }
  };

  const deletePlan = async (plan: MembershipPlan) => {
    if (plan.inUse) {
      setError('该套餐正在使用中，不能直接删除，请改为停用。');
      return;
    }

    const confirmed = window.confirm(`确定删除套餐“${plan.name}”吗？删除后不可恢复。`);
    if (!confirmed) {
      return;
    }

    setActionPlanId(plan.id);
    setError('');
    setSuccess('');
    try {
      await membershipPlanApi.remove(plan.id);
      setSuccess('套餐已删除');
      await loadPlans(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('该套餐正在使用中，不能直接删除，请改为停用。');
      } else {
        setError(err instanceof Error ? err.message : '套餐删除失败');
      }
    } finally {
      setActionPlanId(null);
    }
  };

  return (
    <div className="membership-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Membership Plans</p>
          <h1>会员套餐</h1>
          <p>配置 App 端可购买的会员套餐，启用状态的套餐将用于前台购买入口。</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadPlans()} disabled={loading}>刷新</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="plan-form" onSubmit={handleSubmit}>
        <h2>{editingPlan ? '编辑套餐' : '新增套餐'}</h2>
        <label>
          套餐名称
          <input value={form.name} required placeholder="如：月度 AI 会员" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          套餐类型
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {planTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label>
          价格（元）
          <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
        </label>
        <label>
          有效期（天）
          <input type="number" min="1" value={form.validityDays} onChange={(event) => setForm({ ...form, validityDays: Number(event.target.value) })} />
        </label>
        <label>
          AI 次数额度
          <input type="number" min="0" value={form.aiQuota} onChange={(event) => setForm({ ...form, aiQuota: Number(event.target.value) })} />
        </label>
        <label>
          排序
          <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
        </label>
        <label className="switch-field">
          <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
          是否启用
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? '保存中...' : editingPlan ? '保存修改' : '新增套餐'}</button>
          {editingPlan && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}
        </div>
      </form>

      <div className="table-card">
        <h2>套餐列表</h2>
        {loading ? <p className="muted-text">正在加载套餐...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>排序</th>
                <th>套餐名称</th>
                <th>类型</th>
                <th>价格</th>
                <th>有效期</th>
                <th>AI 额度</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.sortOrder}</td>
                  <td>{plan.name}</td>
                  <td>{planTypes.find((type) => type.value === plan.type)?.label ?? plan.type}</td>
                  <td>{formatPrice(plan.price)}</td>
                  <td>{plan.validityDays} 天</td>
                  <td>{plan.aiQuota} 次</td>
                  <td><span className={`status-pill ${plan.enabled ? 'enabled' : 'disabled'}`}>{plan.enabled ? '启用' : '停用'}</span></td>
                  <td className="row-actions">
                    <button type="button" className="secondary-button" onClick={() => editPlan(plan)}>编辑</button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void togglePlan(plan)}
                      disabled={actionPlanId === plan.id}
                    >
                      {plan.enabled ? '停用' : '启用'}
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => void deletePlan(plan)}
                      disabled={plan.inUse || actionPlanId === plan.id}
                      title={plan.inUse ? '正在使用中的套餐只能停用，不能删除' : undefined}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!sortedPlans.length && (
                <tr><td colSpan={8} className="empty-table">暂无会员套餐，请先新增。</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
