// src/pages/CreateCompany.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { companiesApi } from '../services/api';
import Button from '../components/ui/Button';

interface FormData {
  // Company fields
  company_name: string;
  company_code: string;
  company_description: string;
  
  // Admin fields
  admin_email: string;
  admin_full_name: string;
  admin_password: string;
  admin_position: string;
  admin_salary: string;
  admin_payment_rate: string;
}

const CreateCompanyPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore(); // ✅ FIXED: Only use setUser
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
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
    
    // Auto-uppercase company code and position
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

      // ✅ FIXED: Access .data property from AxiosResponse
      const response = await companiesApi.createWithAdmin(payload);
      
      // ✅ FIXED: Access response.data.access_token and response.data.admin
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.admin);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Company</h1>
          <p className="text-gray-500 mt-2">Set up your organization and first administrator</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TechCorp Solutions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Code *
                </label>
                <input
                  type="text"
                  name="company_code"
                  value={formData.company_code}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="e.g., TECH1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Short code for your company (auto-uppercase)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="company_description"
                  value={formData.company_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your company"
                />
              </div>
            </div>
          </div>

          {/* Admin Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">First Administrator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@yourcompany.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the username for login
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="admin_full_name"
                  value={formData.admin_full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  name="admin_position"
                  value={formData.admin_position}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="e.g., CEO, CTO, MANAGER"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-converted to uppercase
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="•••••••• (min 8 chars)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary ($)
                </label>
                <input
                  type="number"
                  name="admin_salary"
                  value={formData.admin_salary}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Rate ($/hr)
                </label>
                <input
                  type="number"
                  name="admin_payment_rate"
                  value={formData.admin_payment_rate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              variant="primary"
              fullWidth
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
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
              className="text-blue-600 hover:text-blue-700 font-medium"
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