import { useEffect, useState } from 'react';
import { financialsApi } from '../../services/api';
import type { FinancialSummary } from '../../types';
import Skeleton from '../ui/Skeleton';

const OwnerDashboard = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchSummary = async () => {
    try {
      setLoading(true);
      // ✅ CORRECT: Use specific method, NOT generic .get()
      const response = await financialsApi.getSummary(); // Returns AxiosResponse
      setSummary(response.data); // ✅ Access .data property
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchSummary();
}, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-500 mt-2">Financial oversight and team management</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.total_users || 0}
          </p>
        </div>
        
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-sm text-gray-500">Active Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.total_tasks || 0}
          </p>
        </div>
        
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.total_payment_usd || '$0.00'}
          </p>
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-xl font-bold text-gray-900">{summary.active_users}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Tasks</p>
              <p className="text-xl font-bold text-gray-900">{summary.completed_tasks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-xl font-bold text-gray-900">{summary.completion_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payment</p>
              <p className="text-xl font-bold text-gray-900">{summary.total_payment_usd}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;