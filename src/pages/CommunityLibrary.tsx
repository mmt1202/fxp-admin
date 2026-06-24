import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, CommunityBase, CommunityBasePayload } from '../api/client';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const emptyForm: CommunityBasePayload = {
  name: '',
  city: '',
  district: '',
  street: '',
  longitude: undefined,
  latitude: undefined,
  builtYear: undefined,
  propertyCompany: '',
  developer: '',
  tags: [],
  riskTips: '',
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function toForm(community?: CommunityBase): CommunityBasePayload {
  if (!community) {
    return emptyForm;
  }

  return {
    name: normalizeText(community.name),
    city: normalizeText(community.city),
    district: normalizeText(community.district),
    street: normalizeText(community.street),
    longitude: normalizeNumber(community.longitude),
    latitude: normalizeNumber(community.latitude),
    builtYear: normalizeNumber(community.builtYear),
    propertyCompany: normalizeText(community.propertyCompany),
    developer: normalizeText(community.developer),
    tags: normalizeTags(community.tags),
    riskTips: normalizeText(community.riskTips),
  };
}

function communityId(community: CommunityBase) {
  return String(community.id ?? community._id ?? '');
}

export function CommunityLibrary() {
  const [communities, setCommunities] = useState<CommunityBase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [editing, setEditing] = useState<CommunityBase | undefined>();
  const [form, setForm] = useState<CommunityBasePayload>(emptyForm);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  const queryParams = useMemo(() => ({
    keyword: keyword || undefined,
    city: city || undefined,
    district: district || undefined,
  }), [city, district, keyword]);

  const loadCommunities = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const result = await apiClient.getCommunities(queryParams);
      setCommunities(result.items);
      setTotal(result.total ?? result.items.length);
      setMessage('');
      setSaveState('idle');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '小区库读取失败');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void Promise.resolve().then(loadCommunities);
  }, [loadCommunities]);

  const updateForm = <K extends keyof CommunityBasePayload>(key: K, value: CommunityBasePayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage('');
  };

  const startEdit = (community?: CommunityBase) => {
    setEditing(community);
    setForm(toForm(community));
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      const id = editing ? communityId(editing) : '';
      if (id) {
        await apiClient.updateCommunity(id, form);
        setMessage('小区基础数据已更新。');
      } else {
        await apiClient.createCommunity(form);
        setMessage('小区基础数据已创建。');
      }
      setSaveState('saved');
      startEdit(undefined);
      await loadCommunities();
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '保存小区失败');
    }
  };

  const handleDelete = async (community: CommunityBase) => {
    const id = communityId(community);
    if (!id || !window.confirm(`确认删除「${community.name ?? '该小区'}」？`)) {
      return;
    }

    try {
      await apiClient.deleteCommunity(id);
      setMessage('小区已删除。');
      setSaveState('saved');
      await loadCommunities();
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '删除小区失败');
    }
  };

  const handleMerge = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      setSaveState('error');
      setMessage('请选择不同的源小区和目标小区。');
      return;
    }

    if (!window.confirm('确认合并小区？源小区下房源、评价统计将迁移到目标小区。')) {
      return;
    }

    try {
      await apiClient.mergeCommunities(mergeSourceId, mergeTargetId);
      setMergeSourceId('');
      setMergeTargetId('');
      setSaveState('saved');
      setMessage('小区合并已提交。');
      await loadCommunities();
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '小区合并失败');
    }
  };

  return (
    <div className="community-page">
      <div className="page-heading">
        <p className="eyebrow">小区基础数据</p>
        <h1>小区库管理</h1>
        <p>维护小区名称、行政区划、经纬度、建成年份、物业/开发商、标签与风险提示，供房源创建时关联使用。</p>
      </div>

      <section className="toolbar-card">
        <div className="form-grid">
          <label className="field-label">搜索小区<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="小区名称 / 物业 / 开发商" /></label>
          <label className="field-label">城市<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="例如 上海" /></label>
          <label className="field-label">区县<input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="例如 浦东新区" /></label>
        </div>
      </section>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <section className="community-layout">
        <div className="community-list-card">
          <div className="section-title"><h2>小区列表</h2><span>共 {total} 条</span></div>
          {loading ? <div className="api-panel">正在加载小区库...</div> : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>小区</th><th>区域</th><th>标签</th><th>房源/评价</th><th>风险</th><th>操作</th></tr></thead>
                <tbody>
                  {communities.map((community) => (
                    <tr key={communityId(community)}>
                      <td><strong>{community.name}</strong><small>{community.builtYear ? `${community.builtYear} 年建成` : '建成年份未维护'}</small></td>
                      <td>{[community.city, community.district, community.street].filter(Boolean).join(' / ') || '-'}</td>
                      <td>{normalizeTags(community.tags).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</td>
                      <td>{Number(community.propertyCount ?? 0)} / {Number(community.reviewCount ?? 0)}</td>
                      <td>{community.riskTips ? <span className="risk-text">{community.riskTips}</span> : '-'}</td>
                      <td><button type="button" onClick={() => startEdit(community)}>编辑</button><button type="button" className="secondary-button" onClick={() => handleDelete(community)}>删除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="form-section" onSubmit={handleSubmit}>
          <div className="section-title"><h2>{editing ? '编辑小区' : '新增小区'}</h2><button type="button" className="secondary-button" onClick={() => startEdit(undefined)}>新建</button></div>
          <label className="field-label">小区名称<input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
          <div className="form-grid"><label className="field-label">城市<input value={form.city} onChange={(event) => updateForm('city', event.target.value)} /></label><label className="field-label">区县<input value={form.district} onChange={(event) => updateForm('district', event.target.value)} /></label></div>
          <label className="field-label">街道<input value={form.street} onChange={(event) => updateForm('street', event.target.value)} /></label>
          <div className="form-grid"><label className="field-label">经度<input type="number" step="0.000001" value={form.longitude ?? ''} onChange={(event) => updateForm('longitude', event.target.value ? Number(event.target.value) : undefined)} /></label><label className="field-label">纬度<input type="number" step="0.000001" value={form.latitude ?? ''} onChange={(event) => updateForm('latitude', event.target.value ? Number(event.target.value) : undefined)} /></label></div>
          <div className="form-grid"><label className="field-label">建成年份<input type="number" value={form.builtYear ?? ''} onChange={(event) => updateForm('builtYear', event.target.value ? Number(event.target.value) : undefined)} /></label><label className="field-label">物业公司<input value={form.propertyCompany} onChange={(event) => updateForm('propertyCompany', event.target.value)} /></label></div>
          <label className="field-label">开发商<input value={form.developer} onChange={(event) => updateForm('developer', event.target.value)} /></label>
          <label className="field-label">小区标签<input value={form.tags?.join(', ') ?? ''} onChange={(event) => updateForm('tags', normalizeTags(event.target.value))} placeholder="地铁房, 学区, 次新房" /></label>
          <label className="field-label">风险提示<textarea rows={3} value={form.riskTips} onChange={(event) => updateForm('riskTips', event.target.value)} placeholder="例如 临近高架、历史投诉较多" /></label>
          <div className="form-actions"><button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存小区'}</button></div>
        </form>
      </section>

      <section className="form-section merge-card">
        <h2>小区合并</h2>
        <p>将重复小区合并到目标小区，便于统一房源数量和评价数量统计。</p>
        <div className="form-grid">
          <label className="field-label">源小区<select value={mergeSourceId} onChange={(event) => setMergeSourceId(event.target.value)}><option value="">请选择</option>{communities.map((item) => <option key={communityId(item)} value={communityId(item)}>{item.name}</option>)}</select></label>
          <label className="field-label">目标小区<select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}><option value="">请选择</option>{communities.map((item) => <option key={communityId(item)} value={communityId(item)}>{item.name}</option>)}</select></label>
        </div>
        <div className="form-actions"><button type="button" onClick={handleMerge}>确认合并</button></div>
      </section>
    </div>
  );
}
