import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { cmsApi, type ArticleStatus, type OfficialArticle, type OfficialArticleInput } from '../api/cms';

type SaveState = 'idle' | 'saving' | 'error' | 'saved';

const emptyForm: OfficialArticleInput = {
  title: '',
  coverImage: '',
  summary: '',
  content: '',
  category: '',
  tags: [],
  status: 'draft',
  publishedAt: '',
  author: '',
};

const statusLabels: Record<ArticleStatus, string> = {
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
};

export function CmsArticles() {
  const [articles, setArticles] = useState<OfficialArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selectedId, setSelectedId] = useState<OfficialArticle['id'] | undefined>();
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState<OfficialArticleInput>(emptyForm);

  const selectedArticle = useMemo(() => articles.find((article) => String(article.id) === String(selectedId)), [articles, selectedId]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cmsApi.getArticles({ status: filterStatus, keyword });
      setArticles(result.items);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '文章列表加载失败');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, keyword]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadArticles();
    });
  }, [loadArticles]);

  const editArticle = (article: OfficialArticle) => {
    setSelectedId(article.id);
    setForm({
      title: article.title,
      coverImage: article.coverImage ?? '',
      summary: article.summary ?? '',
      content: article.content,
      category: article.category ?? '',
      tags: article.tags,
      status: article.status,
      publishedAt: article.publishedAt ?? '',
      author: article.author ?? '',
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

  const updateField = <K extends keyof OfficialArticleInput>(key: K, value: OfficialArticleInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      const payload = { ...form, publishedAt: form.status === 'published' ? form.publishedAt || new Date().toISOString() : form.publishedAt };
      const saved = selectedId ? await cmsApi.updateArticle(selectedId, payload) : await cmsApi.createArticle(payload);
      setSelectedId(saved.id);
      setForm({ ...payload, tags: saved.tags });
      await loadArticles();
      setSaveState('saved');
      setMessage('文章已保存。');
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '文章保存失败');
    }
  };

  const changeStatus = async (article: OfficialArticle, status: ArticleStatus) => {
    if (status === 'offline' && !window.confirm('确认下线该文章？App 端将不再展示。')) {
      return;
    }
    try {
      await cmsApi.updateArticleStatus(article.id, status);
      await loadArticles();
      if (String(selectedId) === String(article.id)) {
        updateField('status', status);
      }
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '状态更新失败');
    }
  };

  const removeArticle = async (article: OfficialArticle) => {
    if (!window.confirm(`确认删除《${article.title}》？`)) {
      return;
    }
    try {
      await cmsApi.deleteArticle(article.id);
      resetForm();
      await loadArticles();
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <div className="cms-page">
      <div className="page-heading">
        <p className="eyebrow">内容 CMS</p>
        <h1>官方内容发布管理</h1>
        <p>管理官方文章的草稿、发布、下线和 App 端展示内容，正文支持 Markdown 编写与预览。</p>
      </div>

      <div className="cms-toolbar">
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索标题、摘要或作者" />
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as ArticleStatus | 'all')}>
          <option value="all">全部状态</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" onClick={loadArticles}>查询</button>
        <button type="button" className="secondary-button" onClick={resetForm}>新建文章</button>
      </div>

      {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

      <div className="cms-grid">
        <section className="article-list-panel">
          <h2>文章列表</h2>
          {loading ? <p>正在加载文章...</p> : null}
          {!loading && articles.length === 0 ? <p className="muted-text">暂无文章。</p> : null}
          {articles.map((article) => (
            <article className={`article-row${String(selectedId) === String(article.id) ? ' active' : ''}`} key={article.id}>
              <button type="button" className="article-main" onClick={() => editArticle(article)}>
                <strong>{article.title || '未命名文章'}</strong>
                <span>{article.category || '未分类'} · {article.author || '未填写作者'} · {statusLabels[article.status]}</span>
                <small>{article.summary || '暂无摘要'}</small>
              </button>
              <div className="article-actions">
                <button type="button" onClick={() => changeStatus(article, 'published')}>发布</button>
                <button type="button" className="secondary-button" onClick={() => changeStatus(article, 'draft')}>转草稿</button>
                <button type="button" className="secondary-button" onClick={() => changeStatus(article, 'offline')}>下线</button>
                <button type="button" className="danger-button" onClick={() => removeArticle(article)}>删除</button>
              </div>
            </article>
          ))}
        </section>

        <section className="editor-panel">
          <h2>{selectedArticle ? '编辑文章' : '新建文章'}</h2>
          <form className="config-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field-label">标题<input required value={form.title} onChange={(event) => updateField('title', event.target.value)} /></label>
              <label className="field-label">作者<input value={form.author} onChange={(event) => updateField('author', event.target.value)} /></label>
              <label className="field-label">分类<input value={form.category} onChange={(event) => updateField('category', event.target.value)} /></label>
              <label className="field-label">发布时间<input type="datetime-local" value={toDateTimeLocal(form.publishedAt)} onChange={(event) => updateField('publishedAt', event.target.value ? new Date(event.target.value).toISOString() : '')} /></label>
            </div>
            <label className="field-label">封面图 URL<input value={form.coverImage} onChange={(event) => updateField('coverImage', event.target.value)} placeholder="https://..." /></label>
            <label className="field-label">标签（逗号分隔）<input value={form.tags.join(', ')} onChange={(event) => updateField('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} /></label>
            <label className="field-label">摘要<textarea rows={3} value={form.summary} onChange={(event) => updateField('summary', event.target.value)} /></label>
            <label className="field-label">正文 Markdown<textarea className="markdown-editor" rows={14} required value={form.content} onChange={(event) => updateField('content', event.target.value)} /></label>
            <label className="field-label">状态<select value={form.status} onChange={(event) => updateField('status', event.target.value as ArticleStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="form-actions"><button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : '保存文章'}</button></div>
          </form>
        </section>

        <section className="preview-panel">
          <h2>预览</h2>
          {form.coverImage ? <img src={form.coverImage} alt="文章封面预览" /> : <div className="cover-placeholder">封面图预览</div>}
          <p className="eyebrow">{form.category || '未分类'} · {statusLabels[form.status]}</p>
          <h3>{form.title || '文章标题'}</h3>
          <p>{form.summary || '这里展示文章摘要。'}</p>
          <div className="tag-list">{form.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <pre className="markdown-preview">{form.content || 'Markdown 正文预览区域'}</pre>
        </section>
      </div>
    </div>
  );
}

function toDateTimeLocal(value?: string) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}
