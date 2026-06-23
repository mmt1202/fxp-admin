import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiClient, RecallAudience, RecallTask, RecallTaskPayload, RecallTaskType } from '../api/client';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const taskTypes: Array<{ value: RecallTaskType; label: string }> = [
  { value: 'push', label: 'Push' },
  { value: 'sms', label: '短信' },
  { value: 'in_app', label: '站内信' },
  { value: 'email', label: '邮件' },
];

const audiences: Array<{ value: RecallAudience; label: string; estimate: number; description: string }> = [
  { value: 'inactive_7_days', label: '7 天未登录', estimate: 1280, description: '最近 7 天没有打开 App 的活跃注册用户。' },
  { value: 'inactive_30_days', label: '30 天未登录', estimate: 642, description: '沉睡周期超过 30 天，优先使用福利或功能更新召回。' },
  { value: 'membership_expiring', label: '会员即将到期', estimate: 214, description: '会员剩余有效期较短，适合续费提醒。' },
  { value: 'ai_quota_used', label: 'AI 次数用完', estimate: 356, description: 'AI 评房额度已用完，可触达补充额度或会员权益。' },
  { value: 'property_created_no_ai', label: '创建房源但未使用 AI', estimate: 498, description: '已创建房源但未体验 AI 评房能力的房东。' },
];

const defaultForm: RecallTaskPayload = {
  name: '',
  type: 'push',
  audience: 'inactive_7_days',
  title: '',
  content: '',
  estimatedCount: 1280,
};

function formatCount(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '-';
}

function getAudienceMeta(value: RecallAudience) {
  return audiences.find((item) => item.value === value) ?? audiences[0];
}

function getTypeLabel(value: RecallTaskType) {
  return taskTypes.find((item) => item.value === value)?.label ?? value;
}

export function RecallTasks() {
  const [tasks, setTasks] = useState<RecallTask[]>([]);
  const [form, setForm] = useState<RecallTaskPayload>(defaultForm);
  const [editingId, setEditingId] = useState<RecallTask['id'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const selectedAudience = useMemo(() => getAudienceMeta(form.audience), [form.audience]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getRecallTasks();
      setTasks(result.items);
      setMessage('');
      setSaveState('idle');
    } catch {
      setMessage('召回任务读取失败，请确认后端已提供 /admin/marketing/recall-tasks 接口。');
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadTasks();
    });
  }, []);

  const updateForm = <K extends keyof RecallTaskPayload>(key: K, value: RecallTaskPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
    setMessage('');
  };

  const handleAudienceChange = (audience: RecallAudience) => {
    const meta = getAudienceMeta(audience);
    setForm((current) => ({ ...current, audience, estimatedCount: meta.estimate }));
  };

  const startEdit = (task: RecallTask) => {
    setEditingId(task.id);
    setForm({
      name: task.name,
      type: task.type,
      audience: task.audience,
      title: task.title,
      content: task.content,
      estimatedCount: task.estimatedCount ?? getAudienceMeta(task.audience).estimate,
    });
    setSaveState('idle');
    setMessage('正在编辑召回任务，保存后会调用 PUT 接口更新。');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSaveState('idle');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    setMessage('');

    try {
      if (editingId) {
        await apiClient.updateRecallTask(editingId, form);
        setMessage('召回任务已更新。');
      } else {
        await apiClient.createRecallTask(form);
        setMessage('召回任务已创建。');
      }
      setSaveState('saved');
      resetForm();
      await loadTasks();
    } catch {
      setSaveState('error');
      setMessage('保存失败，请检查必填项或后端接口状态。');
    }
  };

  const executeTask = async (task: RecallTask) => {
    const confirmed = window.confirm(`确认异步执行「${task.name}」？后端会开始发送召回消息。`);
    if (!confirmed) {
      return;
    }

    setMessage('正在提交异步执行任务...');
    try {
      await apiClient.executeRecallTask(task.id);
      setSaveState('saved');
      setMessage('任务已提交异步执行，请稍后刷新查看发送结果。');
      await loadTasks();
    } catch {
      setSaveState('error');
      setMessage('执行失败，请稍后重试。');
    }
  };

  return (
    <div className="recall-page">
      <div className="page-heading">
        <p className="eyebrow">营销运营</p>
        <h1>用户召回</h1>
        <p>创建 Push、短信、站内信和邮件召回任务，按目标人群预估触达规模，并查看异步发送结果。</p>
      </div>

      <div className="recall-layout">
        <form className="config-form recall-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>{editingId ? '编辑召回任务' : '创建召回任务'}</h2>
            <div className="form-grid">
              <label className="field-label">
                任务名称
                <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="例如：7 天未登录用户福利提醒" required />
              </label>
              <label className="field-label">
                任务类型
                <select value={form.type} onChange={(event) => updateForm('type', event.target.value as RecallTaskType)}>
                  {taskTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <label className="field-label">
              目标人群
              <select value={form.audience} onChange={(event) => handleAudienceChange(event.target.value as RecallAudience)}>
                {audiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <div className="estimate-card">
              <span>预估触达人群</span>
              <strong>{formatCount(selectedAudience.estimate)} 人</strong>
              <small>{selectedAudience.description}</small>
            </div>

            <label className="field-label">
              消息标题
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="请输入用户可见的消息标题" required />
            </label>
            <label className="field-label">
              消息内容
              <textarea value={form.content} onChange={(event) => updateForm('content', event.target.value)} placeholder="请输入召回文案" rows={5} required />
            </label>
          </section>

          {message ? <p className={`status-message ${saveState}`}>{message}</p> : null}

          <div className="form-actions">
            {editingId ? <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button> : null}
            <button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中...' : editingId ? '保存修改' : '创建任务'}</button>
          </div>
        </form>

        <section className="task-results">
          <div className="section-title-row">
            <h2>发送结果</h2>
            <button type="button" className="secondary-button" onClick={() => void loadTasks()} disabled={loading}>刷新</button>
          </div>
          {loading ? <div className="api-panel">正在加载召回任务...</div> : null}
          {!loading && tasks.length === 0 ? <div className="empty-state">暂无召回任务，创建后可在这里查看发送结果。</div> : null}
          {!loading && tasks.length > 0 ? (
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <div>
                    <span className={`status-badge ${task.status}`}>{task.status}</span>
                    <h3>{task.name}</h3>
                    <p>{getTypeLabel(task.type)} · {getAudienceMeta(task.audience).label}</p>
                  </div>
                  <dl className="task-metrics">
                    <div><dt>预估</dt><dd>{formatCount(task.estimatedCount)}</dd></div>
                    <div><dt>已发送</dt><dd>{formatCount(task.sentCount)}</dd></div>
                    <div><dt>成功</dt><dd>{formatCount(task.successCount)}</dd></div>
                    <div><dt>失败</dt><dd>{formatCount(task.failedCount)}</dd></div>
                  </dl>
                  <p className="task-content">{task.title}：{task.content}</p>
                  <div className="task-actions">
                    <button type="button" className="secondary-button" onClick={() => startEdit(task)}>编辑</button>
                    <button type="button" onClick={() => void executeTask(task)} disabled={task.status === 'running' || task.status === 'pending'}>执行发送</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
