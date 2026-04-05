// src/components/tasks/AssignTaskModal.tsx

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usersApi, tasksApi } from '../../services/api';
import type { User, TaskPriority, TaskStatus } from '../../types';
import Button from '../ui/Button';

const MAX_IMAGES = 6;

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAssigneeId?: string;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

const AssignTaskModal = ({ isOpen, onClose, onSuccess, defaultAssigneeId }: AssignTaskModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'PENDING' as TaskStatus,
    assignee_id: defaultAssigneeId || '',
    due_date: '',
    requirements: '',
    estimated_hours: '',
    payment_amount: '',
    client_name: '',
    company_name: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
      if (defaultAssigneeId) {
        setFormData(prev => ({ ...prev, assignee_id: defaultAssigneeId }));
      }
    }
  }, [isOpen, defaultAssigneeId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const fetchTeamMembers = async () => {
    try {
      const response = await usersApi.getUsers();
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Image helpers ──────────────────────────────────────────────────────────

  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith('image/'));
    const slots = MAX_IMAGES - images.length;

    if (slots <= 0) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const toAdd = incoming.slice(0, slots);

    if (incoming.length > slots) {
      setError(`Only ${slots} more image${slots === 1 ? '' : 's'} can be added (max ${MAX_IMAGES}).`);
    } else {
      setError('');
    }

    const newPreviews: ImagePreview[] = toAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newPreviews]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = ''; // reset so same file can be re-added after removal
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.assignee_id || !formData.due_date) {
      setError('Title, Assignee, and Due Date are required.');
      return;
    }

    setLoading(true);
    try {
      // Send as FormData so images are included as multipart.
      // If your API still expects JSON, replace with the plain object approach.
      const payload = new FormData();
      payload.append('title', formData.title);
      if (formData.description) payload.append('description', formData.description);
      payload.append('category', formData.category || 'general');
      payload.append('priority', formData.priority);
      payload.append('status', formData.status);
      payload.append('assignee_id', formData.assignee_id);
      payload.append('due_date', new Date(formData.due_date).toISOString());
      if (formData.requirements) payload.append('requirements', formData.requirements);
      if (formData.estimated_hours) payload.append('estimated_hours', formData.estimated_hours);
      if (formData.payment_amount)
        payload.append('payment_amount', String(parseFloat(formData.payment_amount) * 100));
      if (formData.client_name) payload.append('client_name', formData.client_name);
      if (formData.company_name) payload.append('company_name', formData.company_name);
      images.forEach(img => payload.append('images', img.file));

      await tasksApi.createTask(payload);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      assignee_id: '',
      due_date: '',
      requirements: '',
      estimated_hours: '',
      payment_amount: '',
      client_name: '',
      company_name: '',
    });
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        style={{ zIndex: 99998 }}
        onClick={handleClose}
      />

      {/* Centered wrapper */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 animate-scale-in pointer-events-none"
        style={{ zIndex: 99999 }}
      >
        {/* Modal — flex column so header never scrolls */}
        <div
          className="glass-card w-full max-w-2xl flex flex-col pointer-events-auto"
          style={{ maxHeight: '90vh' }}
        >
          {/* ── Fixed header ── */}
          <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Assign New Task</h2>
              <p className="text-sm text-gray-500">Create and assign a task to a team member</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                  placeholder="e.g., Design Homepage Mockup"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern w-full"
                  placeholder="Describe the task details..."
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="input-modern w-full">
                    <option value="">Select</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} required className="input-modern w-full">
                    <option value="">Select</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date + Assign To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="input-modern w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To *</label>
                  <select name="assignee_id" value={formData.assignee_id} onChange={handleChange} required className="input-modern w-full">
                    <option value="">Select Team Member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.role.replace('_', ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern w-full"
                  placeholder="What needs to be done to complete this task..."
                />
              </div>

              {/* Estimated Hours + Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Hours</label>
                  <input type="number" name="estimated_hours" value={formData.estimated_hours} onChange={handleChange} min="0" step="0.5" className="input-modern w-full" placeholder="e.g., 8" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount ($)</label>
                  <input type="number" name="payment_amount" value={formData.payment_amount} onChange={handleChange} min="0" step="0.01" className="input-modern w-full" placeholder="e.g., 50.00" />
                  <p className="text-xs text-gray-500 mt-1">Amount to pay upon completion</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name</label>
                  <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} className="input-modern w-full" placeholder="Client or customer name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="input-modern w-full" placeholder="Client company name" />
                </div>
              </div>

              {/* ── Image Upload ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Attachments
                  </label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                    images.length >= MAX_IMAGES
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {images.length}/{MAX_IMAGES} images
                  </span>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {/* Drop zone — only visible when under the limit */}
                {images.length < MAX_IMAGES && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDragging ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <svg
                          className={`w-5 h-5 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {isDragging ? 'Drop images here' : 'Click or drag & drop images'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          PNG, JPG, GIF, WEBP · Up to {MAX_IMAGES - images.length} more
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview grid */}
                {images.length > 0 && (
                  <div className={`grid grid-cols-3 gap-3 ${images.length < MAX_IMAGES ? 'mt-3' : ''}`}>
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                      >
                        <img
                          src={img.previewUrl}
                          alt={`attachment-${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Dark overlay + remove button */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {/* File name bar */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-[10px] truncate">{img.file.name}</p>
                        </div>
                      </div>
                    ))}

                    {/* "Add more" tile */}
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 transition-all duration-200 text-gray-400 hover:text-blue-500"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-[11px] font-medium">Add more</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  fullWidth
                  disabled={loading}
                  className="btn-modern-secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  variant="primary"
                  fullWidth
                  className="btn-modern"
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </Button>
              </div>

            </form>
          </div> {/* end scrollable body */}
        </div>
      </div>
    </>,
    document.body
  );
};

export default AssignTaskModal;