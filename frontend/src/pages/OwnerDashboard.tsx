// src/pages/OwnerDashboard.tsx

const OwnerDashboard = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Owner Dashboard</h1>
        <p className="text-gray-500 text-lg">Financial oversight and team management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">1</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-3xl">
              👥
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center text-3xl">
              ✅
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">$0.00</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">$0.00</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-green-700 mt-1">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;