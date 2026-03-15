// src/components/users/CreateUserModal.tsx

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../services/api';
import type { UserCreate, UserRole, User } from '../../types';  // ✅ ADDED: User type import
import Button from '../ui/Button';
import Modal from '../ui/Modal';

// ✅ UPDATED: Add role restriction props
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  canCreateAdmin?: boolean;  // Whether creator can create Admin roles
  currentUserId?: string;    // Current user's ID for auto-setting parent_id
  availableSupervisors?: User[];  // List of admins/super_admins for parent_id select
}

const CreateUserModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  canCreateAdmin = false,
  currentUserId,
  availableSupervisors = []  // ✅ Default to empty array
}: CreateUserModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ FIXED: Use correct UserRole type and default values
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    position: '',
    role: 'member' as UserRole,
    parent_id: currentUserId || user?.id || '',  // ✅ Fallback chain for parent_id
    salary: '',
    payment_rate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.name === 'position') {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.full_name) {
      setError('Full name is required');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!formData.position) {
      setError('Position is required');
      return false;
    }
    // ✅ Validate parent_id is provided
    if (!formData.parent_id) {
      setError('Please select a supervisor');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload: UserCreate = {
        email: formData.email,
        username: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        position: formData.position,
        role: formData.role,
        company_id: user?.company_id || 1,
        parent_id: formData.parent_id,  // ✅ Now guaranteed to be a string
        salary: formData.salary ? parseInt(formData.salary) : undefined,
        payment_rate: formData.payment_rate ? parseInt(formData.payment_rate) : undefined,
      };

      await usersApi.createUser(payload);
      onSuccess?.();
      onClose();
      
      // Reset form with fallback for parent_id
      setFormData({
        email: '',
        full_name: '',
        password: '',
        position: '',
        role: 'member',
        parent_id: currentUserId || user?.id || '',  // ✅ Fallback chain
        salary: '',
        payment_rate: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: Filter available supervisors based on role being created
  const getAvailableSupervisors = () => {
    return availableSupervisors.filter(supervisor => {
      // If creating Admin, only show SuperAdmins as supervisors
      if (formData.role === 'admin') {
        return supervisor.role === 'super_admin';
      }
      // If creating Member, show both Admins and SuperAdmins
      return supervisor.role === 'admin' || supervisor.role === 'super_admin';
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Email */}
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

        {/* Full Name */}
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

        {/* Position */}
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

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={!canCreateAdmin}
          >
            {canCreateAdmin && (
              <>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
              </>
            )}
            <option value="member">Member</option>
          </select>
          {!canCreateAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              Admins can only create Member accounts
            </p>
          )}
        </div>

        {/* Parent/Supervisor (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reports To *
          </label>
          <select
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select supervisor</option>
            {/* ✅ FIXED: Map available supervisors to options */}
            {getAvailableSupervisors().map(supervisor => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.full_name} ({supervisor.role.replace('_', ' ')})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select who this user will report to
          </p>
          {getAvailableSupervisors().length === 0 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ No available supervisors. Contact your SuperAdmin.
            </p>
          )}
        </div>

        {/* Password */}
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
            placeholder="••••••••"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button 
            type="button" 
            onClick={onClose} 
            variant="secondary"
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={loading} 
            variant="primary" 
            fullWidth
            disabled={getAvailableSupervisors().length === 0}
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;