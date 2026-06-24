import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { aiPromptApi, type AiPromptPayload, type AiPromptTemplate } from '../api/prompts';

type Notice = { type: 'saved' | 'error'; text: string } | null;

const emptyForm: AiPromptPayload = { name: '', type: 'ai_review', content: '', version: 'v1.0.0', status: 'draft' };

function getCreator(prompt: AiPromptTemplate) {
  return prompt.creator ?? prompt.createdBy ?? '-';
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function splitLines(value: string) {
  return value.split(/\r?\n/);
}

export function AiPromptManagement() {
  const [prompts, setPrompts] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<AiPromptTemplate | null>(null);
  const [compareIds, setCompareIds] = useState<[string, string]>(['', '']);
  const [form, setForm] = useState<AiPromptPayload>(emptyForm);
  const [notice, setNotice] = useState<Notice>(null);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const result = await aiPromptApi.list({ type: 'ai_review' });
      setPrompts(result.items);
      setCompareIds((current) => current[0] ? current : [String(result.items[0]?.id ?? ''), String(result.items[1]?.id ?? result.items[0]?.id ?? '')]);
    } catch {
      setNotice({ type: 'error', text: 'Prompt 列表加载失败，请检查后端接口。' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPrompts(); }, []);

  const selectedPair = useMemo(() => compareIds.map((id) => prompts.find((prompt) => String(prompt.id) === id) ?? null), [compareIds, prompts]);
  const diffRows = useMemo(() => {
    const [left, right] = selectedPair;
    const leftLines = splitLines(left?.content ?? '');
    const rightLines = splitLines(right?.content ?? '');
    const total = Math.max(leftLines.length, rightLines.length);
    return Array.from({ length: total }, (_, index) => ({ index: index + 1, left: leftLines[index] ?? '', right: rightLines[index] ?? '', changed: (leftLines[index] ?? '') !== (rightLines[index] ?? '') }));
  }, [selectedPair]);

  const editPrompt = (prompt: AiPromptTemplate) => {
    setSelected(prompt);
    setForm({ name: prompt.name, type: prompt.type, content: prompt.content, version: prompt.version, status: prompt.status });
    setNotice(null);
  };

  const resetForm = () => {
    setSelected(null);
    setForm(emptyForm);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      if (selected) await aiPromptApi.update(selected.id, form);
      else await aiPromptApi.create(form);
      setNotice({ type: 'saved', text: selected ? 'Prompt 模板已更新。' : 'Prompt 模板已创建。' });
      resetForm();
      await loadPrompts();
    } catch {
      setNotice({ type: 'error', text: '保存失败，请检查必填项或稍后重试。' });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (prompt: AiPromptTemplate, action: 'publish' | 'rollback') => {
    const label = action === 'publish' ? '发布' : '回滚';
    if (!window.confirm(`确认${label} ${prompt.name} ${prompt.version}？`)) return;
    try {
      if (action === 'publish') await aiPromptApi.publish(prompt.id);
      else await aiPromptApi.rollback(prompt.id);
      setNotice({ type: 'saved', text: `${label}成功，AI 评房将记录所使用的 Prompt 版本。` });
      await loadPrompts();
    } catch {
      setNotice({ type: 'error', text: `${label}失败，请稍后重试。` });
    }
  };

  return (
    <div className="ai-prompt-page">
      <div className="page-heading"><p className="eyebrow">AI Prompt 管理</p><h1>AI 评房 Prompt 版本管理</h1><p>维护 AI 评房模板、版本状态、发布节奏与回滚记录，后端评房调用应持久化当前 Prompt 版本。</p></div>
      {notice ? <p className={`status-message ${notice.type}`}>{notice.text}</p> : null}
      <div className="prompt-layout">
        <form className="prompt-editor form-section" onSubmit={handleSubmit}><h2>{selected ? '编辑 Prompt' : '新建 Prompt'}</h2><div className="form-grid"><label className="field-label">模板名称<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="field-label">模板类型<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required /></label><label className="field-label">版本号<input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} required /></label><label className="field-label">状态<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option></select></label></div><label className="field-label">Prompt 内容<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={12} required /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={resetForm}>重置</button><button type="submit" disabled={saving}>{saving ? '保存中...' : '保存 Prompt'}</button></div></form>
        <section className="form-section"><h2>版本历史</h2>{loading ? <p>正在加载...</p> : <div className="prompt-table-wrap"><table className="prompt-table"><thead><tr><th>模板</th><th>版本</th><th>状态</th><th>创建人</th><th>发布时间</th><th>操作</th></tr></thead><tbody>{prompts.map((prompt) => <tr key={prompt.id}><td><strong>{prompt.name}</strong><small>{prompt.type}</small></td><td>{prompt.version}</td><td><span className={`prompt-status ${prompt.status}`}>{prompt.status}</span></td><td>{getCreator(prompt)}</td><td>{formatDate(prompt.publishedAt)}</td><td className="table-actions"><button type="button" className="secondary-button" onClick={() => editPrompt(prompt)}>编辑</button><button type="button" onClick={() => void runAction(prompt, 'publish')}>发布</button><button type="button" className="danger-button" onClick={() => void runAction(prompt, 'rollback')}>回滚</button></td></tr>)}</tbody></table></div>}</section>
      </div>
      <section className="form-section diff-section"><h2>版本差异对比</h2><div className="form-grid">{[0, 1].map((side) => <label className="field-label" key={side}>{side === 0 ? '左侧版本' : '右侧版本'}<select value={compareIds[side]} onChange={(event) => setCompareIds(side === 0 ? [event.target.value, compareIds[1]] : [compareIds[0], event.target.value])}>{prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.name} {prompt.version}</option>)}</select></label>)}</div><div className="diff-grid">{diffRows.map((row) => <div className={`diff-row${row.changed ? ' changed' : ''}`} key={row.index}><span>{row.index}</span><pre>{row.left}</pre><pre>{row.right}</pre></div>)}</div></section>
    </div>
  );
}
