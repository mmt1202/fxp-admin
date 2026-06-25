import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { type FeatureFlag, type FeatureFlagPayload, configApi, defaultFeatureFlagPayload, normalizeFeatureFlag } from '../api/config';
import { useAppConfigStore } from '../store/appConfig';
import './FeatureFlags.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type FeatureFlagForm = Omit<FeatureFlagPayload, 'targetUsers' | 'targetCities'> & {
  targetUsersText: string;
  targetCitiesText: string;
};

const emptyForm: FeatureFlagForm = {
  key: defaultFeatureFlagPayload.key,
  name: defaultFeatureFlagPayload.name,
  enabled: defaultFeatureFlagPayload.enabled,
  rolloutPercent: defaultFeatureFlagPayload.rolloutPercent,
  targetUsersText: '',
  targetCitiesText: '',
};

const splitTargets = (value: string) => value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean);
const joinTargets = (value?: string[]) => (value ?? []).join(', ');

function toForm(flag?: FeatureFlag): FeatureFlagForm {
  return flag ? {
    key: flag.key,
    name: flag.name,
    enabled: flag.enabled,
    rolloutPercent: flag.rolloutPercent,
    targetUsersText: joinTargets(flag.targetUsers),
    targetCitiesText: joinTargets(flag.targetCities),
  } : emptyForm;
}

function toPayload(form: FeatureFlagForm): FeatureFlagPayload {
  return {
    key: form.key.trim(),
    name: form.name.trim(),
    enabled: form.enabled,
    rolloutPercent: Math.min(100, Math.max(0, Number(form.rolloutPercent) || 0)),
    targetUsers: splitTargets(form.targetUsersText),
    targetCities: splitTargets(form.targetCitiesText),
  };
}

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [selectedId, setSelectedId] = useState<FeatureFlag['id'] | null>(null);
  const [form, setForm] = useState<FeatureFlagForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const refreshAppConfig = useAppConfigStore((state) => state.loadAppConfig);

  const selectedFlag = useMemo(() => flags.find((flag) => String(flag.id) === String(selectedId)), [flags, selectedId]);
  const enabledCount = useMemo(() => flags.filter((flag) => flag.enabled).length, [flags]);
  const targetedCount = useMemo(() => flags.filter((flag) => flag.targetUsers.length || flag.targetCities.length).length, [flags]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await configApi.getFeatureFlags();
      setFlags(data.map(normalizeFeatureFlag));
      setMessage('');
      setSaveState('idle');
    } catch {
      setMessage('功能开关读取失败，请稍后重试。');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadFlags());
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setSaveState('idle');
    setMessage('');
  };

  const updateField = <K extends keyof FeatureFlagForm>(key: K, value: FeatureFlagForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage('');
  };

  const selectFlag = (flag: FeatureFlag) => {
    setSelectedId(flag.id);
    setForm(toForm(flag));
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      const payload = toPayload(form);
      if (selectedFlag) {
        await configApi.updateFeatureFlag(selectedFlag.id, payload);
      } else {
        await configApi.createFeatureFlag(payload);
      }
      await loadFlags();
      void refreshAppConfig();
      resetForm();
      setSaveState('saved');
      setMessage(selectedFlag ? '功能开关已更新，App 下次拉取启动配置时生效。' : '功能开关已创建。');
    } catch {
      setSaveState('error');
      setMessage('保存失败，请检查 key 是否重复或稍后重试。');
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    setSaveState('saving');
    setMessage('');
    try {
      const next = { ...flag, enabled: !flag.enabled };
      const saved = normalizeFeatureFlag(await configApi.updateFeatureFlag(flag.id, next));
      setFlags((current) => current.map((item) => String(item.id) === String(flag.id) ? saved : item));
      void refreshAppConfig();
      setSaveState('saved');
      setMessage(`${flag.name} 已${saved.enabled ? '启用' : '停用'}。`);
    } catch {
      setSaveState('error');
      setMessage('状态更新失败，请稍后重试。');
    }
  };

  return (
    <div className="feature-flags-page">
      <div className="page-heading">
        <p className="eyebrow">Feature Flags</p>
        <h1>功能开关配置中心</h1>
        <p>集中管理 App 功能启停、灰度比例以及面向指定城市或用户的开放策略。</p>
      </div>

      <div className="feature-flag-summary">
        <div><strong>{flags.length}</strong><span>开关总数</span></div>
        <div><strong>{enabledCount}</strong><span>已启用</span></div>
        <div><strong>{targetedCount}</strong><span>定向开放</span></div>
      </div>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <div className="feature-flag-layout">
        <section className="form-section">
          <div className="section-title-row"><h2>开关列表</h2><button type="button" onClick={resetForm}>新增开关</button></div>
          {loading ? <p className="feature-flag-muted">正在加载功能开关...</p> : null}
          {!loading && flags.length === 0 ? <p className="feature-flag-muted">暂无功能开关，请新增。</p> : null}
          <div className="feature-flag-list">
            {flags.map((flag) => (
              <article className={`feature-flag-row${String(flag.id) === String(selectedId) ? ' selected' : ''}`} key={flag.id}>
                <button type="button" className="feature-flag-main" onClick={() => selectFlag(flag)}>
                  <strong>{flag.name}</strong>
                  <small>{flag.key} · 灰度 <span className="rollout-value">{flag.rolloutPercent}%</span></small>
                  <span className="feature-flag-targets">
                    {flag.targetCities.length ? <span>城市：{flag.targetCities.join('、')}</span> : null}
                    {flag.targetUsers.length ? <span>用户：{flag.targetUsers.join('、')}</span> : null}
                  </span>
                </button>
                <span className={`feature-flag-status ${flag.enabled ? 'enabled' : 'disabled'}`}>{flag.enabled ? '已启用' : '已停用'}</span>
                <button type="button" className="secondary-button" disabled={saveState === 'saving'} onClick={() => toggleFlag(flag)}>{flag.enabled ? '停用' : '启用'}</button>
              </article>
            ))}
          </div>
        </section>

        <form className="config-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>{selectedFlag ? '编辑开关' : '新增开关'}</h2>
            <label className="switch-card inline-switch"><input type="checkbox" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} /><span><strong>启用功能</strong><small>关闭后命中的 App 用户不可使用该能力。</small></span></label>
            <div className="form-grid">
              <label className="field-label">开关 Key<input required value={form.key} onChange={(event) => updateField('key', event.target.value)} placeholder="例如 ai.review.v2" /></label>
              <label className="field-label">开关名称<input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="例如 AI 评房 V2" /></label>
              <label className="field-label">灰度比例 <span className="rollout-value">{form.rolloutPercent}%</span><input type="range" min="0" max="100" value={form.rolloutPercent} onChange={(event) => updateField('rolloutPercent', Number(event.target.value))} /></label>
              <label className="field-label">灰度比例数值<input type="number" min="0" max="100" value={form.rolloutPercent} onChange={(event) => updateField('rolloutPercent', Number(event.target.value))} /></label>
            </div>
            <label className="field-label">指定开放用户<textarea rows={4} value={form.targetUsersText} onChange={(event) => updateField('targetUsersText', event.target.value)} placeholder="多个用户 ID 用逗号或换行分隔；留空表示不限制用户。" /></label>
            <label className="field-label">指定开放城市<textarea rows={4} value={form.targetCitiesText} onChange={(event) => updateField('targetCitiesText', event.target.value)} placeholder="多个城市编码或名称用逗号或换行分隔；留空表示不限制城市。" /></label>
          </section>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={resetForm}>清空</button><button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存开关'}</button></div>
        </form>
      </div>
    </div>
  );
}
