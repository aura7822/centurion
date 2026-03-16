#!/usr/bin/env python3
"""
Convert FaceNet Keras model to ONNX format
"""

import tensorflow as tf
import tf2onnx
import os

def convert_facenet_to_onnx():
    """Convert FaceNet from h5 to ONNX format"""
    
    print("Converting FaceNet to ONNX...")
    
    # Paths
    h5_path = "../models/facenet_embedding.onnx"  # This is actually a .h5 file
    onnx_path = "../models/facenet_embedding.onnx"  # Will overwrite
    
    # Check if file exists
    if not os.path.exists(h5_path):
        print(f"Error: {h5_path} not found. Download it first.")
        return False
    
    try:
        # Load Keras model
        print("Loading Keras model...")
        model = tf.keras.models.load_model(h5_path)
        
        # Convert to ONNX
        print("Converting to ONNX...")
        spec = (tf.TensorSpec((None, 160, 160, 3), tf.float32, name="input"),)
        output_path = onnx_path
        
        model.output_names = ['embedding']
        tf2onnx.convert.from_keras(model, input_signature=spec, output_path=output_path)
        
        print(f"✅ Model converted and saved to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error converting model: {e}")
        return False

if __name__ == "__main__":
    convert_facenet_to_onnx()
