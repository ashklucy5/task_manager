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

  return (
    <header className="bg-white shadow-sm">
      {/* Team Pulse Bar */}
      <TeamPulseBar />
      
      {/* Main Header */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">NexusFlow AI</h1>
            <p className="text-xs text-gray-500">Business Command Center</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {user.full_name.charAt(0)}
              </div>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-red-600"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;