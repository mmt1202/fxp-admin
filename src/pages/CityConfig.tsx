import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  type CityConfig as CityConfigType,
  type CityConfigPayload,
  defaultCityConfigPayload,
  geoApi,
} from '../api/geo';
import './CityConfig.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function toFormPayload(city?: CityConfigType): CityConfigPayload {
  return city
    ? {
      name: city.name,
      code: city.code,
      serviceEnabled: city.serviceEnabled,
      sort: city.sort,
      defaultLatitude: city.defaultLatitude,
      defaultLongitude: city.defaultLongitude,
      operator: city.operator,
      hot: city.hot,
      operationNote: city.operationNote,
    }
    : defaultCityConfigPayload;
}

export function CityConfig() {
  const [cities, setCities] = useState<CityConfigType[]>([]);
  const [selectedId, setSelectedId] = useState<CityConfigType['id'] | null>(null);
  const [form, setForm] = useState<CityConfigPayload>(defaultCityConfigPayload);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');

  const selectedCity = useMemo(
    () => cities.find((city) => String(city.id) === String(selectedId)),
    [cities, selectedId],
  );
  const openedCities = useMemo(() => cities.filter((city) => city.serviceEnabled), [cities]);
  const hotCities = useMemo(() => cities.filter((city) => city.hot), [cities]);

  const loadCities = async () => {
    setLoading(true);
    try {
      const data = await geoApi.getCities();
      setCities([...data].sort((a, b) => a.sort - b.sort));
      setMessage('');
      setSaveState('idle');
    } catch {
      setMessage('城市配置读取失败，请稍后重试。');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => { void loadCities(); });
  }, []);

  const updateField = <K extends keyof CityConfigPayload>(key: K, value: CityConfigPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage('');
  };

  const selectCity = (city: CityConfigType) => {
    setSelectedId(city.id);
    setForm(toFormPayload(city));
    setSaveState('idle');
    setMessage('');
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(defaultCityConfigPayload);
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      if (selectedCity) {
        await geoApi.updateCity(selectedCity.id, form);
      } else {
        await geoApi.createCity(form);
      }

      await loadCities();
      resetForm();
      setSaveState('saved');
      setMessage(selectedCity ? '城市配置已更新。' : '城市配置已新增。');
    } catch {
      setSaveState('error');
      setMessage('保存失败，请检查城市编码是否重复或稍后重试。');
    }
  };

  const toggleStatus = async (city: CityConfigType) => {
    const nextStatus = !city.serviceEnabled;
    setSaveState('saving');
    setMessage('');

    try {
      await geoApi.updateCityStatus(city.id, { serviceEnabled: nextStatus });
      setCities((current) => current.map((item) => item.id === city.id ? { ...item, serviceEnabled: nextStatus } : item));
      setSaveState('saved');
      setMessage(`${city.name} 已${nextStatus ? '启用' : '停用'}，App 端仅展示已开通城市。`);
    } catch {
      setSaveState('error');
      setMessage('城市状态更新失败，请稍后重试。');
    }
  };

  return (
    <div className="city-config-page">
      <div className="page-heading">
        <p className="eyebrow">城市配置</p>
        <h1>城市和区域配置管理</h1>
        <p>维护城市服务开通、热门城市、默认经纬度与运营说明，App 端仅展示已开通城市。</p>
      </div>

      <div className="city-summary-grid">
        <div><strong>{cities.length}</strong><span>配置城市</span></div>
        <div><strong>{openedCities.length}</strong><span>已开通城市</span></div>
        <div><strong>{hotCities.length}</strong><span>热门城市</span></div>
      </div>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <div className="city-config-layout">
        <section className="city-list-card">
          <div className="section-title-row">
            <h2>城市列表</h2>
            <button type="button" onClick={resetForm}>新增城市</button>
          </div>
          {loading ? <p className="city-muted-text">正在加载城市...</p> : null}
          {!loading && cities.length === 0 ? <p className="city-muted-text">暂无城市配置，请新增。</p> : null}
          <div className="city-table">
            {cities.map((city) => (
              <article className={`city-row${String(city.id) === String(selectedId) ? ' selected' : ''}`} key={city.id}>
                <button type="button" className="city-row-main" onClick={() => selectCity(city)}>
                  <span><strong>{city.name}</strong><small>{city.code} · 排序 {city.sort}</small></span>
                  {city.hot ? <em>热门</em> : null}
                </button>
                <span className={`city-status ${city.serviceEnabled ? 'enabled' : 'disabled'}`}>{city.serviceEnabled ? '已开通' : '未开通'}</span>
                <button type="button" className="secondary-button" disabled={saveState === 'saving'} onClick={() => toggleStatus(city)}>
                  {city.serviceEnabled ? '停用' : '启用'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <form className="config-form city-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>{selectedCity ? '编辑城市' : '新增城市'}</h2>
            <div className="form-grid">
              <label className="field-label">城市名称<input value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></label>
              <label className="field-label">城市编码<input value={form.code} onChange={(event) => updateField('code', event.target.value.trim().toUpperCase())} required /></label>
              <label className="field-label">排序<input type="number" value={form.sort} onChange={(event) => updateField('sort', Number(event.target.value))} /></label>
              <label className="field-label">运营负责人<input value={form.operator} onChange={(event) => updateField('operator', event.target.value)} /></label>
              <label className="field-label">默认纬度<input type="number" step="0.000001" value={form.defaultLatitude} onChange={(event) => updateField('defaultLatitude', Number(event.target.value))} /></label>
              <label className="field-label">默认经度<input type="number" step="0.000001" value={form.defaultLongitude} onChange={(event) => updateField('defaultLongitude', Number(event.target.value))} /></label>
            </div>
            <div className="switch-grid">
              <label className="switch-card"><input type="checkbox" checked={form.serviceEnabled} onChange={(event) => updateField('serviceEnabled', event.target.checked)} /><span><strong>开通服务</strong><small>关闭后 App 端城市选择列表不展示该城市。</small></span></label>
              <label className="switch-card"><input type="checkbox" checked={form.hot} onChange={(event) => updateField('hot', event.target.checked)} /><span><strong>热门城市</strong><small>开启后在 App 城市选择页优先推荐。</small></span></label>
            </div>
            <label className="field-label">城市运营说明<textarea rows={4} value={form.operationNote} onChange={(event) => updateField('operationNote', event.target.value)} placeholder="例如：重点覆盖内环房源，工作日 10:00-19:00 响应运营需求。" /></label>
          </section>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>清空</button>
            <button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存城市'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
