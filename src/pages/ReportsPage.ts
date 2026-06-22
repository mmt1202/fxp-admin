import { createModulePage } from './shared';

export function ReportsPage(): HTMLElement {
  return createModulePage('报表中心', '汇总运营报表、导出任务、周期指标与业务洞察。', ['运营报表', '导出任务', '周期指标', '业务洞察']);
}
