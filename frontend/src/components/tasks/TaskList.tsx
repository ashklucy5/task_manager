// src/components/tasks/TaskList.tsx

import { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { tasksApi } from '../../services/api';
import TaskCard from './TaskCard';
import Skeleton from '../ui/Skeleton';
// import Button from '../ui/Button';

interface TaskListProps {
  filter?: 'all' | 'my-tasks' | 'completed' | 'pending' | 'overdue';
  showAssignee?: boolean;
  onTaskUpdate?: () => void;
}

const TaskList = ({ filter = 'all', showAssignee = true, onTaskUpdate }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'my-tasks') {
        response = await tasksApi.getMyTasks();
      } else {
        response = await tasksApi.getAllTasks();
      }
      
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    if (filter === 'completed') return task.status === 'COMPLETED' && matchesSearch;
    if (filter === 'pending') return task.status === 'PENDING' && matchesSearch;
    if (filter === 'overdue') return task.status === 'OVERDUE' && matchesSearch;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await tasksApi.updateTaskStatus(taskId, newStatus);
      fetchTasks();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showAssignee={showAssignee}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">Try adjusting your filters or create a new task</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;