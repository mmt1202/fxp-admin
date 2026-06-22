import { createModulePage } from './shared';

export function SettingsPage(): HTMLElement {
  return createModulePage('系统配置', '配置后台权限、业务字典、审核策略与接口参数。', ['后台权限', '业务字典', '审核策略', '接口参数']);
}
