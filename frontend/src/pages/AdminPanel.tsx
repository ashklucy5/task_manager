// src/pages/AdminPanel.tsx

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usersApi, tasksApi, financialsApi } from '../services/api';
import type { User, Task, FinancialSummary } from '../types';
import TeamPulseBar from '../components/profiles/TeamPulseBar';
import Button from '../components/ui/Button';
import { canViewFinancials, canManageUsers, canAssignTasks } from '../utils/roles';

const AdminPanel = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [stats, setStats] = useState<FinancialSummary>({
    total_users: 0,
    active_users: 0,
    total_tasks: 0,
    completed_tasks: 0,
    completion_rate: 0,
    total_payment_cents: 0,
    total_payment_usd: '$0.00',
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user && canViewFinancials(user.role);
  const isAdmin = user && canManageUsers(user.role);
  const canAssign = user && canAssignTasks(user.role);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        const response = await financialsApi.getSummary();
        setStats(response.data);
      }
      
      const usersResponse = await usersApi.getUsers({ company_id: user?.company_id });
      const fetchedUsers: User[] = usersResponse.data;
      setUsers(fetchedUsers);
      
      const tasksResponse = await tasksApi.getAllTasks();
      const fetchedTasks: Task[] = tasksResponse.data.filter(
        (t: Task) => fetchedUsers.some((u: User) => u.id === t.assignee_id)
      );
      setTasks(fetchedTasks);
      
      const activeUsers = fetchedUsers.filter((u: User) => u.status === 'ACTIVE').length;
      const completedTasks = fetchedTasks.filter((t: Task) => t.status === 'COMPLETED').length;
      const completionRate = fetchedTasks.length > 0 
        ? Math.round((completedTasks / fetchedTasks.length) * 100) 
        : 0;
      
      if (!isSuperAdmin) {
        setStats(prev => ({
          ...prev,
          total_users: fetchedUsers.length,
          active_users: activeUsers,
          total_tasks: fetchedTasks.length,
          completed_tasks: completedTasks,
          completion_rate: completionRate,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: '📊' },
    ...(isAdmin ? [{ path: '/admin/users', label: 'Users', icon: '👥' }] : []),
    ...(canAssign ? [{ path: '/admin/tasks', label: 'Tasks', icon: '✅' }] : []),
    ...(isSuperAdmin ? [{ path: '/admin/financials', label: 'Financials', icon: '💰' }] : []),
    ...(isSuperAdmin ? [{ path: '/admin/settings', label: 'Settings', icon: '⚙️' }] : []),
  ];

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">NexusFlow</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Company</p>
          <p className="text-sm font-medium text-gray-900">{user.company_code || 'Company'}</p>
          <p className="text-xs text-gray-500 mt-1">ID: {user.company_id}</p>
        </div>

        {/* Quick Stats */}
        {!loading && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Quick Stats</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Users:</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active:</span>
                <span className="font-medium text-green-600">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-500">Total Tasks:</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completed:</span>
                <span className="font-medium text-green-600">
                  {tasks.filter(t => t.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Completion:</span>
                <span className="font-medium">{stats.completion_rate}%</span>
              </div>
              {isSuperAdmin && (
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-1">
                  <span className="text-gray-500">Payments:</span>
                  <span className="font-medium text-green-600">{stats.total_payment_usd}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActivePath(item.path)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info - ✅ FIXED: Show avatar if available */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            {/* ✅ Avatar with fallback */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {user.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.position || user.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            fullWidth
            className="text-gray-500 hover:text-red-600"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Team Pulse Bar */}
        <TeamPulseBar />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;