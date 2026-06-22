export const adminPermissions = [
  'dashboard:view',
  'users:view',
  'users:update',
  'reports:view',
  'reports:handle',
  'orders:view',
  'membership:update',
  'admin-users:manage',
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

export type AdminRole = {
  id: string;
  name: string;
  permissions: AdminPermission[];
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserInput = {
  username: string;
  displayName: string;
  password?: string;
  roleId: string;
  permissions: AdminPermission[];
  enabled: boolean;
};
