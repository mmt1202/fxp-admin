import { FormEvent, useEffect, useState } from 'react';
import { AppConfig, configApi, defaultAppConfig, normalizeAppConfig } from '../api/config';
import { useAppConfigStore } from '../store/appConfig';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const switchFields: Array<{ key: keyof Pick<AppConfig, 'aiReviewEnabled' | 'membershipPurchaseEnabled' | 'communityPostEnabled' | 'reportEntryEnabled'>; label: string; description: string }> = [
  { key: 'aiReviewEnabled', label: 'AI 评房开关', description: '关闭后 App 端隐藏或禁用 AI 评房能力。' },
  { key: 'membershipPurchaseEnabled', label: '会员购买开关', description: '控制 App 内会员购买入口与下单能力。' },
  { key: 'communityPostEnabled', label: '社区发布开关', description: '关闭后用户不可发布社区动态。' },
  { key: 'reportEntryEnabled', label: '举报入口开关', description: '控制内容举报入口是否展示。' },
];

export function SystemConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultAppConfig);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const refreshAppConfig = useAppConfigStore((state) => state.loadAppConfig);

  useEffect(() => {
    let active = true;

    configApi.getAdminConfig()
      .then((data) => {
        if (active) {
          setConfig(normalizeAppConfig(data));
        }
      })
      .catch(() => {
        if (active) {
          setMessage('配置读取失败，请稍后重试。');
          setSaveState('error');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage('');
  };

  const updateForceUpdate = <K extends keyof AppConfig['forceUpdate']>(key: K, value: AppConfig['forceUpdate'][K]) => {
    setConfig((current) => ({
      ...current,
      forceUpdate: { ...current.forceUpdate, [key]: value },
    }));
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = window.confirm('确认保存系统配置？配置会立即影响 App 端能力，并写入后台操作日志。');

    if (!confirmed) {
      return;
    }

    setSaveState('saving');
    setMessage('');

    try {
      const savedConfig = await configApi.updateAdminConfig(config);
      setConfig(normalizeAppConfig(savedConfig));
      void refreshAppConfig();
      setSaveState('saved');
      setMessage('系统配置已保存，后端会记录本次配置修改操作日志。');
    } catch {
      setSaveState('error');
      setMessage('保存失败，请检查网络或稍后重试。');
    }
  };

  if (loading) {
    return <div className="module-page"><p className="eyebrow">系统配置</p><h1>正在加载配置...</h1></div>;
  }

  return (
    <div className="system-config-page">
      <div className="page-heading">
        <p className="eyebrow">系统配置</p>
        <h1>系统配置</h1>
        <p>集中管理 App 启动配置、业务能力开关与版本更新策略。</p>
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>基础配置</h2>
          <label className="field-label">
            首页公告
            <textarea
              value={config.homeAnnouncement}
              onChange={(event) => updateField('homeAnnouncement', event.target.value)}
              placeholder="请输入 App 首页公告内容"
              rows={4}
            />
          </label>

          <label className="field-label">
            最低 App 版本
            <input
              value={config.minAppVersion}
              onChange={(event) => updateField('minAppVersion', event.target.value)}
              placeholder="例如 1.4.0"
            />
          </label>
        </section>

        <section className="form-section">
          <h2>业务开关</h2>
          <div className="switch-grid">
            {switchFields.map((field) => (
              <label className="switch-card" key={field.key}>
                <input
                  type="checkbox"
                  checked={Boolean(config[field.key])}
                  onChange={(event) => updateField(field.key, event.target.checked)}
                />
                <span>
                  <strong>{field.label}</strong>
                  <small>{field.description}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>强制更新配置</h2>
          <label className="switch-card inline-switch">
            <input
              type="checkbox"
              checked={config.forceUpdate.enabled}
              onChange={(event) => updateForceUpdate('enabled', event.target.checked)}
            />
            <span>
              <strong>启用强制更新</strong>
              <small>开启后低于指定版本的 App 需要先升级。</small>
            </span>
          </label>

          <div className="form-grid">
            <label className="field-label">
              强制更新版本
              <input
                value={config.forceUpdate.version}
                onChange={(event) => updateForceUpdate('version', event.target.value)}
                placeholder="例如 1.5.0"
              />
            </label>
            <label className="field-label">
              下载地址
              <input
                value={config.forceUpdate.downloadUrl}
                onChange={(event) => updateForceUpdate('downloadUrl', event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="field-label">
            更新提示文案
            <textarea
              value={config.forceUpdate.message}
              onChange={(event) => updateForceUpdate('message', event.target.value)}
              placeholder="请输入强制更新提示"
              rows={3}
            />
          </label>
        </section>

        {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

        <div className="form-actions">
          <button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存配置'}</button>
        </div>
      </form>
    </div>
  );
}
