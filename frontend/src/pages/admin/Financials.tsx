// src/pages/admin/Financials.tsx

import { useEffect, useState } from 'react';
import { financialsApi } from '../../services/api';
import type { FinancialSummary } from '../../types';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatDate';

const AdminFinancials = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await financialsApi.getSummary();
        setSummary(response.data);
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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-gray-500 mt-1">Company financial performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Total Payment</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.total_payment_usd || '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.completion_rate || 0}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary?.active_users || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancials;