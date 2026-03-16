import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { detectFace, getDemographics } from '../api/backendAPI';
import { processVideoFrame } from '../utils/webcam_utils';

const LiveFeed = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);
  const [currentDemographics, setCurrentDemographics] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndProcess();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const captureAndProcess = async () => {
    if (!webcamRef.current || isProcessing) return;

    setIsProcessing(true);
    const imageSrc = webcamRef.current.getScreenshot();

    try {
      // Detect faces
      const faces = await detectFace(imageSrc);
      setDetections(faces);

      if (faces.length > 0) {
        // Get demographics for first face
        const demographics = await getDemographics(imageSrc);
        setCurrentDemographics(demographics);

        // Draw bounding boxes on canvas
        drawDetections(faces);
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawDetections = (faces) => {
    if (!canvasRef.current || !webcamRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = webcamRef.current.video;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;

    faces.forEach(face => {
      ctx.strokeRect(face.x, face.y, face.width, face.height);
      
      // Add label
      ctx.fillStyle = 'rgba(217, 119, 6, 0.8)';
      ctx.fillRect(face.x, face.y - 30, 150, 30);
      ctx.fillStyle = 'black';
      ctx.font = '16px Inter';
      ctx.fillText(
        `${face.authorized ? '✓ Authorized' : '✗ Unknown'}`,
        face.x + 10,
        face.y - 10
      );
    });
  };

  return (
    <div className="live-feed-page">
      <div className="live-feed-header">
        <h1>Live Camera Feed</h1>
        <div className="feed-stats">
          <span>Faces Detected: {detections.length}</span>
          <span className={`status ${detections.some(f => !f.authorized) ? 'alert' : 'secure'}`}>
            {detections.some(f => !f.authorized) ? '⚠️ Unauthorized Detected' : '✅ All Clear'}
          </span>
        </div>
      </div>

      <div className="feed-container">
        <div className="video-wrapper">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            screenshotFormat="image/jpeg"
            className="webcam-feed-large"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user"
            }}
          />
          <canvas
            ref={canvasRef}
            className="detection-canvas"
          />
        </div>

        {currentDemographics && (
          <div className="demographics-panel glass-effect">
            <h3>Current Subject Demographics</h3>
            <div className="demographics-details">
              <div className="detail-row">
                <span>Age:</span>
                <span>{currentDemographics.age} years</span>
              </div>
              <div className="detail-row">
                <span>Gender:</span>
                <span>{currentDemographics.gender}</span>
              </div>
              <div className="detail-row">
                <span>Ethnicity:</span>
                <span>{currentDemographics.ethnicity}</span>
              </div>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ width: `${currentDemographics.confidence * 100}%` }}
                ></div>
                <span>Confidence: {Math.round(currentDemographics.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
