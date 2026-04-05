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
    console.log('Task updated');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tasks</h1>
          <p className="text-gray-500 text-lg">Manage and track all tasks</p>
        </div>
        {canAssign && (
          <Button 
            onClick={() => setShowAssignModal(true)} 
            variant="primary"
            className="btn-modern"
          >
            <span className="text-xl mr-2">+</span>
            Assign Task
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel p-2 rounded-xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter('my-tasks')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
              filter === 'my-tasks'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
              filter === 'overdue'
                ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Task List */}
      <TaskList 
        filter={filter} 
        showAssignee={filter !== 'my-tasks'} 
        onTaskUpdate={handleTaskUpdate} 
      />

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