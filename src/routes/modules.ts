import { createElement, ReactNode } from 'react';
import { RegionalHeatPage } from '../pages/RegionalHeatPage';

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  element?: ReactNode;
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。' },
  { path: '/properties', label: '房源管理', icon: '🏠', description: '维护房源基础信息、上下架状态、区域与配套标签。' },
  { path: '/reviews', label: '评价管理', icon: '⭐', description: '查看房源评价、评分维度、内容质量与互动数据。' },
  { path: '/regional-heat', label: '区域热度', icon: '🔥', description: '按城市、区域与小区分析房源、评价、AI 评房和用户互动热度。', element: createElement(RegionalHeatPage) },
  { path: '/moderation', label: '举报/审核管理', icon: '🛡️', description: '处理举报线索、内容审核、申诉与处置记录。' },
  { path: '/settings', label: '系统配置', icon: '⚙️', description: '配置后台权限、业务字典、审核策略与接口参数。' },
];
