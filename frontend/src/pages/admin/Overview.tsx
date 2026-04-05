// src/pages/admin/Overview.tsx

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi, tasksApi, financialsApi } from '../../services/api';
import type { User, Task, FinancialSummary } from '../../types';
import Skeleton from '../../components/ui/Skeleton';

const AdminOverview = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    offlineUsers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'super_admin') {
        try {
          const financialResponse = await financialsApi.getSummary();
          setFinancialSummary(financialResponse.data);
        } catch (error) {
          console.error('Failed to fetch financial summary:', error);
        }
      }
      
      const [usersResponse, tasksResponse] = await Promise.all([
        usersApi.getUsers({ company_id: user?.company_id }),
        tasksApi.getAllTasks(),
      ]);
      
      const users = usersResponse.data;
      const tasks = tasksResponse.data.filter(
        (t: Task) => users.some((u: User) => u.id === t.assignee_id)
      );
      
      const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
      const offlineUsers = users.filter(u => u.status === 'OFFLINE').length;
      const pendingTasks = tasks.filter(t => 
        t.status === 'PENDING' || t.status === 'IN_PROGRESS'
      ).length;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
      const overdueTasks = tasks.filter(t => t.status === 'OVERDUE').length;
      const completionRate = tasks.length > 0 
        ? Math.round((completedTasks / tasks.length) * 100) 
        : 0;
      
      setStats({
        totalUsers: users.length,
        activeUsers,
        offlineUsers,
        totalTasks: tasks.length,
        pendingTasks,
        completedTasks,
        overdueTasks,
        completionRate,
      });
      
      setRecentTasks(tasks.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'OFFLINE': return 'bg-gray-100 text-gray-700';
      case 'BUSY': return 'bg-yellow-100 text-yellow-700';
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
        {[1, 2].map(i => <Skeleton key={i} className="h-80 rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Company Overview</h1>
        <p className="text-gray-500 text-lg">
          Welcome back! Here's what's happening at {user?.company_code || 'your company'}
        </p>
      </div>

      {/* Financial Summary Card */}
      {user?.role === 'super_admin' && financialSummary && (
        <div className="card-modern card-gradient animate-slide-up">
          <h2 className="text-xl font-semibold mb-6">💰 Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-80">Total Payment</p>
              <p className="text-3xl font-bold">{financialSummary.total_payment_usd}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Completion Rate</p>
              <p className="text-3xl font-bold">{financialSummary.completion_rate}%</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Active Users</p>
              <p className="text-3xl font-bold">{financialSummary.active_users}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="card-modern animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-3xl">
              👥
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm gap-2">
            <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">{stats.activeUsers} active</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{stats.offlineUsers} offline</span>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="card-modern animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalTasks}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center text-3xl">
              ✅
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm gap-2">
            <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">{stats.pendingTasks} pending</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{stats.completedTasks} completed</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card-modern animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.completionRate}%</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
              📈
            </div>
          </div>
          <div className="mt-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="card-modern animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Overdue Tasks</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.overdueTasks}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center text-3xl">
              ⚠️
            </div>
          </div>
          <div className="mt-6 text-sm">
            {stats.overdueTasks > 0 ? (
              <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium">Needs attention</span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">All on track</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card-modern animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Tasks</h2>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No tasks yet</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="card-modern animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Team Members</h2>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      u.full_name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.position || u.role}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(u.status)}`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No team members yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;