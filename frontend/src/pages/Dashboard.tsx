// src/pages/Dashboard.tsx

import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto animate-slide-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;