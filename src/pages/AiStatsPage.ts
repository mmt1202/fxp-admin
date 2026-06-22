import { createModulePage } from './shared';

export function AiStatsPage(): HTMLElement {
  return createModulePage('AI 统计', '追踪 AI 调用量、成功率、成本与模型表现。', ['调用量', '成功率', '成本趋势', '模型表现']);
}
