import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canViewFinancials } from '../../utils/roles';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  requireFinancialAccess?: boolean;
  redirectPath?: string;
  children?: ReactNode; // ✅ CRITICAL: Add children prop
}

const ProtectedRoute = ({
  requireFinancialAccess = false,
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

  return <>{children}</>; // ✅ Render children directly (NO Outlet needed here)
};

export default ProtectedRoute;