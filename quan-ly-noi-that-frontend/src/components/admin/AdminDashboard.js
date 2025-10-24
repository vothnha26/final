import React from 'react';
import Dashboard from './system/Dashboard';

// AdminDashboard: Wrapper để dùng Dashboard với format giống staff
const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </div>
    </div>
  );
};

export default AdminDashboard;
