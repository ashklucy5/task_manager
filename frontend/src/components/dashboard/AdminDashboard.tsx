const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">Team oversight and task management</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-500">Team Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-sm text-gray-500">Active Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        
        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
          <p className="text-sm text-gray-500">Overdue Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;