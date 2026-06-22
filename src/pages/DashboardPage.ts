import { createModulePage } from './shared';

export function DashboardPage(): HTMLElement {
  return createModulePage('数据看板', '核心指标、增长趋势、评价质量与审核效率概览。', ['核心指标', '增长趋势', '评价质量', '审核效率']);
}
