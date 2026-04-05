// src/components/tasks/TaskCard.tsx

import { useState } from 'react';
import type { Task, TaskStatus } from '../../types';  // ✅ Import TaskStatus
import { formatDate } from '../../utils/formatDate';
import Modal from '../ui/Modal';
import TaskDetails from './TaskDetails';

interface TaskCardProps {
  task: Task;
  canEditStatus?: boolean;
  canDeleteTask?: boolean;  // ✅ NEW: For delete functionality
  onViewDetails?: (task: Task) => void;
  // ✅ FIX: Change from string to TaskStatus
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
  onDeleteTask?: (taskId: number) => void;  // ✅ NEW: For delete functionality
  showAssignee?: boolean;
}

const TaskCard = ({
  task,
  canEditStatus = true,
  canDeleteTask = false,
  onViewDetails,
  onStatusChange,
  onDeleteTask,
  showAssignee = true
}: TaskCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: TaskStatus) => {  // ✅ Use TaskStatus type
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'ON_HOLD': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(task);
    } else {
      setShowDetails(true);
    }
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {  // ✅ Use TaskStatus
    if (onStatusChange && canEditStatus) {
      onStatusChange(taskId, newStatus);
      setShowDetails(false);
    }
  };

  // ✅ NEW: Delete handler
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();  // Prevent opening details modal
    if (onDeleteTask && canDeleteTask) {
      onDeleteTask(task.id);
    }
  };

  return (
    <>
      <div
        className="bg-white border border-gray-100 rounded-xl p-4 mb-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-900 truncate flex-1">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{task.category}</span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.due_date)}
          </span>
        </div>

        {/* Assignee */}
        {showAssignee && task.assignee_name && (
          <div className="flex items-center space-x-2 text-sm mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
              {task.assignee_name.charAt(0)}
            </div>
            <span className="text-gray-600">{task.assignee_name}</span>
          </div>
        )}

        {/* Progress Bar */}
        {task.progress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  task.progress > 75 ? 'bg-green-500' :
                  task.progress > 50 ? 'bg-blue-500' :
                  task.progress > 25 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <div className="flex items-center space-x-2">
            {canEditStatus ? (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View/Edit →
              </button>
            ) : (
              <button className="text-gray-400 text-sm font-medium cursor-not-allowed">
                View Only →
              </button>
            )}
            {/* ✅ Delete Button (Admin/SuperAdmin only) */}
            {canDeleteTask && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 text-sm"
                title="Delete task"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {showDetails && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Task Details"
        >
          <TaskDetails
            task={task}
            canEditStatus={canEditStatus}
            onClose={() => setShowDetails(false)}
            onStatusChange={handleStatusChange}
          />
        </Modal>
      )}
    </>
  );
};

export default TaskCard;