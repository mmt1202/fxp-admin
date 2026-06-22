import { FormEvent, useEffect, useMemo, useState } from 'react';
import { riskApi, RiskHit, RiskLevel, RiskRule, SensitiveWord, SensitiveWordPayload } from '../api/risk';

type WordForm = SensitiveWordPayload;

const defaultForm: WordForm = {
  word: '',
  category: '违规内容',
  riskLevel: 'high',
  enabled: true,
};

const mockWords: SensitiveWord[] = [
  { id: 'mock-1', word: '虚假房源', category: '内容质量', riskLevel: 'high', enabled: true, hitCount: 18, updatedAt: '2026-06-20 14:20' },
  { id: 'mock-2', word: '站外交易', category: '交易安全', riskLevel: 'high', enabled: true, hitCount: 31, updatedAt: '2026-06-19 09:12' },
  { id: 'mock-3', word: '辱骂', category: '社区秩序', riskLevel: 'medium', enabled: false, hitCount: 7, updatedAt: '2026-06-17 18:03' },
];

const mockRules: RiskRule[] = [
  { id: 'rule-1', name: '内容发布敏感词检测', scene: 'content', description: '房源评价、帖子等内容发布前扫描敏感词，命中高风险词自动待审核。', highRisk: true, enabled: true, action: 'pending_review', updatedAt: '2026-06-20 14:20' },
  { id: 'rule-2', name: '评论发布敏感词检测', scene: 'comment', description: '评论提交时检查辱骂、引流、交易安全类词汇。', highRisk: true, enabled: true, action: 'pending_review', updatedAt: '2026-06-20 14:20' },
  { id: 'rule-3', name: '举报处理风险升级', scene: 'report', description: '举报内容命中高风险规则时提升处理优先级并进入待审核队列。', highRisk: true, enabled: false, action: 'flag', updatedAt: '2026-06-18 11:40' },
];

const mockHits: RiskHit[] = [
  { id: 'hit-1', sourceType: 'content', sourceId: 'post-3281', excerpt: '该房源疑似虚假房源，请谨慎辨别。', matchedWord: '虚假房源', ruleName: '内容发布敏感词检测', riskLevel: 'high', status: 'pending_review', hitAt: '2026-06-21 16:35' },
  { id: 'hit-2', sourceType: 'comment', sourceId: 'comment-9102', excerpt: '请勿引导用户进行站外交易。', matchedWord: '站外交易', ruleName: '评论发布敏感词检测', riskLevel: 'high', status: 'pending_review', hitAt: '2026-06-21 10:08' },
  { id: 'hit-3', sourceType: 'report', sourceId: 'report-812', excerpt: '举报内容包含多次辱骂描述。', matchedWord: '辱骂', ruleName: '举报处理风险升级', riskLevel: 'medium', status: 'flagged', hitAt: '2026-06-20 21:46' },
];

const levelText: Record<RiskLevel, string> = { low: '低', medium: '中', high: '高' };
const sceneText: Record<RiskRule['scene'], string> = { content: '内容发布', comment: '评论发布', report: '举报处理' };
const sourceText: Record<RiskHit['sourceType'], string> = { content: '内容', comment: '评论', report: '举报' };
const statusText: Record<RiskHit['status'], string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  flagged: '已标记',
};

const actionText: Record<RiskRule['action'], string> = {
  pending_review: '自动标记待审核',
  reject: '自动拒绝',
  flag: '自动标记风险',
};

