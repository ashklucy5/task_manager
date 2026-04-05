// src/pages/RegisterMinimal.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
// import Button from '../components/ui/Button';

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
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Compact Glass Card - 25% larger */}
      <div className="glass-card w-full max-w-2xl p-8 animate-scale-in">
        {/* Header - Compact but larger */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">N</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Join Company</h1>
          </div>
          <p className="text-sm text-gray-500">Register as team member</p>
        </div>

        {/* Alerts - Compact but larger */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2.5 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form - Compact Grid with 25% more spacing */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Company Code + Admin ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Code *</label>
              <input
                name="company_code"
                value={formData.company_code}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4 uppercase"
                placeholder="CA1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin ID *</label>
              <input
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4 uppercase font-mono"
                placeholder="CA1-S-000001"
              />
            </div>
          </div>

          {/* Row 2: Email + Full Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Row 3: Position + Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Position *</label>
              <input
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4 uppercase"
                placeholder="DEVELOPER"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading || !!success}
                className="input-modern w-full text-sm py-2.5 px-4"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Password Requirements - Compact */}
          <p className="text-xs text-gray-400 text-center -mt-1">
            8+ chars, uppercase, lowercase, number
          </p>

          {/* Submit Button - Full Width, larger */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="btn-modern w-full py-3 text-sm mt-3 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </span>
            ) : success ? '✓ Success!' : 'Register as Member'}
          </button>
        </form>

        {/* Footer - Compact but larger */}
        <div className="mt-5 text-center">
          {success ? (
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          ) : (
            <p className="text-sm text-gray-500">
              Have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Help Tip - Minimal but larger */}
        <div className="mt-4 p-3 bg-blue-50/30 rounded-lg border border-blue-100">
          <p className="text-xs text-gray-500 text-center">
            💡 Contact admin for company code & ID
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterMinimal;