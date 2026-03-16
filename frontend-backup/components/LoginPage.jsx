import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { requestCameraPermission } from '../utils/webcam_utils';

const LoginPage = ({ setPermissionsGranted }) => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setCameraPermission(false);
    }
  };

  const handlePermissions = async () => {
    setError('');
    setIsDetecting(true);
    
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      setCameraPermission(true);
      setMicrophonePermission(true);
      
      // Simulate face detection (will be replaced with actual AI detection)
      setTimeout(() => {
        setIsDetecting(false);
        if (termsAccepted) {
          localStorage.setItem('permissionsGranted', 'true');
          setPermissionsGranted(true);
          navigate('/dashboard');
        }
      }, 2000);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError('Camera access is required to use Centurion');
      setIsDetecting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="animated-bg">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-card glass-effect">
        <div className="logo-section">
          <img src="/assets/images/centurion_logo.png" alt="Centurion Logo" className="logo" />
          <h1 className="title">Centurion®</h1>
          <p className="subtitle">AI-Powered Cybersecurity & Access Dashboard</p>
        </div>

        {cameraPermission === null ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Checking camera access...</p>
          </div>
        ) : (
          <div className="permissions-section">
            <div className="webcam-preview">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                screenshotFormat="image/jpeg"
                className="webcam-feed"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />
              {isDetecting && (
                <div className="detection-overlay">
                  <div className="detection-animation">
                    <div className="scan-line"></div>
                    <p>AI Face Detection in Progress...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="permission-items">
              <div className={`permission-item ${cameraPermission ? 'granted' : 'required'}`}>
                <span className="permission-icon">📷</span>
                <span className="permission-label">Camera Access</span>
                <span className="permission-status">
                  {cameraPermission ? '✓ Granted' : '✗ Required'}
                </span>
              </div>

              <div className={`permission-item ${microphonePermission ? 'granted' : 'optional'}`}>
                <span className="permission-icon">🎤</span>
                <span className="permission-label">Microphone Access</span>
                <span className="permission-status">
                  {microphonePermission ? '✓ Granted' : '○ Optional'}
                </span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <label className="terms-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>I accept the Terms of Service and Privacy Policy</span>
            </label>

            <button
              onClick={handlePermissions}
              disabled={!cameraPermission || !termsAccepted || isDetecting}
              className={`proceed-button ${(!cameraPermission || !termsAccepted || isDetecting) ? 'disabled' : ''}`}
            >
              {isDetecting ? 'Detecting Face...' : 'Proceed to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
