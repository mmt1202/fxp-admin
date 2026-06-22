import { createElement } from '../utils/dom';

export function SettingsPage(): HTMLElement {
  const page = createElement('div', { className: 'module-page' });
  page.innerHTML = `
    <p class="eyebrow">后台配置</p>
    <h1>系统配置</h1>
    <p>配置后台权限、业务字典、审核策略与接口参数。</p>
    <div class="placeholder-grid"><div>管理员</div><div>角色权限</div><div>业务字典</div><div>接口参数</div></div>
  `;
  return page;
}
