// src/pages/admin/Users.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/api';
import type { User, UserRole } from '../../types';
import CreateUserModal from '../../components/users/CreateUserModal';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

const AdminUsers = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ✅ Determine what roles current user can create
  const canCreateAdmin = user?.role === 'super_admin';
  const canCreateMember = user?.role === 'super_admin' || user?.role === 'admin';

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

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: UserRole) => {
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
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage users in your company</p>
        </div>
        {canCreateMember && (
          <Button onClick={() => setShowCreateModal(true)}>
            + Add User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="OFFLINE">Offline</option>
          <option value="BUSY">Busy</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
      </div>

      {/* User Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  {/* ✅ User with Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {/* ✅ Avatar with fallback to initial */}
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {u.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{u.full_name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">{u.position || '-'}</td>
                  
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded">
                      {u.company_code || '-'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {u.parent_id ? (
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded" title={u.parent_id}>
                        {u.parent_id}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {canCreateMember && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
          // ✅ Pass role restrictions to modal
          canCreateAdmin={canCreateAdmin}
          currentUserId={user?.id}
          // ✅ Pass available supervisors for the dropdown
          availableSupervisors={users.filter(u => 
            u.role === 'super_admin' || u.role === 'admin'
          )}
        />
      )}
    </div>
  );
};

export default AdminUsers;