import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminAnnouncementsApi,
  announcementStatusLabels,
  type AdminAnnouncement,
  type AdminAnnouncementInput,
  type AdminAnnouncementStatus,
} from '../api/announcements';

const emptyForm: AdminAnnouncementInput = {
  title: '',
  content: '',
  status: 'draft',
  pinned: false,
  visibleRoles: [],
  author: '',
  publishedAt: '',
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selectedId, setSelectedId] = useState<AdminAnnouncement['id'] | undefined>();
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdminAnnouncementStatus | 'all'>('all');
  const [form, setForm] = useState<AdminAnnouncementInput>(emptyForm);

  const selected = useMemo(() => announcements.find((item) => String(item.id) === String(selectedId)), [announcements, selectedId]);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminAnnouncementsApi.list({ keyword, status: filterStatus });
      setAnnouncements(result.items.sort((a, b) => Number(b.pinned) - Number(a.pinned)));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '公告列表加载失败');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, keyword]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAnnouncements();
    });
  }, [loadAnnouncements]);

  const updateField = <K extends keyof AdminAnnouncementInput>(key: K, value: AdminAnnouncementInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
  };

  const editAnnouncement = (announcement: AdminAnnouncement) => {
    setSelectedId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      status: announcement.status,
      pinned: announcement.pinned,
      visibleRoles: announcement.visibleRoles,
      author: announcement.author ?? '',
      publishedAt: announcement.publishedAt ?? '',
    });
    setSaveState('idle');
    setMessage('');
  };

  const resetForm = () => {
    setSelectedId(undefined);
    setForm(emptyForm);
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      const payload = {
        ...form,
        publishedAt: form.status === 'published' ? form.publishedAt || new Date().toISOString() : form.publishedAt,
      };
      const saved = selectedId ? await adminAnnouncementsApi.update(selectedId, payload) : await adminAnnouncementsApi.create(payload);
      setSelectedId(saved.id);
      setForm({ ...payload, visibleRoles: saved.visibleRoles });
      await loadAnnouncements();
      setSaveState('saved');
      setMessage('公告已保存。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '公告保存失败');
    }
  };


  const changeStatus = async (announcement: AdminAnnouncement, status: AdminAnnouncementStatus) => {
    if (status === 'offline' && !window.confirm('确认下线该公告？首页将不再展示。')) return;
    try {
      const payload: AdminAnnouncementInput = {
        title: announcement.title,
        content: announcement.content,
        status,
        pinned: announcement.pinned,
        visibleRoles: announcement.visibleRoles,
        author: announcement.author ?? '',
        publishedAt: status === 'published' ? announcement.publishedAt || new Date().toISOString() : announcement.publishedAt ?? '',
      };
      const saved = await adminAnnouncementsApi.update(announcement.id, payload);
      await loadAnnouncements();
      if (String(selectedId) === String(announcement.id)) {
        setForm({ ...payload, visibleRoles: saved.visibleRoles });
      }
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '状态更新失败');
    }
  };

  const removeAnnouncement = async (announcement: AdminAnnouncement) => {
    if (!window.confirm(`确认删除公告《${announcement.title}》？`)) return;
    try {
      await adminAnnouncementsApi.delete(announcement.id);
      resetForm();
      await loadAnnouncements();
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <div className="cms-page admin-announcements-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">后台公告</p>
          <h1>管理员内部公告</h1>
          <p>维护仅后台可见的内部通知，支持草稿、发布、下线、角色可见、Markdown 正文与置顶展示。</p>
        </div>
      </div>

      <div className="cms-toolbar">
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索标题、正文或作者" />
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as AdminAnnouncementStatus | 'all')}>
          <option value="all">全部状态</option>
          {Object.entries(announcementStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" onClick={loadAnnouncements}>查询</button>
        <button type="button" className="secondary-button" onClick={resetForm}>新建公告</button>
      </div>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <div className="cms-grid">
        <section className="article-list-panel">
          <h2>公告列表</h2>
          {loading ? <p>正在加载公告...</p> : null}
          {!loading && announcements.length === 0 ? <p className="muted-text">暂无公告。</p> : null}
          {announcements.map((announcement) => (
            <article className={`article-row${String(selectedId) === String(announcement.id) ? ' active' : ''}`} key={announcement.id}>
              <button type="button" className="article-main" onClick={() => editAnnouncement(announcement)}>
                <strong>{announcement.pinned ? '📌 ' : ''}{announcement.title || '未命名公告'}</strong>
                <span>{announcementStatusLabels[announcement.status]} · {announcement.author || '未填写发布人'} · {announcement.visibleRoles.join('、') || '全部角色'}</span>
                <small>{announcement.content.slice(0, 96) || '暂无正文'}</small>
              </button>
              <div className="article-actions">
                <button type="button" onClick={() => changeStatus(announcement, 'published')}>发布</button>
                <button type="button" className="secondary-button" onClick={() => changeStatus(announcement, 'draft')}>转草稿</button>
                <button type="button" className="secondary-button" onClick={() => changeStatus(announcement, 'offline')}>下线</button>
                <button type="button" className="danger-button" onClick={() => removeAnnouncement(announcement)}>删除</button>
              </div>
            </article>
          ))}
        </section>

        <section className="editor-panel">
          <h2>{selected ? '编辑公告' : '新建公告'}</h2>
          <form className="config-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field-label">标题<input required value={form.title} onChange={(event) => updateField('title', event.target.value)} /></label>
              <label className="field-label">发布人<input value={form.author} onChange={(event) => updateField('author', event.target.value)} /></label>
              <label className="field-label">发布时间<input type="datetime-local" value={toDateTimeLocal(form.publishedAt)} onChange={(event) => updateField('publishedAt', event.target.value ? new Date(event.target.value).toISOString() : '')} /></label>
              <label className="field-label">状态<select value={form.status} onChange={(event) => updateField('status', event.target.value as AdminAnnouncementStatus)}>{Object.entries(announcementStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label className="field-label">可见角色（逗号分隔，留空表示全部角色）<input value={form.visibleRoles.join(', ')} onChange={(event) => updateField('visibleRoles', event.target.value.split(',').map((role) => role.trim()).filter(Boolean))} placeholder="super_admin, ops_admin" /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.pinned} onChange={(event) => updateField('pinned', event.target.checked)} /> 置顶公告</label>
            <label className="field-label">正文 Markdown<textarea className="markdown-editor" rows={14} required value={form.content} onChange={(event) => updateField('content', event.target.value)} /></label>
            <div className="form-actions"><button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存公告'}</button></div>
          </form>
        </section>

        <section className="preview-panel">
          <h2>首页预览</h2>
          <p className="eyebrow">{form.pinned ? '置顶公告' : '普通公告'} · {announcementStatusLabels[form.status]}</p>
          <h3>{form.title || '公告标题'}</h3>
          <div className="tag-list">{(form.visibleRoles.length ? form.visibleRoles : ['全部角色']).map((role) => <span key={role}>{role}</span>)}</div>
          <pre className="markdown-preview">{form.content || 'Markdown 正文预览区域'}</pre>
        </section>
      </div>
    </div>
  );
}

function toDateTimeLocal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}
