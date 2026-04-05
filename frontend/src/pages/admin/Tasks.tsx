// src/pages/admin/Tasks.tsx

import { useState } from 'react';
import TaskList from '../../components/tasks/TaskList';  // ✅ Default import of TaskList
import AssignTaskModal from '../../components/tasks/AssignTaskModal';
import Button from '../../components/ui/Button';

const AdminTasks = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Assign and track all company tasks</p>
        </div>
        <Button onClick={() => setShowAssignModal(true)}>
          + Assign Task
        </Button>
      </div>

      {/* ✅ TaskList receives these props - NOT TaskCard */}
      <TaskList 
        filter="all" 
        showAssignee={true} 
      />

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default AdminTasks;