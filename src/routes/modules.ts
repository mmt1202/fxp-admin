export type AdminModuleKey = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'community-reports' | 'blacklist' | 'config';

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  module: AdminModuleKey;
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', module: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', module: 'users' },
  { path: '/orders', label: '订单管理', icon: '🧾', description: '查询订单、支付状态、会员权益与退款处理。', module: 'orders' },
  { path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '查看 AI 评房调用量、成功率、成本与异常趋势。', module: 'ai-stats' },
  { path: '/community-reports', label: '社区举报', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。', module: 'community-reports' },
  { path: '/security/blacklist', label: '黑名单管理', icon: '⛔', description: '维护用户、手机号、IP、设备与微信 OpenID 风控黑名单。', module: 'blacklist' },
  { path: '/config', label: '系统配置', icon: '⚙️', description: '管理 App 公告、业务开关、最低版本与强制更新策略。', module: 'config' },
];
