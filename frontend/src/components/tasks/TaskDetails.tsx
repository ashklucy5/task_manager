// src/components/tasks/TaskDetails.tsx

import { useState } from 'react';
import type { Task, TaskStatus } from '../../types';  // ✅ Added TaskStatus
import { formatDate, formatCurrency } from '../../utils/formatDate';
import Button from '../ui/Button';

interface TaskDetailsProps {
  task: Task;
  canEditStatus?: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;  // ✅ Type parameter
}

const TaskDetails = ({ 
  task, 
  canEditStatus = true,
  onClose, 
  onStatusChange 
}: TaskDetailsProps) => {
  // ✅ FIX: Type localStatus as TaskStatus
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);

  const statusOptions: { value: TaskStatus; label: string }[] = [  // ✅ Typed options
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const handleStatusChange = (newStatus: TaskStatus) => {  // ✅ Type parameter
    // Optimistic local update
    setLocalStatus(newStatus);
    
    if (onStatusChange && canEditStatus) {
      onStatusChange(task.id, newStatus);
    }
  };

  const getStatusColor = (status: TaskStatus) => {  // ✅ Type parameter
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'ON_HOLD': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
        <div className="flex items-center space-x-3 mt-2">
          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{task.category}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(localStatus)}`}>
            {localStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 text-sm">{task.description}</p>
        </div>
      )}

      {/* Requirements */}
      {task.requirements && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Requirements</h3>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{task.requirements}</p>
        </div>
      )}

      {/* Checklist */}
      {task.requirements_checklist && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Checklist</h3>
          <div className="space-y-2">
            {task.requirements_checklist.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  className="w-4 h-4 text-blue-600 rounded"
                  readOnly
                  disabled
                />
                <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {task.progress !== undefined && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Progress</h3>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
          <p className="text-xs text-gray-500 mt-1">{task.progress}% complete</p>
        </div>
      )}

      {/* Client Info */}
      {(task.client_name || task.company_name) && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Client Information</h3>
          <div className="space-y-1 text-sm">
            {task.client_name && <p className="text-gray-600">Client: {task.client_name}</p>}
            {task.company_name && <p className="text-gray-600">Company: {task.company_name}</p>}
          </div>
        </div>
      )}

      {/* Financial Info */}
      {task.payment_amount !== undefined && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Payment</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">Amount: {formatCurrency(task.payment_amount)}</p>
            <p className="text-gray-600">Status: {task.is_paid ? 'Paid' : 'Pending'}</p>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
          <p className="text-gray-600 text-sm">{formatDate(task.due_date)}</p>
        </div>
        {task.created_at && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Created</h3>
            <p className="text-gray-600 text-sm">{formatDate(task.created_at)}</p>
          </div>
        )}
      </div>

      {/* Status Update */}
      {canEditStatus ? (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Update Status</h3>
          <select
            value={localStatus}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}  // ✅ Type assertion
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Changes apply instantly</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
          <p className="text-gray-500 text-sm">You don't have permission to update this task's status</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button onClick={onClose} variant="secondary" fullWidth>
          Close
        </Button>
      </div>
    </div>
  );
};

export default TaskDetails;