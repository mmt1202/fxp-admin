import { createElement } from '../utils/dom';

export function ReportsPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">数据资产</p>
    <h1>报表中心</h1>
    <p>汇总运营报表、导出任务、指标口径与周期对比。</p>
    <div class="placeholder-grid"><div>日报</div><div>周报</div><div>月报</div><div>导出记录</div></div>
  `;
  return page;
}
