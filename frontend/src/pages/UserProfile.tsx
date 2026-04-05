// src/pages/UserProfile.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import type {UserStatus } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // ✅ NEW: State for company name
  // const [setCompanyName] = useState<string>('');
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    position: user?.position || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // ✅ NEW: Fetch company name when user loads
  // useEffect(() => {
  //   if (user?.company_id) {
  //     fetchCompanyName();
  //   }
  // }, [user?.company_id]);

  // // ✅ NEW: Fetch company name from backend
  // const fetchCompanyName = async () => {
  //   try {
  //     // You'll need to add this endpoint or use existing one
  //     // For now, we'll extract from user object if available
  //     if (user?.company_code) {
  //       // Fallback: Use company_code if name not available
  //       setCompanyName(user.company_code);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch company:', error);
  //   }
  // };

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        position: user.position || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        full_name: formData.full_name,
        position: formData.position,
      };

      const response = await usersApi.updateUser(user!.id, updateData);
      updateUser(response.data);
      setSuccess('Profile updated successfully!');
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await usersApi.updateMyPassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await usersApi.uploadAvatar(user!.id, formData);
      updateUser({ avatar_url: response.data.avatar_url });
      setSuccess('Avatar uploaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await usersApi.updateMyStatus(newStatus);
      updateUser({ status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>
        <Button onClick={handleLogout} variant="ghost">
          Logout
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
          <p className="text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
        
        {/* Avatar */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.full_name.charAt(0)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{user.full_name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Click the camera icon to change avatar</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={user.role.replace('_', ' ').toUpperCase()}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          {/* Manual Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Status
            </label>
            <select
              value={user?.status}
              onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">🟢 Active</option>
              <option value="BUSY">🟡 Busy</option>
              <option value="ON_LEAVE">🔵 On Leave</option>
              <option value="OFFLINE">⚪ Offline</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              This is your manual status. Your online status is detected automatically via heartbeat.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" isLoading={loading} variant="primary">
              Save Changes
            </Button>
            <Button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              variant="secondary"
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info - ✅ UPDATED: Show company name */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded mt-1">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Company</p>
            {/* ✅ UPDATED: Show company name with fallback */}
            <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded mt-1">
              {user.company_name || user.company_code || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              user.status === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
              user.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {user.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="text-sm mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              name="current_password"
              value={passwordData.current_password}
              onChange={handlePasswordChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" onClick={() => setShowPasswordModal(false)} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} variant="primary" fullWidth>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;