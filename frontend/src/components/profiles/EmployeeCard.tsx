import { useState } from 'react';
import type { UserProfile } from '../../types';
import { formatCurrency } from '../../utils/formatDate';

interface EmployeeCardProps {
  profile: UserProfile;
  showFinancialTooltip?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-500';
    case 'INACTIVE': return 'bg-gray-400';
    case 'ON_LEAVE': return 'bg-blue-500';
    default: return 'bg-gray-300';
  }
};

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  profile, 
  showFinancialTooltip = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mock financial data (in real app, fetch from API)
  const financialData = {
    monthlyPayout: 850000,    // $8,500 in cents
    pendingBonus: 120000,     // $1,200 in cents
    costPerTask: 35000,       // $350 in cents
  };

  return (
    <div 
      className="flex-shrink-0 mx-2 transition-all duration-200 hover:scale-[1.02] relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 w-64 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {profile.full_name.charAt(0)}
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getStatusColor(profile.status)}`}></span>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{profile.full_name}</h3>
            <p className="text-xs text-gray-500">{profile.role}</p>
          </div>
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
              ></div>
            </div>
          </div>
        )}
        
        {/* Financial Tooltip (Owner-only) */}
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