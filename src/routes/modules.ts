export type ModuleKey = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'community-reports';

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  module?: ModuleKey;
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', module: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', module: 'users' },
  { path: '/user-segments', label: '用户分层', icon: '🏷️', description: '基于行为、消费与风控维度进行用户分层运营。' },
  { path: '/orders', label: '订单管理', icon: '💳', description: '查看订单金额、状态流转、退款与会员购买记录。', module: 'orders' },
  { path: '/ai-stats', label: 'AI 数据', icon: '🤖', description: '分析 AI 使用次数、调用趋势、转化与内容质量。', module: 'ai-stats' },
  { path: '/community-reports', label: '社区举报', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。', module: 'community-reports' },
  { path: '/properties', label: '房源管理', icon: '🏠', description: '维护房源基础信息、上下架状态、区域与配套标签。', module: 'users' },
  { path: '/reviews', label: '评价管理', icon: '⭐', description: '查看房源评价、评分维度、内容质量与互动数据。', module: 'community-reports' },
  { path: '/config', label: '系统配置', icon: '⚙️', description: '管理 App 公告、业务开关、最低版本与强制更新策略。' },
];
