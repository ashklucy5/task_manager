// src/routes.tsx

import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardLayout from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import AnalyticsPage from './pages/Analytics';
import FinancialsPage from './pages/Financials';
import UsersPage from './pages/Users';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OwnerDashboard from './components/dashboard/OwnerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminOverview from './pages/admin/Overview';
import AdminTasks from './pages/admin/Tasks';
import AdminFinancials from './pages/admin/Financials';
import AdminSettings from './pages/admin/Settings';
import CreateCompanyPage from './pages/CreateCompany';
import UserManagement from './pages/admin/UserManagement';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/companies/new', element: <CreateCompanyPage /> },
  
  // Main app layout (protected)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect root to default dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },
      
      // Dashboard sub-routes (role-based)
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
      
      // Top-level protected pages
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
      {
        path: 'users',
        element: (
          <ProtectedRoute requireAdminAccess>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Admin Panel routes (separate layout)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdminAccess>
        <AdminPanel />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      // ✅ FIXED: Removed duplicate 'users' route, keeping UserManagement
      { path: 'users', element: <UserManagement /> },
      { path: 'tasks', element: <AdminTasks /> },
      {
        path: 'financials',
        element: (
          <ProtectedRoute requireFinancialAccess>
            <AdminFinancials />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requireFinancialAccess>
            <AdminSettings />
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // Catch-all redirect to login
  { path: '*', element: <Navigate to="/login" replace /> },
]);