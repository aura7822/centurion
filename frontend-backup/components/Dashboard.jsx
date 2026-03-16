import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnalytics, fetchRecentLogs } from '../api/backendAPI';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAttempts: 0,
    authorized: 0,
    unauthorized: 0,
    successRate: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const analytics = await fetchAnalytics();
      const logs = await fetchRecentLogs();
      setStats(analytics);
      setRecentLogs(logs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading Centurion Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Security Dashboard</h1>
        <div className="header-actions">
          <Link to="/live-feed" className="nav-button">Live Feed</Link>
          <Link to="/iot-simulation" className="nav-button">IoT Control</Link>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-effect">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Attempts</h3>
            <p className="stat-value">{stats.totalAttempts}</p>
          </div>
        </div>

        <div className="stat-card glass-effect">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Authorized</h3>
            <p className="stat-value success">{stats.authorized}</p>
          </div>
        </div>

        <div className="stat-card glass-effect">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Unauthorized</h3>
            <p className="stat-value danger">{stats.unauthorized}</p>
          </div>
        </div>

        <div className="stat-card glass-effect">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Success Rate</h3>
            <p className="stat-value">{stats.successRate}%</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="recent-activity glass-effect">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentLogs.map((log, index) => (
              <div key={index} className={`activity-item ${log.authorized ? 'authorized' : 'unauthorized'}`}>
                <span className="activity-time">{log.timestamp}</span>
                <span className="activity-type">{log.type}</span>
                <span className="activity-status">{log.authorized ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="demographics-summary glass-effect">
          <h2>Demographics Summary</h2>
          <div className="demographics-stats">
            <div className="demographic-item">
              <span>Age Range</span>
              <span>25-35 (Most Common)</span>
            </div>
            <div className="demographic-item">
              <span>Gender</span>
              <span>60% Male / 40% Female</span>
            </div>
            <div className="demographic-item">
              <span>Ethnicity</span>
              <span>Diverse</span>
            </div>
          </div>
        </div>
      </div>

      <button className="download-btn glass-effect">
        📥 Download Summary Report
      </button>
    </div>
  );
};

export default Dashboard;
