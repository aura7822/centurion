#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import json
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Simulated database
authorized_users = {
    "user1": {"name": "John Doe", "role": "admin"},
    "user2": {"name": "Jane Smith", "role": "user"}
}

logs = []

@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'service': 'Centurion AI Cybersecurity',
        'version': '1.0.0',
        'timestamp': time.time()
    })

@app.route('/health')
def health():
    return jsonify({'healthy': True, 'timestamp': datetime.now().isoformat()})

@app.route('/api/face-recognition', methods=['POST'])
def face_recognition():
    try:
        data = request.json
        image_data = data.get('image', '')
        
        # Simulate face recognition processing
        time.sleep(0.5)  # Simulate processing time
        
        # Mock response
        response = {
            'success': True,
            'authorized': np.random.choice([True, False], p=[0.8, 0.2]),  # 80% authorized
            'confidence': np.random.uniform(0.85, 0.99),
            'demographics': {
                'age': np.random.randint(20, 60),
                'gender': np.random.choice(['male', 'female']),
                'ethnicity': np.random.choice(['asian', 'white', 'black', 'hispanic'])
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Log the attempt
        log_entry = {
            'timestamp': response['timestamp'],
            'authorized': response['authorized'],
            'confidence': response['confidence'],
            'demographics': response['demographics']
        }
        logs.append(log_entry)
        
        # Keep only last 100 logs
        if len(logs) > 100:
            logs.pop(0)
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    return jsonify({
        'logs': logs,
        'total': len(logs),
        'authorized': sum(1 for log in logs if log['authorized']),
        'unauthorized': sum(1 for log in logs if not log['authorized'])
    })

@app.route('/api/demographics-stats', methods=['GET'])
def demographics_stats():
    if not logs:
        return jsonify({})
    
    stats = {
        'avg_age': sum(log['demographics']['age'] for log in logs) / len(logs),
        'gender_distribution': {},
        'ethnicity_distribution': {}
    }
    
    # Calculate distributions
    for log in logs:
        gender = log['demographics']['gender']
        ethnicity = log['demographics']['ethnicity']
        
        stats['gender_distribution'][gender] = stats['gender_distribution'].get(gender, 0) + 1
        stats['ethnicity_distribution'][ethnicity] = stats['ethnicity_distribution'].get(ethnicity, 0) + 1
    
    return jsonify(stats)

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Centurion AI Backend Server (Development)")
    print("="*50)
    print("✓ Flask server starting...")
    print("✓ API endpoints available:")
    print("   - GET  /              : Server info")
    print("   - GET  /health        : Health check")
    print("   - POST /api/face-recognition : Face recognition")
    print("   - GET  /api/logs      : Access logs")
    print("   - GET  /api/demographics-stats : Statistics")
    print("\n🚀 Server running on http://localhost:8080")
    print("Press Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=8080, debug=True)
