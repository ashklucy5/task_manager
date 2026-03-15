// src/components/dashboard/EmployeeDashboard.tsx

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { taskService } from '../../services/taskService';
import type { Task } from '../../types';
import Skeleton from '../ui/Skeleton';
import TaskCard from '../tasks/TaskCard';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await taskService.getMyTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTasks();
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

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const capacity = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Dashboard</h2>
        <p className="text-gray-500 mt-1">Your assigned tasks and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-500">My Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
        </div>

        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{completedTasks.length}</p>
        </div>

        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{capacity}%</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks</h3>
        {inProgressTasks.length > 0 ? (
          <div className="space-y-4">
            {inProgressTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} showAssignee={false} />
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

export default EmployeeDashboard;