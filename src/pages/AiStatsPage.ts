import { createElement } from '../utils/dom';

export function AiStatsPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">智能能力</p>
    <h1>AI 统计</h1>
    <p>查看 AI 调用量、模型效果、成本趋势与失败原因。</p>
    <div class="placeholder-grid"><div>调用趋势</div><div>成功率</div><div>成本分析</div><div>失败原因</div></div>
  `;
  return page;
}
