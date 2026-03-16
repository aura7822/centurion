#!/bin/bash

echo "========================================"
echo "  Downloading Centurion AI Models"
echo "========================================"

cd /home/aura/CENTURION/backend_cpp/models

# Function to download with wget
download_model() {
    echo "Downloading $1..."
    wget -q --show-progress "$2" -O "$1"
}

# Download FaceNet model (from deepface repository)
echo "📥 Downloading FaceNet embedding model..."
curl -L -o facenet_embedding.onnx "https://github.com/serengil/deepface_models/releases/download/v1.0/facenet512_weights.h5"
# Note: This is a .h5 file, you'll need to convert to ONNX

# Download age and gender model (OpenCV Zoo)
echo "📥 Downloading Age/Gender model..."
wget -q --show-progress "https://github.com/opencv/opencv_zoo/raw/master/models/age_gender_recognition/age_gender.onnx" -O age_gender_model.onnx

# For ethnicity model, we'll create a placeholder for now
echo "📥 Creating ethnicity model placeholder..."
cat > ethnicity_model.onnx << 'PLACEHOLDER'
This is a placeholder. Replace with actual ethnicity ONNX model.
You can use FairFace model: https://github.com/dchen236/FairFace
PLACEHOLDER

echo ""
echo "✅ Models downloaded!"
echo ""
echo "Note: The FaceNet model is in .h5 format and needs conversion to ONNX."
echo "Use the conversion script to convert it."
