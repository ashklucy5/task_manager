// src/pages/admin/Tasks.tsx

import TaskList from '../../components/tasks/TaskList';
import AssignTaskModal from '../../components/tasks/AssignTaskModal';
import Button from '../../components/ui/Button';
import { useState } from 'react';

const AdminTasks = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Assign and track all company tasks</p>
        </div>
        <Button onClick={() => setShowAssignModal(true)}>
          + Assign Task
        </Button>
      </div>

      <TaskList filter="all" showAssignee={true} />

      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default AdminTasks;