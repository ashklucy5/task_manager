// src/components/dashboard/AdminDashboard.tsx

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { taskService } from '../../services/taskService';
import { usersApi } from '../../services/api';
import type { Task, UserProfile } from '../../types';
import Skeleton from '../ui/Skeleton';
import TaskCard from '../tasks/TaskCard';

const AdminDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ✅ FIXED: taskService returns Task[] directly, NOT AxiosResponse
        const [tasksData, membersResponse] = await Promise.all([
          taskService.getAllTasks(),        // Returns Task[] directly
          usersApi.getTeamProfiles(),       // Returns AxiosResponse<UserProfile[]>
        ]);
        
        setTasks(tasksData);                 // ✅ No .data needed
        setTeamMembers(membersResponse.data); // ✅ .data needed for AxiosResponse
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING');
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');
  // ✅ FIXED: Use completedTasks in the UI or remove it
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">Team oversight and task management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-500">Team Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{teamMembers.length}</p>
        </div>

        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-sm text-gray-500">Active Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeTasks.length}</p>
        </div>

        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
          <p className="text-sm text-gray-500">Overdue Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{overdueTasks.length}</p>
        </div>

        {/* ✅ ADDED: Use completedTasks in UI */}
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-sm text-gray-500">Completed Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{completedTasks.length}</p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
        {activeTasks.length > 0 ? (
          <div className="space-y-4">
            {activeTasks.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No active tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;