import { createModulePage } from './shared';

export function UsersPage(): HTMLElement {
  return createModulePage('用户管理', '管理 App 用户、角色状态、实名信息与风控标签。', ['用户检索', '角色状态', '实名信息', '风控标签']);
}
