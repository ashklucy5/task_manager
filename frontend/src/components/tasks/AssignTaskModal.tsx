// src/components/tasks/AssignTaskModal.tsx

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersApi, tasksApi } from '../../services/api';
import type { User, TaskCategory, TaskPriority } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface FormData {
  title: string;
  description: string;
  category: TaskCategory | '';
  priority: TaskPriority | '';
  due_date: string;
  assignee_id: string;  // ✅ Must be string (hierarchical ID)
  requirements: string;
  estimated_hours: string;
  payment_amount: string;
}

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignTaskModal = ({ isOpen, onClose, onSuccess }: AssignTaskModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    priority: '',
    due_date: '',
    assignee_id: '',  // ✅ Initialize as empty string
    requirements: '',
    estimated_hours: '',
    payment_amount: '',
  });

  // Check if user is SuperAdmin for financial fields
  const isOwner = user?.role === 'super_admin';

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setFetchingMembers(true);
      
      const response = await usersApi.getUsers({ 
        company_id: user?.company_id 
      });
      
      // Filter only active members (not admins for task assignment)
      const members = response.data.filter(
        u => u.role === 'member' && u.is_active !== false
      );
      
      setTeamMembers(members);
      
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      setError('Failed to load team members');
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('🔵 [AssignTask] Form submitted');
    console.log('🔵 [AssignTask] Form data:', formData);

    // ✅ Validate required fields
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (!formData.priority) {
      setError('Priority is required');
      return;
    }
    if (!formData.due_date) {
      setError('Due date is required');
      return;
    }
    
    // ✅ CRITICAL: Validate assignee_id is a non-empty string
    if (!formData.assignee_id || formData.assignee_id.trim() === '') {
      setError('Please select a team member to assign this task to');
      return;
    }

    // ✅ Ensure assignee_id is a string (not number, null, or undefined)
    if (typeof formData.assignee_id !== 'string') {
      setError('Invalid assignee selection');
      return;
    }

    setLoading(true);

    try {
      // ✅ Build payload with proper types
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category.toLowerCase(),  // Backend expects lowercase
        priority: formData.priority.toLowerCase(),  // Backend expects lowercase
        status: 'pending',  // Default status (lowercase for Pydantic enum)
        // ✅ CRITICAL: Send assignee_id as STRING (hierarchical ID)
        assignee_id: String(formData.assignee_id).trim(),  // Ensure it's a non-empty string
        due_date: new Date(formData.due_date).toISOString(),
        requirements: formData.requirements?.trim() || undefined,
        estimated_hours: formData.estimated_hours 
          ? parseFloat(formData.estimated_hours) 
          : undefined,
        // Financial fields (Owner only)
        ...(isOwner && {
          payment_amount: formData.payment_amount 
            ? Math.round(parseFloat(formData.payment_amount) * 100) 
            : undefined,
        }),
      };

      console.log('🔵 [AssignTask] Sending payload:', {
        ...payload,
        payment_amount: payload.payment_amount ? '***' : undefined,
      });
      
      await tasksApi.createTask(payload);
      
      console.log('✅ [AssignTask] Task created successfully!');
      onSuccess?.();
      onClose();
      
    } catch (err: any) {
      console.error('❌ [AssignTask] API Error:', err);
      console.error('❌ [AssignTask] Error response:', err.response);
      console.error('❌ [AssignTask] Error status:', err.response?.status);
      console.error('❌ [AssignTask] Error data:', err.response?.data);
      
      // Handle 422 validation errors
      if (err.response?.status === 422) {
        const detail = err.response?.data?.detail;
        console.error('❌ [AssignTask] Validation errors:', detail);
        
        if (Array.isArray(detail)) {
          const messages = detail.map((d: any) => {
            const field = d.loc?.[d.loc.length - 1] || d.loc?.join('.');
            return `${field}: ${d.msg}`;
          });
          setError(messages.join('; '));
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Validation failed. Please check all required fields.');
        }
      } 
      // Handle other error types
      else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Backend may not be running or CORS not configured.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please check backend logs.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to create task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Task title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Task details..."
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="MARKETING">Marketing</option>
              <option value="SALES">Sales</option>
              <option value="HR">HR</option>
              <option value="FINANCE">Finance</option>
              <option value="OPERATIONS">Operations</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due Date & Assignee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
            <select
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
              required
              disabled={loading || fetchingMembers || teamMembers.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {fetchingMembers ? 'Loading...' : teamMembers.length === 0 ? 'No members' : 'Select member'}
              </option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {/* ✅ member.id is the full hierarchical string ID */}
                  {member.full_name} {member.position ? `(${member.position})` : ''}
                </option>
              ))}
            </select>
            {fetchingMembers && (
              <p className="text-xs text-gray-500 mt-1">Loading team members...</p>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows={2}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="What needs to be done..."
          />
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
          <input
            type="number"
            name="estimated_hours"
            value={formData.estimated_hours}
            onChange={handleChange}
            min="0"
            step="0.5"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="e.g., 8"
          />
        </div>

        {/* Payment Amount (Owner only) */}
        {isOwner && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount ($)
            </label>
            <input
              type="number"
              name="payment_amount"
              value={formData.payment_amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., 50.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount to pay upon completion
            </p>
          </div>
        )}

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
            disabled={fetchingMembers || teamMembers.length === 0}
          >
            {fetchingMembers ? 'Loading Members...' : 'Assign Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignTaskModal;