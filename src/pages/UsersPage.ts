import { createElement } from '../utils/dom';

export function UsersPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">用户运营</p>
    <h1>用户管理</h1>
    <p>管理 App 用户、角色状态、实名信息与风控标签。</p>
    <div class="placeholder-grid"><div>用户检索</div><div>状态变更</div><div>实名审核</div><div>风控标签</div></div>
  `;
  return page;
}
