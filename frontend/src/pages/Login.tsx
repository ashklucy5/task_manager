// src/pages/Login.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// import Button from '../components/ui/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="glass-card w-full max-w-md p-10 animate-scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 glass-card mx-auto flex items-center justify-center mb-6 animate-float">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to NexusFlow AI</p>
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              className="input-modern w-full"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="input-modern w-full"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-modern w-full py-4 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Options */}
        <div className="mt-8 space-y-4">
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/50 text-gray-500 backdrop-blur-sm rounded-full">
                or
              </span>
            </div>
          </div>

          {/* Create Company Button */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/companies/new')}
              className="w-full glass-panel py-3.5 px-4 rounded-xl font-semibold text-gray-700 hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🏢</span>
              Create New Company
            </button>

            {/* Register for Existing Company */}
            <p className="text-center text-sm text-gray-500">
              Need to be a member?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Register as Member
              </button>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-100">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-semibold">💡 Tip:</span> First time? Create a new company to get started. 
            Joining an existing team? Use the register link with your company code and admin ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;