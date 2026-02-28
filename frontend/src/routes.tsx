import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/login';
import DashboardLayout from './pages/Dashboard'; // Uses Outlet internally
import TasksPage from './pages/Tasks';
import AnalyticsPage from './pages/Analytics';
import FinancialsPage from './pages/Financials';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OwnerDashboard from './components/dashboard/OwnerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  
  // Parent route provides layout with Outlet
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout /> {/* Renders nested routes via Outlet */}
      </ProtectedRoute>
    ),
    children: [
      // Redirect root to default dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      
      // Dashboard routes (nested under /dashboard)
      {
        path: 'dashboard',
        children: [
          { index: true, element: <EmployeeDashboard /> },
          {
            path: 'owner',
            element: (
              <ProtectedRoute requireFinancialAccess>
                <OwnerDashboard />
              </ProtectedRoute>
            ),
          },
          { path: 'admin', element: <AdminDashboard /> },
          { path: 'employee', element: <EmployeeDashboard /> },
        ],
      },
      
      // Top-level protected pages (rendered in DashboardLayout's Outlet)
      { path: 'tasks', element: <TasksPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      {
        path: 'financials',
        element: (
          <ProtectedRoute requireFinancialAccess>
            <FinancialsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // Catch-all redirect
  { path: '*', element: <Navigate to="/login" replace /> },
]);