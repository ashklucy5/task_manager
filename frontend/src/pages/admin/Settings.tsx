// src/pages/admin/Settings.tsx

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

const AdminSettings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Add settings save logic here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-500 mt-1">Manage company configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Code
            </label>
            <input
              type="text"
              value={user?.company_code || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company ID
            </label>
            <input
              type="text"
              value={user?.company_id || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;