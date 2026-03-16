import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ language, apiKey }) => {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-gold-400 mb-8">Dashboard</h1>
      <p className="text-gray-400">Dashboard component - Coming soon</p>
      <Link to="/live-feed" className="text-gold-400 hover:underline">Go to Live Feed →</Link>
    </div>
  );
};

export default Dashboard;

