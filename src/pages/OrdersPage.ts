import { createElement } from '../utils/dom';

export function OrdersPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">交易履约</p>
    <h1>订单管理</h1>
    <p>跟进订单状态、退款售后、履约进度与异常单据。</p>
    <div class="placeholder-grid"><div>订单检索</div><div>履约跟进</div><div>售后处理</div><div>异常预警</div></div>
  `;
  return page;
}
