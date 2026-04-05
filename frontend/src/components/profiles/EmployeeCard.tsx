// src/components/profiles/EmployeeCard.tsx

import { useState } from 'react';
import type { UserProfile } from '../../types';
import { formatCurrency } from '../../utils/formatDate';

interface EmployeeCardProps {
  profile: UserProfile;
  showFinancialTooltip?: boolean;
  onAssignTask?: (assigneeId: string) => void;
  isClickable?: boolean;
}

// ✅ HELPER: Get online indicator color based on heartbeat + manual status
const getOnlineIndicatorColor = (profile: UserProfile) => {
  // If manual status is OFFLINE, always show gray (user override)
  if (profile.status === 'OFFLINE') return 'bg-gray-400';
  
  // Otherwise use real-time heartbeat status
  return profile.is_online ? 'bg-green-500' : 'bg-gray-400';
};

// ✅ HELPER: Get tooltip text for online indicator
const getOnlineIndicatorTooltip = (profile: UserProfile) => {
  if (profile.status === 'OFFLINE') return 'Offline (manually set)';
  if (profile.status === 'BUSY') return 'Busy';
  if (profile.status === 'ON_LEAVE') return 'On Leave';
  
  // For ACTIVE status, show real-time online status from heartbeat
  if (profile.is_online) return 'Online';
  return 'Offline (inactive)';
};

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  profile,
  showFinancialTooltip = false,
  onAssignTask,
  isClickable = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const financialData = {
    monthlyPayout: profile.salary || 0,
    pendingBonus: 0,
    costPerTask: profile.payment_rate || 0,
  };

  const handleClick = () => {
    if (isClickable && onAssignTask) {
      onAssignTask(profile.id);
    }
  };

  return (
    <div
      className={`flex-shrink-0 mx-2 w-64 transition-all duration-200 relative ${
        isClickable ? 'hover:scale-[1.02] cursor-pointer' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className={`bg-gray-50 rounded-xl p-3 border ${
        isClickable ? 'border-blue-200 hover:border-blue-400' : 'border-gray-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            {/* Avatar from database */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {profile.full_name.charAt(0)}
              </div>
            )}
            
            {/* ✅ Online indicator dot with tooltip */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                getOnlineIndicatorColor(profile)
              }`}
              title={getOnlineIndicatorTooltip(profile)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">{profile.full_name}</h3>
            <p className="text-xs text-gray-500 truncate">{profile.position || profile.role}</p>
          </div>
          
          {/* Show assign icon for clickable cards */}
          {isClickable && (
            <div className="text-blue-600 text-lg">➕</div>
          )}
        </div>

        {/* Capacity bar */}
        {profile.capacity !== undefined && (
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Capacity</span>
              <span>{profile.capacity}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${profile.capacity}%` }}
              />
            </div>
          </div>
        )}

        {/* Manual status badge */}
        <div className="mt-2.5">
          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${
            profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            profile.status === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
            profile.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {profile.status}
          </span>
        </div>

        {/* Tooltip hint for clickable cards */}
        {isClickable && isHovered && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
            Click to assign task
          </div>
        )}

        {/* Financial Tooltip (SuperAdmin only) */}
        {showFinancialTooltip && isHovered && (
          <div className="absolute mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 z-50">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Financial Summary</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Payout:</span>
                <span className="font-medium">{formatCurrency(financialData.monthlyPayout)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pending Bonus:</span>
                <span className="font-medium">{formatCurrency(financialData.pendingBonus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cost Per Task:</span>
                <span className="font-medium">{formatCurrency(financialData.costPerTask)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;