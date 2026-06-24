import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, RiskBlacklist, RiskBlacklistType } from '../api/client';

type FormState = {
  type: RiskBlacklistType;
  value: string;
  reason: string;
  expiresAt: string;
};

type LoadState = {
  loading: boolean;
  error?: string;
  items: RiskBlacklist[];
};

const blacklistTypes: Array<{ value: RiskBlacklistType; label: string; placeholder: string }> = [
  { value: 'USER_ID', label: '用户 ID', placeholder: '请输入用户 ID' },
  { value: 'PHONE', label: '手机号', placeholder: '请输入手机号' },
  { value: 'IP', label: 'IP', placeholder: '请输入 IP 地址' },
  { value: 'DEVICE_ID', label: '设备 ID', placeholder: '请输入设备 ID' },
  { value: 'WECHAT_OPENID', label: '微信 OpenID', placeholder: '请输入微信 OpenID' },
];

const initialForm: FormState = {
  type: 'USER_ID',
  value: '',
  reason: '',
  expiresAt: '',
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '永久';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function getTypeLabel(type: RiskBlacklistType) {
  return blacklistTypes.find((item) => item.value === type)?.label ?? type;
}

export function SecurityBlacklist() {
  const [state, setState] = useState<LoadState>({ loading: true, items: [] });
  const [form, setForm] = useState<FormState>(initialForm);
  const [keyword, setKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const selectedType = useMemo(() => blacklistTypes.find((item) => item.value === form.type) ?? blacklistTypes[0], [form.type]);

  const loadBlacklist = useCallback(async (query = keyword, showLoading = true) => {
    if (showLoading) {
      setState((current) => ({ ...current, loading: true, error: undefined }));
    }

    try {
      const data = await apiClient.getSecurityBlacklist(query ? { keyword: query } : undefined);
      setState({ loading: false, items: data.items });
    } catch (error) {
      setState({ loading: false, items: [], error: error instanceof Error ? error.message : '黑名单读取失败' });
    }
  }, [keyword]);

  useEffect(() => {
    let active = true;

    apiClient.getSecurityBlacklist()
      .then((data) => {
        if (active) {
          setState({ loading: false, items: data.items });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ loading: false, items: [], error: error instanceof Error ? error.message : '黑名单读取失败' });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!form.value.trim()) {
      setMessage('请填写黑名单值。');
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.createSecurityBlacklist({
        type: form.type,
        value: form.value.trim(),
        reason: form.reason.trim() || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setForm(initialForm);
      setMessage('黑名单已新增，后端将在登录、注册、发帖、评论与 AI 评房前进行拦截。');
      await loadBlacklist();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '新增黑名单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: RiskBlacklist) => {
    const confirmed = window.confirm(`确认删除 ${getTypeLabel(item.type)}「${item.value}」的黑名单记录？`);

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.deleteSecurityBlacklist(item.id);
      setMessage('黑名单记录已删除。');
      await loadBlacklist();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除黑名单失败');
    }
  };

  return (
    <div className="blacklist-page">
      <div className="page-heading">
        <p className="eyebrow">安全风控</p>
        <h1>黑名单管理</h1>
        <p>支持按用户 ID、手机号、IP、设备 ID 与微信 OpenID 拉黑，并可设置原因与过期时间。</p>
      </div>

      <section className="form-section">
        <h2>新增黑名单</h2>
        <form className="blacklist-form" onSubmit={handleSubmit}>
          <label className="field-label">
            类型
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as RiskBlacklistType }))}>
              {blacklistTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            黑名单值
            <input value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder={selectedType.placeholder} />
          </label>
          <label className="field-label">
            过期时间
            <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
          </label>
          <label className="field-label blacklist-reason">
            拉黑原因
            <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="请输入拉黑原因，便于后续审计" rows={3} />
          </label>
          <div className="form-actions blacklist-actions">
            <button type="submit" disabled={submitting}>{submitting ? '新增中...' : '新增黑名单'}</button>
          </div>
        </form>
        {message ? <p className="status-message saved">{message}</p> : null}
      </section>

      <section className="form-section blacklist-list-section">
        <div className="section-title-row">
          <h2>黑名单列表</h2>
          <form className="search-form" onSubmit={(event) => { event.preventDefault(); void loadBlacklist(keyword); }}>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索用户、手机号、IP、设备或 OpenID" />
            <button type="submit">搜索</button>
          </form>
        </div>

        {state.loading && <div className="api-panel">正在加载黑名单...</div>}
        {state.error && <div className="api-panel error">{state.error}</div>}
        {!state.loading && !state.error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>类型</th><th>黑名单值</th><th>原因</th><th>过期时间</th><th>创建时间</th><th>操作</th></tr>
              </thead>
              <tbody>
                {state.items.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">暂无黑名单记录</td></tr>
                ) : state.items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="type-badge">{getTypeLabel(item.type)}</span></td>
                    <td>{item.value}</td>
                    <td>{item.reason || '-'}</td>
                    <td>{formatDateTime(item.expiresAt)}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td><button className="danger-button" type="button" onClick={() => void handleDelete(item)}>删除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
