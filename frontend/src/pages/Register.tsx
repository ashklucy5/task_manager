// src/pages/RegisterMinimal.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';

const RegisterMinimal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_code: '',
    parent_id: '',
    email: '',
    full_name: '',
    password: '',
    position: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-uppercase specific fields
    const uppercaseFields = ['company_code', 'position', 'parent_id'];
    
    setFormData(prev => ({
      ...prev,
      [name]: uppercaseFields.includes(name) ? value.toUpperCase() : value
    }));
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    return null;
  };

  const extractCompanyId = (code: string) => {
    const match = code.toUpperCase().match(/^CA(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { company_code, parent_id, email, full_name, password, position } = formData;

    if (!company_code || !parent_id || !email || !full_name || !password || !position) {
      setError('All fields are required.');
      return;
    }

    const company_id = extractCompanyId(company_code);
    if (!company_id) {
      setError('Invalid company code. Example: CA1');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        username: email,
        full_name,
        password,
        position,
        role: 'member',
        company_id,
        parent_id,
      };

      const response = await authApi.register(payload);
      localStorage.setItem('access_token', response.data.access_token);
      
      setSuccess('✅ Registration successful! Redirecting...');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Your Company
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register as a team member
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Code *
            </label>
            <input
              name="company_code"
              value={formData.company_code}
              onChange={handleChange}
              required
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="e.g., CA1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: CA followed by number
            </p>
          </div>

          {/* Admin ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin ID *
            </label>
            <input
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
              required
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
              placeholder="e.g., CA1-S-000001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hierarchical ID of your supervisor
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <input
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              placeholder="e.g., DEVELOPER"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={loading || !!success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">
              8+ chars, uppercase, lowercase, number
            </p>
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              disabled={!!success}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white"
            >
              {loading ? 'Registering...' : success ? '✓ Success!' : 'Register as Member'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          {success ? (
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterMinimal;