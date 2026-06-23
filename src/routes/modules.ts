export const adminModules = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', module: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', module: 'users' },
  { path: '/properties', label: '房源管理', icon: '🏠', description: '维护房源基础信息、上下架状态、区域与配套标签。', module: 'orders' },
  { path: '/reviews', label: '评价管理', icon: '⭐', description: '查看房源评价、评分维度、内容质量与互动数据。', module: 'orders' },
  { path: '/recommendation-pools', label: '推荐池管理', icon: '🎯', description: '创建首页推荐池，维护推荐内容、排序、置顶与定时上下线。', module: 'recommendation-pools' },
  { path: '/moderation', label: '举报/审核管理', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。', module: 'community-reports' },
  { path: '/config', label: '系统配置', icon: '⚙️', description: '管理 App 公告、业务开关、最低版本与强制更新策略。', module: 'config' },
] as const;

export type AdminModuleName = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'community-reports' | 'recommendation-pools' | 'config';

export type AdminModule = Omit<(typeof adminModules)[number], 'module'> & { module: AdminModuleName };
