import type { UserRole } from '../types';

export const USER_ROLES = {
  OWNER: 'OWNER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  EMPLOYEE: 'EMPLOYEE' as UserRole,
};

export const canViewFinancials = (role: UserRole): boolean => {
  return role === USER_ROLES.OWNER;
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN;
};

export const canAssignTasks = (role: UserRole): boolean => {
  return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN;
};