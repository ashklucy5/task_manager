// src/components/layout/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canViewFinancials, canManageUsers } from '../../utils/roles';

const Sidebar = () => {
  const { user } = useAuthStore();
  const isOwner = user && canViewFinancials(user.role);
  const isAdmin = user && canManageUsers(user.role);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tasks', label: 'Tasks', icon: '✅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    ...(isAdmin ? [{ path: '/users', label: 'Users', icon: '👥' }] : []),
    ...(isOwner ? [{ path: '/financials', label: 'Financials', icon: '💰' }] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              Position:{' '}
              <span className="font-medium text-gray-900">
                {user.position || user.role}
              </span>
            </p>
            <p>
              Status:{' '}
              <span className={`font-medium ${
                user.status === 'ACTIVE' ? 'text-green-600' :
                user.status === 'BUSY' ? 'text-yellow-600' :
                user.status === 'ON_LEAVE' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {user.status}
              </span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;