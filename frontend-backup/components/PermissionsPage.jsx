import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PermissionsPage = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false,
    notifications: false
  });

  const requestPermission = async (type) => {
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissions(prev => ({ ...prev, camera: true }));
        stream.getTracks().forEach(track => track.stop());
      } else if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissions(prev => ({ ...prev, microphone: true }));
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error(`Permission denied for ${type}`);
    }
  };

  const allRequiredGranted = permissions.camera;

  return (
    <div className="permissions-page">
      <div className="permissions-container glass-effect">
        <h1>Permissions Required</h1>
        <p className="subtitle">Centurion needs the following permissions to function</p>

        <div className="permissions-grid">
          <div className={`permission-card ${permissions.camera ? 'granted' : ''}`}>
            <div className="permission-icon">📷</div>
            <h3>Camera</h3>
            <p>Required for facial recognition</p>
            {!permissions.camera ? (
              <button onClick={() => requestPermission('camera')} className="permission-button">
                Grant Access
              </button>
            ) : (
              <span className="granted-badge">✓ Granted</span>
            )}
          </div>

          <div className={`permission-card ${permissions.microphone ? 'granted' : ''}`}>
            <div className="permission-icon">🎤</div>
            <h3>Microphone</h3>
            <p>Optional for voice commands</p>
            {!permissions.microphone ? (
              <button onClick={() => requestPermission('microphone')} className="permission-button secondary">
                Grant Access
              </button>
            ) : (
              <span className="granted-badge">✓ Granted</span>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          disabled={!allRequiredGranted}
          className={`continue-button ${!allRequiredGranted ? 'disabled' : ''}`}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PermissionsPage;
