// src/pages/admin/UserManagement.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/api';
import type { User, UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface CreateUserForm {
  email: string;
  full_name: string;
  password: string;
  position: string;
  role: UserRole;
  parent_id?: string;
  company_id?: number;
  company_code?: string;
  salary?: string;
  payment_rate?: string;
}

const UserManagement = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'super_admin' | 'admin' | 'member' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    full_name: '',
    password: '',
    position: '',
    role: 'member',
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const canCreateUser = isSuperAdmin || user?.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers({ company_id: user?.company_id });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const extractCompanyIdFromParentId = (parentId: string): number | null => {
    const match = parentId.match(/^CA(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const openModal = (type: 'super_admin' | 'admin' | 'member') => {
    setModalType(type);
    setShowModal(true);
    setError('');
    setSuccess('');
    
    setFormData({
      email: '',
      full_name: '',
      password: '',
      position: '',
      role: type as UserRole,
      parent_id: '',
      company_id: type === 'super_admin' ? user?.company_id : undefined,
      company_code: type === 'member' ? '' : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (modalType === 'super_admin' && !formData.company_id) {
      setError('Company ID is required');
      return;
    }
    
    if (modalType === 'admin' && !formData.parent_id) {
      setError('Parent ID (SuperAdmin) is required');
      return;
    }
    
    if (modalType === 'member') {
      if (!formData.company_code) {
        setError('Company Code is required');
        return;
      }
      if (!formData.parent_id) {
        setError('Admin ID (Parent) is required');
        return;
      }
    }

    try {
      const payload: any = {
        email: formData.email,
        username: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        position: formData.position.toUpperCase(),
        role: formData.role,
      };

      if (modalType === 'super_admin') {
        payload.company_id = formData.company_id;
      } else if (modalType === 'admin' || modalType === 'member') {
        if (formData.parent_id) {
          const extractedCompanyId = extractCompanyIdFromParentId(formData.parent_id);
          payload.company_id = extractedCompanyId || user?.company_id;
          payload.parent_id = formData.parent_id;
        }
        if (modalType === 'member') {
          payload.company_code = formData.company_code;
        }
      }

      await usersApi.createUser(payload);

      setSuccess(`User created successfully!`);
      setShowModal(false);
      fetchUsers();
      
      setFormData({
        email: '',
        full_name: '',
        password: '',
        position: '',
        role: 'member',
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d: any) => d.msg);
        setError(messages.join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to create user');
      }
    }
  };

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
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage users in your company</p>
        </div>
        {canCreateUser && (
          <div className="flex space-x-2">
            {isSuperAdmin && (
              <Button onClick={() => openModal('super_admin')} className="bg-purple-600 hover:bg-purple-700">
                + Create Super Admin
              </Button>
            )}
            {isSuperAdmin && (
              <Button onClick={() => openModal('admin')} className="bg-blue-600 hover:bg-blue-700">
                + Create Admin
              </Button>
            )}
            <Button onClick={() => openModal('member')} className="bg-green-600 hover:bg-green-700">
              + Add Member
            </Button>
          </div>
        )}
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
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {u.id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {/* ✅ FIXED: Show avatar if available */}
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                    {u.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.parent_id ? (
                    <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {u.parent_id}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'super_admin' ? 'Create Super Admin' :
            modalType === 'admin' ? 'Create Admin' :
            'Add Member'
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="user@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g., CEO, DEVELOPER"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="•••••••• (min 8 chars)"
              />
            </div>

            {modalType === 'super_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company ID *</label>
                <input
                  type="number"
                  name="company_id"
                  value={formData.company_id || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The ID of the company this SuperAdmin will manage
                </p>
              </div>
            )}

            {modalType === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reports To (SuperAdmin ID) *
                </label>
                <input
                  type="text"
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g., CA1-S-000001"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the hierarchical ID of the SuperAdmin this Admin will report to
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Format: CAX-S-XXXXXX
                </p>
              </div>
            )}

            {modalType === 'member' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
                  <input
                    type="text"
                    name="company_code"
                    value={formData.company_code || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="e.g., TECH1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The company code where this member will join
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reports To (Admin ID) *
                  </label>
                  <input
                    type="text"
                    name="parent_id"
                    value={formData.parent_id || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="e.g., CA1-S-000001-A-00001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the hierarchical ID of the Admin this member will report to
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Format: CAX-S-XXXXXX-A-XXXXXX
                  </p>
                </div>
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                onClick={() => setShowModal(false)} 
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                {modalType === 'super_admin' ? 'Create Super Admin' :
                 modalType === 'admin' ? 'Create Admin' :
                 'Add Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;