import { createElement } from '../utils/dom';
import { formatNumber, formatPercent } from '../utils/format';

export function DashboardPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">运营概览</p>
    <h1>数据看板</h1>
    <p>集中查看核心指标、增长趋势、评价质量与审核效率。</p>
    <div class="placeholder-grid">
      <div>用户总量：${formatNumber(12880)}</div>
      <div>订单总量：${formatNumber(3420)}</div>
      <div>AI 调用：${formatNumber(92800)}</div>
      <div>转化率：${formatPercent(0.186)}</div>
    </div>
  `;
  return page;
}
