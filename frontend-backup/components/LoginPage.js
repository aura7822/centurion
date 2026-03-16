import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';

const LoginPage = ({ language }) => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const translations = {
    en: {
      title: 'Centurion® Access Control',
      subtitle: 'AI-Powered Cybersecurity Dashboard',
      camera: 'Camera Access',
      microphone: 'Microphone Access',
      terms: 'I accept the Terms of Service and Privacy Policy',
      proceed: 'Proceed to Dashboard',
      requesting: 'Requesting permissions...',
      detecting: 'Detecting face...'
    },
    fr: {
      title: 'Contrôle d\'accès Centurion®',
      subtitle: 'Tableau de bord de cybersécurité IA',
      camera: 'Accès caméra',
      microphone: 'Accès microphone',
      terms: 'J\'accepte les conditions d\'utilisation',
      proceed: 'Accéder au tableau de bord',
      requesting: 'Demande de permissions...',
      detecting: 'Détection du visage...'
    },
    // Add more languages as needed
  };

  const t = translations[language] || translations.en;

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

  const requestPermissions = async () => {
    setIsDetecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      setCameraPermission(true);
      setMicrophonePermission(true);
      
      // Simulate face detection
      setTimeout(() => {
        setIsDetecting(false);
        if (termsAccepted) {
          navigate('/dashboard');
        }
      }, 2000);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Permission denied:', err);
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-600/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="glass-card max-w-md w-full p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-400 mb-2">{t.title}</h1>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>

        {cameraPermission === null ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">{t.requesting}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Webcam Preview */}
            <div className="live-feed-container">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                screenshotFormat="image/jpeg"
                className="w-full h-48 object-cover"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
              />
              {isDetecting && (
                <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse text-gold-400 text-lg mb-2">🔍</div>
                    <p className="text-gold-400">{t.detecting}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Permission Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <span className="text-gray-300">{t.camera}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  cameraPermission ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {cameraPermission ? '✓ Granted' : '✗ Required'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg">
                <span className="text-gray-300">{t.microphone}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  microphonePermission ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {microphonePermission ? '✓ Granted' : 'Optional'}
                </span>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-center space-x-3 text-gray-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 text-gold-500 bg-dark-700 border-gray-600 rounded focus:ring-gold-500 focus:ring-2"
              />
              <span className="text-sm">{t.terms}</span>
            </label>

            {/* Proceed Button */}
            <button
              onClick={requestPermissions}
              disabled={!cameraPermission || !termsAccepted || isDetecting}
              className={`glow-button w-full ${(!cameraPermission || !termsAccepted || isDetecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDetecting ? t.detecting : t.proceed}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
