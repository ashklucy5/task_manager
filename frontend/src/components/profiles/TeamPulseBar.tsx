// src/components/profiles/TeamPulseBar.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/api';
import type { UserProfile } from '../../types';
import EmployeeCard from './EmployeeCard';
import Skeleton from '../ui/Skeleton';
import AssignTaskModal from '../tasks/AssignTaskModal';

const TeamPulseBar = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  
  const { user } = useAuthStore();
  // ✅ Check if user can assign tasks
  const canAssignTasks = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getTeamProfiles();
        setProfiles(response.data);
      } catch (error) {
        console.error('Failed to fetch team profiles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // ✅ Handle card click to open assign modal
  const handleAssignTask = (assigneeId: string) => {
    if (!canAssignTasks) return;
    
    setSelectedAssigneeId(assigneeId);
    setShowAssignModal(true);
  };

  // ✅ Handle modal close
  const handleModalClose = () => {
    setShowAssignModal(false);
    setSelectedAssigneeId('');
  };

  // ✅ Handle successful task creation
  const handleModalSuccess = () => {
    setShowAssignModal(false);
    setSelectedAssigneeId('');
    // Optionally refresh profiles or show success message
  };

  return (
    <>
      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Team Pulse</h2>
          <span className="text-xs text-gray-400">
            {profiles.length} {profiles.length === 1 ? 'member' : 'members'} online
          </span>
        </div>
        
        <div className="flex items-center overflow-x-auto pb-2 -mx-2">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 mx-2 w-64">
                  <Skeleton className="h-24" />
                </div>
              ))}
            </>
          ) : profiles.length > 0 ? (
            profiles.map((profile) => (
              <EmployeeCard 
                key={profile.id} 
                profile={profile} 
                showFinancialTooltip={user?.role === 'super_admin'}
                // ✅ Make clickable for super_admin/admin
                isClickable={canAssignTasks}
                onAssignTask={handleAssignTask}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm py-4">
              No team members found
            </div>
          )}
        </div>
      </div>

      {/* ✅ Assign Task Modal */}
      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        defaultAssigneeId={selectedAssigneeId}  // ✅ Pre-fill assignee
      />
    </>
  );
};

export default TeamPulseBar;