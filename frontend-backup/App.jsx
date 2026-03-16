import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import PermissionsPage from './components/PermissionsPage';
import Dashboard from './components/Dashboard';
import LiveFeed from './components/LiveFeed';
import IoTSimulation from './components/IoTSimulation';
import './styles/main.css';
import './styles/animations.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedLang = localStorage.getItem('language') || 'en';
    setTheme(savedTheme);
    setLanguage(savedLang);
    
    // Apply theme
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    
    // Check if permissions were already granted
    const permissions = localStorage.getItem('permissionsGranted');
    if (permissions === 'true') {
      setPermissionsGranted(true);
    }
  }, []);

  return (
    <Router>
      <div className={`app ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
        <Routes>
          <Route path="/" element={
            permissionsGranted ? 
            <Navigate to="/dashboard" /> : 
            <LoginPage setPermissionsGranted={setPermissionsGranted} />
          } />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-feed" element={<LiveFeed />} />
          <Route path="/iot-simulation" element={<IoTSimulation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
