export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error('Camera permission denied:', err);
    return false;
  }
};

export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error('Microphone permission denied:', err);
    return false;
  }
};

export const getVideoConstraints = (facingMode = 'user', width = 640, height = 480) => {
  return {
    width: { ideal: width },
    height: { ideal: height },
    facingMode
  };
};

export const captureFrame = (webcamRef) => {
  if (!webcamRef.current) return null;
  return webcamRef.current.getScreenshot();
};

export const processVideoFrame = (videoElement, canvasElement) => {
  if (!videoElement || !canvasElement) return null;
  
  const context = canvasElement.getContext('2d');
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  return canvasElement.toDataURL('image/jpeg');
};

