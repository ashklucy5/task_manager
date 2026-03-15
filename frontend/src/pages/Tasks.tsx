// src/pages/Tasks.tsx

import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import TaskList from '../components/tasks/TaskList';
import AssignTaskModal from '../components/tasks/AssignTaskModal';
import Button from '../components/ui/Button';
import { canAssignTasks } from '../utils/roles';

const TasksPage = () => {
  const { user } = useAuthStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my-tasks' | 'completed' | 'pending' | 'overdue'>('all');
  const canAssign = user && canAssignTasks(user.role);

  const handleTaskUpdate = () => {
    // Refresh task list after update
    console.log('Task updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track all tasks</p>
        </div>
        {canAssign && (
          <Button onClick={() => setShowAssignModal(true)} variant="primary">
            + Assign Task
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('my-tasks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'my-tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'completed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'overdue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Task List */}
      <TaskList filter={filter} showAssignee={filter !== 'my-tasks'} onTaskUpdate={handleTaskUpdate} />

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={handleTaskUpdate}
      />
    </div>
  );
};

export default TasksPage;