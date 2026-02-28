const OwnerDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-500 mt-2">Financial oversight and team management</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">1</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl">
          <p className="text-sm text-gray-500">Active Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-xl">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">$0.00</p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;