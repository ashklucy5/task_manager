const EmployeeDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-2">Your assigned tasks and performance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-500">My Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        
        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        
        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0%</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;