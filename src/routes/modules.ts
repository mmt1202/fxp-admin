import type { AdminPermission } from '../types/admin';
export type AdminEndpoint = {
  method: 'GET' | 'PUT';
  path: string;
  description: string;
};

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  endpoints: AdminEndpoint[];
  permission: AdminPermission;
};

export const adminModules: AdminModule[] = [
  {
    path: '/dashboard',
    label: '数据看板',
    icon: '📊',
    description: '核心指标与增长趋势概览。',
    endpoints: [
      { method: 'GET', path: '/admin/dashboard', description: '获取后台数据看板核心指标。' },
      { method: 'GET', path: '/admin/dashboard/trend', description: '获取后台数据看板趋势数据。' },
    ],
  },
  { path: '/analytics', label: '数据分析', icon: '📈', description: '按时间范围分析用户、房源、会员转化与 AI 评房数据。' },
  {
    path: '/users',
    label: '用户管理',
    icon: '👥',
    description: '管理 App 用户资料与账号状态。',
    endpoints: [
      { method: 'GET', path: '/admin/users', description: '获取用户列表。' },
      { method: 'PUT', path: '/admin/users/:userId/status', description: '更新指定用户账号状态。' },
    ],
  },
  {
    path: '/memberships',
    label: '会员管理',
    icon: '💎',
    description: '查看与调整用户会员权益。',
    endpoints: [
      { method: 'GET', path: '/admin/users/:userId/membership', description: '获取指定用户会员信息。' },
      { method: 'PUT', path: '/admin/users/:userId/membership', description: '更新指定用户会员信息。' },
    ],
  },
  {
    path: '/orders',
    label: '订单流水',
    icon: '🧾',
    description: '查询订单、支付与流水记录。',
    endpoints: [{ method: 'GET', path: '/admin/orders', description: '获取订单流水列表。' }],
  },
  {
    path: '/ai-stats',
    label: 'AI 用量统计',
    icon: '🤖',
    description: '统计 AI 功能调用量与消耗情况。',
    endpoints: [{ method: 'GET', path: '/admin/ai-stats', description: '获取 AI 用量统计数据。' }],
  },
  {
    path: '/reports',
    label: '举报审核',
    icon: '🛡️',
    description: '处理社区举报线索与审核结果。',
    endpoints: [
      { method: 'GET', path: '/admin/community/reports', description: '获取社区举报列表。' },
      { method: 'PUT', path: '/admin/community/reports/:id', description: '更新指定举报处理状态。' },
    ],
  },
  {
    path: '/settings',
    label: '系统配置',
    icon: '⚙️',
    description: '配置后台权限、业务字典、审核策略与接口参数。',
    endpoints: [],
  },
  { path: '/properties', label: '房源管理', icon: '🏠', description: '维护房源基础信息、上下架状态、区域与配套标签。' },
  { path: '/reviews', label: '评价管理', icon: '⭐', description: '查看房源评价、评分维度、内容质量与互动数据。' },
  { path: '/moderation', label: '举报/审核管理', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。' },
  { path: '/risk', label: '风控配置', icon: '🚦', description: '维护敏感词库、风控规则、命中记录与待审核策略。' },
  { path: '/reports', label: '举报/审核管理', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。', permission: 'reports:view' },
  { path: '/orders', label: '订单管理', icon: '🧾', description: '查看订单、支付状态、退款进度与履约记录。', permission: 'orders:view' },
  { path: '/membership', label: '会员配置', icon: '💎', description: '配置会员权益、套餐状态、增值服务与更新策略。', permission: 'membership:update' },
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', permission: 'dashboard:view' },
  { path: '/admin-users', label: '管理员管理', icon: '🔐', description: '管理后台账号、角色、权限点与账号启停状态。', permission: 'admin-users:manage' },
];
