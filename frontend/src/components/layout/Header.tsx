// src/components/layout/Header.tsx

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import TeamPulseBar from '../profiles/TeamPulseBar';
import Button from '../ui/Button';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <header className="glass-panel sticky top-0 z-60">
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div 
            className="w-14 h-14 glass-card flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/dashboard')}
          >
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">N</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NexusFlow AI</h1>
            <p className="text-xs text-gray-500 font-medium">Business Command Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.position || user.role}</p>
              </div>
              
              <button
                onClick={handleGoToProfile}
                className="w-12 h-12 glass-card rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform shadow-modern"
                title="Go to profile"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
                    {user.full_name.charAt(0)}
                  </span>
                )}
              </button>
              
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Team Pulse Bar */}
      <TeamPulseBar />
    </header>
  );
};

export default Header;