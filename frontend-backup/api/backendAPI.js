import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Simulated API responses for development
const simulateResponse = (data, delay = 500) => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

export const detectFace = async (imageData) => {
  try {
    // In production, send to backend
    // const response = await axios.post(`${API_BASE_URL}/face-detection`, { image: imageData });
    // return response.data;
    
    // Simulated response for development
    return simulateResponse([
      {
        x: 200,
        y: 150,
        width: 200,
        height: 200,
        authorized: Math.random() > 0.3,
        confidence: 0.95
      }
    ]);
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
};

export const getDemographics = async (imageData) => {
  try {
    // Simulated demographics
    return simulateResponse({
      age: Math.floor(Math.random() * 30) + 20,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      ethnicity: ['asian', 'white', 'black', 'hispanic'][Math.floor(Math.random() * 4)],
      confidence: 0.85 + Math.random() * 0.1
    });
  } catch (error) {
    console.error('Demographics error:', error);
    return null;
  }
};

export const fetchAnalytics = async () => {
  return simulateResponse({
    totalAttempts: 156,
    authorized: 142,
    unauthorized: 14,
    successRate: 91
  });
};

export const fetchRecentLogs = async () => {
  return simulateResponse([
    { timestamp: '14:32:45', type: 'Face Detection', authorized: true },
    { timestamp: '14:31:22', type: 'Face Detection', authorized: true },
    { timestamp: '14:29:18', type: 'Face Detection', authorized: false },
    { timestamp: '14:28:03', type: 'Face Detection', authorized: true },
    { timestamp: '14:26:47', type: 'Face Detection', authorized: true }
  ]);
};

export const getIoTDevices = async () => {
  return simulateResponse([
    { id: 1, name: 'Main Door Lock', type: 'lock', status: 'locked' },
    { id: 2, name: 'Status LED', type: 'led', status: 'off' },
    { id: 3, name: 'Alert Buzzer', type: 'buzzer', status: 'inactive' }
  ]);
};

export const triggerDevice = async (deviceId, action) => {
  return simulateResponse({ success: true, deviceId, action });
};
