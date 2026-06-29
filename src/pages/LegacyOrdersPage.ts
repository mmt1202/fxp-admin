import { createModulePage } from './shared';

export function OrdersPage(): HTMLElement {
  return createModulePage('订单管理', '查看订单状态、退款售后、支付流水与履约异常。', ['订单列表', '退款售后', '支付流水', '履约异常']);
}