export function RiskConfig() {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [hits, setHits] = useState<RiskHit[]>([]);
  const [form, setForm] = useState<WordForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadRiskConfig() {
      setLoading(true);
      try {
        const [wordData, ruleData, hitData] = await Promise.all([
          riskApi.listSensitiveWords(),
          riskApi.listRules(),
          riskApi.listHits(),
        ]);

        if (!ignore) {
          setWords(wordData);
          setRules(ruleData);
          setHits(hitData);
          setUsingFallback(false);
        }
      } catch {
        if (!ignore) {
          setWords(mockWords);
          setRules(mockRules);
          setHits(mockHits);
          setUsingFallback(true);
          setNotice('后端风控接口暂不可用，当前展示演示数据；接口联通后将自动使用真实数据。');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRiskConfig();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredWords = useMemo(() => words.filter((item) => (
    item.word.includes(query) || item.category.includes(query)
  )), [query, words]);

  const highRiskEnabled = rules.filter((item) => item.highRisk && item.enabled).length;
  const pendingReviewCount = hits.filter((item) => item.status === 'pending_review').length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { ...form, word: form.word.trim(), category: form.category.trim() };
    if (!payload.word || !payload.category) {
      setNotice('请填写敏感词和分类。');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        if (!usingFallback) {
          await riskApi.updateSensitiveWord(editingId, payload);
        }
        setWords((current) => current.map((item) => (
          item.id === editingId ? { ...item, ...payload, updatedAt: new Date().toLocaleString() } : item
        )));
        setNotice('敏感词已更新。');
      } else {
        const created = usingFallback
          ? { id: `local-${Date.now()}`, ...payload, hitCount: 0, updatedAt: new Date().toLocaleString() }
          : await riskApi.createSensitiveWord(payload);
        setWords((current) => [created, ...current]);
        setNotice('敏感词已新增。');
      }

      setForm(defaultForm);
      setEditingId(null);
    } catch {
      setNotice('敏感词保存失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (word: SensitiveWord) => {
    setEditingId(word.id);
    setForm({ word: word.word, category: word.category, riskLevel: word.riskLevel, enabled: word.enabled });
  };

  const handleDelete = async (id: string) => {
    try {
      if (!usingFallback) {
        await riskApi.deleteSensitiveWord(id);
      }
      setWords((current) => current.filter((item) => item.id !== id));
      setNotice('敏感词已删除。');
    } catch {
      setNotice('敏感词删除失败，请稍后重试。');
    }
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleToggleRule = async (rule: RiskRule) => {
    const nextEnabled = !rule.enabled;
    setRules((current) => current.map((item) => (
      item.id === rule.id ? { ...item, enabled: nextEnabled } : item
    )));

    try {
      if (!usingFallback) {
        await riskApi.updateRule(rule.id, { enabled: nextEnabled });
      }
      setNotice(`${rule.name}已${nextEnabled ? '启用' : '停用'}。`);
    } catch {
      setRules((current) => current.map((item) => (
        item.id === rule.id ? { ...item, enabled: rule.enabled } : item
      )));
      setNotice('规则开关保存失败，已恢复原状态。');
    }
  };

  return (
    <div className="risk-page">
      <div className="risk-header">
        <div>
          <p className="eyebrow">Risk Control</p>
          <h1>风控配置</h1>
          <p>管理敏感词库、风控规则开关，并追踪最近命中的风险内容。</p>
        </div>
        <div className="risk-stats">
          <strong>{words.length}</strong><span>敏感词</span>
          <strong>{highRiskEnabled}</strong><span>高风险规则启用</span>
          <strong>{pendingReviewCount}</strong><span>待审核命中</span>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}
      {loading ? <div className="notice">正在加载风控配置...</div> : null}

      <section className="risk-section">
        <div className="section-title">
          <h2>敏感词管理</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索敏感词或分类" />
        </div>
        <form className="risk-form" onSubmit={handleSubmit}>
          <input value={form.word} onChange={(event) => setForm({ ...form, word: event.target.value })} placeholder="敏感词" />
          <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="分类" />
          <select value={form.riskLevel} onChange={(event) => setForm({ ...form, riskLevel: event.target.value as RiskLevel })}>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
          <label className="check-label">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
            启用
          </label>
          <button type="submit" disabled={submitting}>{submitting ? '保存中...' : editingId ? '保存修改' : '新增敏感词'}</button>
          {editingId ? <button type="button" className="ghost" onClick={handleCancelEdit}>取消编辑</button> : null}
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>敏感词</th><th>分类</th><th>风险等级</th><th>状态</th><th>命中次数</th><th>操作</th></tr></thead>
            <tbody>{filteredWords.length ? filteredWords.map((word) => (
              <tr key={word.id}>
                <td>{word.word}</td><td>{word.category}</td><td><span className={`badge ${word.riskLevel}`}>{levelText[word.riskLevel]}</span></td>
                <td>{word.enabled ? '启用' : '停用'}</td><td>{word.hitCount}</td>
                <td className="actions"><button type="button" onClick={() => handleEdit(word)}>编辑</button><button type="button" className="ghost danger" onClick={() => handleDelete(word.id)}>删除</button></td>
              </tr>
            )) : <tr><td colSpan={6} className="empty-cell">暂无匹配敏感词</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="risk-section">
        <h2>规则开关</h2>
        <div className="rule-grid">{rules.length ? rules.map((rule) => (
          <article className="rule-card" key={rule.id}>
            <div><span>{sceneText[rule.scene]} · {actionText[rule.action]}</span><h3>{rule.name}</h3><p>{rule.description}</p></div>
            <label className="switch"><input type="checkbox" checked={rule.enabled} onChange={() => handleToggleRule(rule)} /><span /></label>
          </article>
        )) : <div className="empty-state">暂无风控规则</div>}</div>
      </section>

      <section className="risk-section">
        <h2>最近命中的风险内容</h2>
        <div className="hit-list">{hits.length ? hits.map((hit) => (
          <article key={hit.id} className="hit-item">
            <div><strong>{sourceText[hit.sourceType]} #{hit.sourceId}</strong><p>{hit.excerpt}</p><span>规则：{hit.ruleName} · 命中词：{hit.matchedWord ?? '规则条件'}</span></div>
            <div><span className={`badge ${hit.riskLevel}`}>{levelText[hit.riskLevel]}风险</span><small>{statusText[hit.status]} · {hit.hitAt}</small></div>
          </article>
        )) : <div className="empty-state">暂无风险命中记录</div>}</div>
      </section>
    </div>
  );
}
