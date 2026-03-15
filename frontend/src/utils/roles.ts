// src/utils/roles.ts

import type { UserRole } from '../types';

// ✅ Match backend role values exactly
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  ADMIN: 'admin' as UserRole,
  MEMBER: 'member' as UserRole,
};

export const canViewFinancials = (role: UserRole): boolean => {
  return role === USER_ROLES.SUPER_ADMIN;
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN;
};

// ✅ ADDED: Check if user can assign tasks
export const canAssignTasks = (role: UserRole): boolean => {
  return role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN;
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'member': return 'Member';
    default: return role;
  }
};

export const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-700';
    case 'admin': return 'bg-blue-100 text-blue-700';
    case 'member': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};