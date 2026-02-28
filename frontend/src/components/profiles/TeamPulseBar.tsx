import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/api'; // Named export with specific methods
import type { UserProfile } from '../../types';
import EmployeeCard from './EmployeeCard';
import Skeleton from '../ui/Skeleton';

const TeamPulseBar = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        // ✅ CORRECT: Use specific method, NOT generic .get()
        const response = await usersApi.getTeamProfiles(); // Returns AxiosResponse
        setProfiles(response.data); // ✅ Access .data property
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

  return (
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
              showFinancialTooltip={isOwner}
            />
          ))
        ) : (
          <div className="text-gray-500 text-sm py-4">
            No team members found
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPulseBar;