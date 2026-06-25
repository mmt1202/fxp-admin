import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppPlatform, AppVersionConfig, AppVersionPayload, appVersionApi } from '../api/appVersions';

const emptyForm: AppVersionPayload = {
  platform: 'iOS',
  latestVersion: '',
  minSupportedVersion: '',
  forceUpdate: false,
  releaseNotes: '',
  downloadUrl: '',
  rolloutPercentage: 100,
};

const platformLabels: Record<AppPlatform, string> = {
  iOS: 'iOS',
  Android: 'Android',
};

function toForm(version: AppVersionConfig): AppVersionPayload {
  return {
    platform: version.platform,
    latestVersion: version.latestVersion,
    minSupportedVersion: version.minSupportedVersion,
    forceUpdate: version.forceUpdate,
    releaseNotes: version.releaseNotes,
    downloadUrl: version.downloadUrl,
    rolloutPercentage: version.rolloutPercentage,
  };
}

export function AppVersionManagement() {
  const [versions, setVersions] = useState<AppVersionConfig[]>([]);
  const [form, setForm] = useState<AppVersionPayload>(emptyForm);
  const [editing, setEditing] = useState<AppVersionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => a.platform.localeCompare(b.platform) || String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))),
    [versions],
  );

  const loadVersions = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      setVersions(await appVersionApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : '版本配置加载失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadVersions());
  }, [loadVersions]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const updateForm = <K extends keyof AppVersionPayload>(key: K, value: AppVersionPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await appVersionApi.update(editing.id, form);
        setSuccess('版本配置已更新');
      } else {
        await appVersionApi.create(form);
        setSuccess('版本配置已新增');
      }
      resetForm();
      await loadVersions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '版本配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  const editVersion = (version: AppVersionConfig) => {
    setEditing(version);
    setForm(toForm(version));
    setError('');
    setSuccess('');
  };

  const toggleForceUpdate = async (version: AppVersionConfig) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await appVersionApi.update(version.id, { ...toForm(version), forceUpdate: !version.forceUpdate });
      setSuccess(version.forceUpdate ? '已关闭强制更新' : '已开启强制更新');
      await loadVersions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '强制更新状态切换失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-version-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">App Version</p>
          <h1>版本管理</h1>
          <p>维护 iOS / Android 最新版本、最低可用版本、强制更新、更新说明、下载地址与灰度比例。</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadVersions()} disabled={loading}>刷新</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="version-form" onSubmit={handleSubmit}>
        <h2>{editing ? '编辑版本配置' : '新增版本配置'}</h2>
        <label>
          平台
          <select value={form.platform} onChange={(event) => updateForm('platform', event.target.value as AppPlatform)}>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
          </select>
        </label>
        <label>
          最新版本
          <input required value={form.latestVersion} placeholder="例如 2.5.0" onChange={(event) => updateForm('latestVersion', event.target.value)} />
        </label>
        <label>
          最低可用版本
          <input required value={form.minSupportedVersion} placeholder="例如 2.0.0" onChange={(event) => updateForm('minSupportedVersion', event.target.value)} />
        </label>
        <label>
          下载地址
          <input required type="url" value={form.downloadUrl} placeholder="https://..." onChange={(event) => updateForm('downloadUrl', event.target.value)} />
        </label>
        <label>
          灰度比例（%）
          <input type="number" min="0" max="100" value={form.rolloutPercentage} onChange={(event) => updateForm('rolloutPercentage', Number(event.target.value))} />
        </label>
        <label className="switch-field">
          <input type="checkbox" checked={form.forceUpdate} onChange={(event) => updateForm('forceUpdate', event.target.checked)} />
          是否强制更新
        </label>
        <label className="version-notes-field">
          更新说明
          <textarea required rows={4} value={form.releaseNotes} placeholder="请输入展示给 App 用户的更新说明" onChange={(event) => updateForm('releaseNotes', event.target.value)} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? '保存中...' : editing ? '保存修改' : '新增版本'}</button>
          {editing && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}
        </div>
      </form>

      <div className="table-card">
        <h2>版本配置列表</h2>
        {loading ? <p className="muted-text">正在加载版本配置...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>平台</th>
                <th>最新版本</th>
                <th>最低可用版本</th>
                <th>强制更新</th>
                <th>灰度比例</th>
                <th>下载地址</th>
                <th>更新说明</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedVersions.map((version) => (
                <tr key={version.id}>
                  <td><strong>{platformLabels[version.platform]}</strong></td>
                  <td>{version.latestVersion}</td>
                  <td>{version.minSupportedVersion}</td>
                  <td><span className={`status-pill ${version.forceUpdate ? 'enabled' : 'disabled'}`}>{version.forceUpdate ? '是' : '否'}</span></td>
                  <td>{version.rolloutPercentage}%</td>
                  <td><a href={version.downloadUrl} target="_blank" rel="noreferrer">下载链接</a></td>
                  <td><small>{version.releaseNotes}</small></td>
                  <td className="row-actions">
                    <button type="button" className="secondary-button" onClick={() => editVersion(version)}>编辑</button>
                    <button type="button" className="secondary-button" onClick={() => void toggleForceUpdate(version)} disabled={saving}>{version.forceUpdate ? '关闭强更' : '开启强更'}</button>
                  </td>
                </tr>
              ))}
              {!sortedVersions.length && <tr><td colSpan={8} className="empty-table">暂无版本配置，请先新增。</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
