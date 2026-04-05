// src/pages/CreateCompany.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { companiesApi } from '../services/api';
import Button from '../components/ui/Button';

// ✅ REMOVED: Unused FormData interface

const CreateCompanyPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ Inline state with type inference
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    company_description: '',
    admin_email: '',
    admin_full_name: '',
    admin_password: '',
    admin_position: '',
    admin_salary: '',
    admin_payment_rate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'company_code' || e.target.name === 'admin_position') {
      value = value.toUpperCase();
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const validateForm = (): boolean => {
    if (!formData.company_name) {
      setError('Company name is required');
      return false;
    }
    if (!formData.company_code) {
      setError('Company code is required');
      return false;
    }
    if (!formData.admin_email || !formData.admin_email.includes('@')) {
      setError('Please enter a valid admin email');
      return false;
    }
    if (!formData.admin_full_name) {
      setError('Admin full name is required');
      return false;
    }
    if (!formData.admin_password || formData.admin_password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!formData.admin_position) {
      setError('Admin position is required');
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
      const payload = {
        company: {
          name: formData.company_name,
          code: formData.company_code,
          description: formData.company_description || undefined,
          company_code: formData.company_code || undefined,
        },
        admin: {
          email: formData.admin_email,
          full_name: formData.admin_full_name,
          password: formData.admin_password,
          position: formData.admin_position,
          salary: formData.admin_salary ? parseInt(formData.admin_salary) : undefined,
          payment_rate: formData.admin_payment_rate ? parseFloat(formData.admin_payment_rate) : undefined,
        },
      };

      const response = await companiesApi.createWithAdmin(payload);
      
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.admin);
      
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl p-10 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 glass-card mx-auto flex items-center justify-center mb-6 animate-float">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Company</h1>
          <p className="text-gray-500">Set up your organization and first administrator</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl mb-6 animate-slide-down">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Company Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                  placeholder="e.g., TechCorp Solutions"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Code *
                </label>
                <input
                  type="text"
                  name="company_code"
                  value={formData.company_code}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  className="input-modern w-full uppercase"
                  placeholder="e.g., TECH1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Short code for your company (auto-uppercase)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="company_description"
                  value={formData.company_description}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern w-full"
                  placeholder="Brief description of your company"
                />
              </div>
            </div>
          </div>

          {/* Admin Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              First Administrator
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                  placeholder="admin@yourcompany.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the username for login
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="admin_full_name"
                  value={formData.admin_full_name}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  name="admin_position"
                  value={formData.admin_position}
                  onChange={handleChange}
                  required
                  className="input-modern w-full uppercase"
                  placeholder="e.g., CEO, CTO, MANAGER"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-converted to uppercase
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="input-modern w-full"
                  placeholder="•••••••• (min 8 chars)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Salary ($)
                </label>
                <input
                  type="number"
                  name="admin_salary"
                  value={formData.admin_salary}
                  onChange={handleChange}
                  min="0"
                  className="input-modern w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Rate ($/hr)
                </label>
                <input
                  type="number"
                  name="admin_payment_rate"
                  value={formData.admin_payment_rate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-modern w-full"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              onClick={() => navigate('/login')}
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
              Create Company & Admin
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;