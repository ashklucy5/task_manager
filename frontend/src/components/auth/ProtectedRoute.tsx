// src/components/auth/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canViewFinancials, canManageUsers } from '../../utils/roles';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  requireFinancialAccess?: boolean;
  requireAdminAccess?: boolean;
  redirectPath?: string;
  children?: ReactNode;
}

const ProtectedRoute = ({
  requireFinancialAccess = false,
  requireAdminAccess = false,
  redirectPath = '/login',
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  if (requireFinancialAccess && user && !canViewFinancials(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdminAccess && user && !canManageUsers(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;