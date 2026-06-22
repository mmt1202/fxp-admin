import type { AdminPermission } from '../types/admin';

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  permission: AdminPermission;
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', permission: 'dashboard:view' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', permission: 'users:view' },
  { path: '/reports', label: '举报/审核管理', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。', permission: 'reports:view' },
  { path: '/orders', label: '订单管理', icon: '🧾', description: '查看订单、支付状态、退款进度与履约记录。', permission: 'orders:view' },
  { path: '/membership', label: '会员配置', icon: '💎', description: '配置会员权益、套餐状态、增值服务与更新策略。', permission: 'membership:update' },
  { path: '/admin-users', label: '管理员管理', icon: '🔐', description: '管理后台账号、角色、权限点与账号启停状态。', permission: 'admin-users:manage' },
];
