// src/pages/Analytics.tsx

const AnalyticsPage = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics</h1>
        <p className="text-gray-500 text-lg">Performance metrics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-3xl">
              📊
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0%</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center text-3xl">
              📈
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Team Productivity</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">0%</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center text-3xl">
              ⚡
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Performance Overview</h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium">Analytics charts will appear here</p>
            <p className="text-sm mt-2">Start completing tasks to see your performance metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;