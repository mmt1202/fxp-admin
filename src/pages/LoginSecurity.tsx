import { useEffect, useState } from 'react';
import { securityApi, type LoginLog, type RiskyLogin } from '../api/security';
import type { ListResult } from '../api/client';

type LoadState<T> = { loading: boolean; error?: string; data: ListResult<T> };
const emptyList = { items: [], total: 0 };
const riskLabels: Record<string, string> = { short_term_failures: '短时间多次失败', remote_login: '异地登录', multi_account_device: '多账号同设备', frequent_device_switch: '多设备同账号频繁切换' };
function valueText(value: unknown, fallback = '-') { return value === undefined || value === null || value === '' ? fallback : String(value); }
function formatTime(value: unknown) { if (typeof value !== 'string' || !value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false }); }

export function LoginSecurity() {
  const [logs, setLogs] = useState<LoadState<LoginLog>>({ loading: true, data: emptyList });
  const [risks, setRisks] = useState<LoadState<RiskyLogin>>({ loading: true, data: emptyList });
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    securityApi.getLoginLogs({ page: 1, pageSize: 50 }).then((data) => active && setLogs({ loading: false, data })).catch((error: unknown) => active && setLogs({ loading: false, error: error instanceof Error ? error.message : '登录日志加载失败', data: emptyList }));
    securityApi.getRiskyLogins({ page: 1, pageSize: 50 }).then((data) => active && setRisks({ loading: false, data })).catch((error: unknown) => active && setRisks({ loading: false, error: error instanceof Error ? error.message : '风险事件加载失败', data: emptyList }));
    return () => { active = false; };
  }, []);

  const handleSecurityAction = async (action: 'ban' | 'watch', userId?: string | number) => {
    if (!userId) { setActionMessage('缺少用户 ID，无法执行处置。'); return; }
    const actionName = action === 'ban' ? '封禁账号' : '加入观察名单';
    if (!window.confirm(`确认将用户 ${userId} ${actionName}？`)) return;
    try { if (action === 'ban') await securityApi.banAccount(userId); else await securityApi.watchAccount(userId); setActionMessage(`用户 ${userId} 已${actionName}。`); }
    catch (error) { setActionMessage(error instanceof Error ? error.message : `${actionName}失败，请稍后重试。`); }
  };

  return <div className="login-security-page"><div className="page-heading"><p className="eyebrow">登录安全</p><h1>登录安全监控</h1><p>集中查看登录日志与异常登录事件，覆盖短时间多次失败、异地登录、多账号同设备和多设备同账号频繁切换等规则。</p></div><div className="security-rule-grid">{Object.values(riskLabels).map((label) => <div key={label}>{label}</div>)}</div>{actionMessage ? <p className="status-message saved">{actionMessage}</p> : null}<section className="security-section form-section"><div className="section-heading"><h2>风险登录事件</h2><span>{risks.data.total ?? risks.data.items.length} 条</span></div>{risks.loading && <div className="api-panel">正在加载风险事件...</div>}{risks.error && <div className="api-panel error">{risks.error}</div>}{!risks.loading && !risks.error && <div className="table-wrap"><table><thead><tr><th>用户</th><th>风险类型</th><th>等级</th><th>IP / 城市</th><th>设备</th><th>时间</th><th>处置</th></tr></thead><tbody>{risks.data.items.map((item, index) => <tr key={valueText(item.id, String(index))}><td>{valueText(item.username ?? item.userId)}</td><td>{riskLabels[String(item.riskType)] ?? valueText(item.riskType)}</td><td><span className={`risk-level ${valueText(item.riskLevel, 'medium')}`}>{valueText(item.riskLevel, 'medium')}</span></td><td>{valueText(item.ip)} / {valueText(item.city)}</td><td>{valueText(item.device)}</td><td>{formatTime(item.occurredAt)}</td><td className="table-actions"><button type="button" onClick={() => handleSecurityAction('ban', item.userId)}>封禁</button><button type="button" className="secondary-button" onClick={() => handleSecurityAction('watch', item.userId)}>观察</button></td></tr>)}</tbody></table></div>}</section><section className="security-section form-section"><div className="section-heading"><h2>登录日志</h2><span>{logs.data.total ?? logs.data.items.length} 条</span></div>{logs.loading && <div className="api-panel">正在加载登录日志...</div>}{logs.error && <div className="api-panel error">{logs.error}</div>}{!logs.loading && !logs.error && <div className="table-wrap"><table><thead><tr><th>用户 ID</th><th>方式</th><th>IP</th><th>设备</th><th>城市</th><th>结果</th><th>失败原因</th><th>时间</th></tr></thead><tbody>{logs.data.items.map((item, index) => <tr key={valueText(item.id, String(index))}><td>{valueText(item.userId)}</td><td>{valueText(item.loginMethod)}</td><td>{valueText(item.ip)}</td><td>{valueText(item.device)}</td><td>{valueText(item.city)}</td><td><span className={item.success ? 'success-pill' : 'fail-pill'}>{item.success ? '成功' : '失败'}</span></td><td>{valueText(item.failureReason)}</td><td>{formatTime(item.createdAt)}</td></tr>)}</tbody></table></div>}</section></div>;
}
