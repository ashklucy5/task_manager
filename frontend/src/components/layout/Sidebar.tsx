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
    <aside className="w-72 glass-panel flex flex-col h-screen sticky top-0 m-4 rounded-3xl shadow-modern-lg">
      {/* Logo */}
      <div className="p-8 border-b border-white/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-card flex items-center justify-center">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">N</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">NexusFlow</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item-modern ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      {user && (
        <div className="p-6 border-t border-white/30">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 glass-card rounded-full flex items-center justify-center text-white font-semibold">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.full_name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.position || user.role}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-500">Status:</span>
              <span className={`px-3 py-1.5 rounded-full badge-modern ${
                user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                user.status === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
                user.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;