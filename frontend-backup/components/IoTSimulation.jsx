import React, { useState, useEffect } from 'react';
import { getIoTDevices, triggerDevice } from '../api/backendAPI';

const IoTSimulation = () => {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Main Door Lock', type: 'lock', status: 'locked', icon: '🔒' },
    { id: 2, name: 'Status LED', type: 'led', status: 'off', icon: '💡' },
    { id: 3, name: 'Alert Buzzer', type: 'buzzer', status: 'inactive', icon: '🔊' },
    { id: 4, name: 'Security Camera', type: 'camera', status: 'active', icon: '📹' }
  ]);

  const [recentTriggers, setRecentTriggers] = useState([]);

  const toggleDevice = (deviceId) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        let newStatus;
        switch(device.type) {
          case 'lock':
            newStatus = device.status === 'locked' ? 'unlocked' : 'locked';
            break;
          case 'led':
            newStatus = device.status === 'off' ? 'on' : 'off';
            break;
          case 'buzzer':
            newStatus = device.status === 'inactive' ? 'active' : 'inactive';
            break;
          default:
            newStatus = device.status;
        }
        
        // Log the trigger
        setRecentTriggers(prev => [{
          device: device.name,
          action: newStatus,
          time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));

        return { ...device, status: newStatus };
      }
      return device;
    }));
  };

  const simulateUnauthorized = () => {
    setDevices(prev => prev.map(device => {
      if (device.type === 'lock') return { ...device, status: 'locked' };
      if (device.type === 'led') return { ...device, status: 'on' };
      if (device.type === 'buzzer') return { ...device, status: 'active' };
      return device;
    }));

    setRecentTriggers(prev => [{
      device: 'SECURITY ALERT',
      action: 'Unauthorized Access Detected',
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 5));
  };

  const simulateAuthorized = () => {
    setDevices(prev => prev.map(device => {
      if (device.type === 'lock') return { ...device, status: 'unlocked' };
      if (device.type === 'led') return { ...device, status: 'on' };
      if (device.type === 'buzzer') return { ...device, status: 'inactive' };
      return device;
    }));

    setRecentTriggers(prev => [{
      device: 'ACCESS GRANTED',
      action: 'Authorized Face Detected',
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 5));
  };

  return (
    <div className="iot-simulation">
      <header className="iot-header">
        <h1>IoT Device Simulation</h1>
        <div className="simulation-controls">
          <button onClick={simulateAuthorized} className="control-button authorized">
            ✅ Simulate Authorized
          </button>
          <button onClick={simulateUnauthorized} className="control-button unauthorized">
            ⚠️ Simulate Unauthorized
          </button>
        </div>
      </header>

      <div className="devices-grid">
        {devices.map(device => (
          <div key={device.id} className={`device-card glass-effect ${device.status}`}>
            <div className="device-icon">{device.icon}</div>
            <h3>{device.name}</h3>
            <div className="device-status">
              Status: <span className={`status-badge ${device.status}`}>
                {device.status.toUpperCase()}
              </span>
            </div>
            <button 
              onClick={() => toggleDevice(device.id)}
              className="device-toggle"
            >
              Toggle
            </button>
          </div>
        ))}
      </div>

      <div className="activity-log glass-effect">
        <h2>Recent IoT Activity</h2>
        <div className="log-entries">
          {recentTriggers.map((trigger, index) => (
            <div key={index} className="log-entry">
              <span className="log-time">{trigger.time}</span>
              <span className="log-device">{trigger.device}</span>
              <span className="log-action">{trigger.action}</span>
            </div>
          ))}
          {recentTriggers.length === 0 && (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IoTSimulation;
