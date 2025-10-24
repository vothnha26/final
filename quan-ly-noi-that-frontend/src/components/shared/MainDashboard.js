import React from 'react';

const MainDashboard = ({ userRole }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Main Dashboard for {userRole}</h1>
      <p>This is a placeholder dashboard component.</p>
    </div>
  );
};

export default MainDashboard;



