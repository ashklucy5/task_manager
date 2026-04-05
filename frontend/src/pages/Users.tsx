// src/pages/Users.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import type { User } from '../types';
import CreateUserModal from '../components/users/CreateUserModal';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { canManageUsers } from '../utils/roles';

const UsersPage = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const canCreate = user && canManageUsers(user.role);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers({ company_id: user?.company_id });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u: User) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'OFFLINE': return 'bg-gray-100 text-gray-700';
      case 'BUSY': return 'bg-yellow-100 text-yellow-700';
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Team Members</h1>
          <p className="text-gray-500 text-lg">Manage users in your company</p>
        </div>
        {canCreate && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="btn-modern"
          >
            <span className="text-xl mr-2">+</span>
            Add User
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="glass-panel p-4">
        <input
          type="text"
          placeholder="Search by name, email, or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-modern w-full"
        />
      </div>

      {/* User Count */}
      <div className="text-sm text-gray-500 font-medium">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* User Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u: User) => (
                <tr key={u.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 glass-card rounded-full flex items-center justify-center text-white font-semibold">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          u.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.full_name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.position || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 font-medium">No users found</p>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default UsersPage;