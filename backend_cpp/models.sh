#!/bin/bash

echo "=== Model File Check ==="
MODELS_DIR="$(cd "$(dirname "$0")" && pwd)/models"
cd "$MODELS_DIR" || { echo "❌ Models directory not found"; exit 1; }

echo "📂 Models directory: $MODELS_DIR"
echo ""

# Check FaceNet model
if [ -f "facenet_embedding.onnx" ]; then
    SIZE=$(stat -c%s "facenet_embedding.onnx" 2>/dev/null || stat -f%z "facenet_embedding.onnx" 2>/dev/null)
    echo "✅ facenet_embedding.onnx exists"
    echo "   Size: $SIZE bytes"
    if [ "$SIZE" -lt 100000000 ]; then
        echo "   ⚠️  Warning: File seems too small (should be ~248MB)"
    fi
else
    echo "❌ facenet_embedding.onnx MISSING"
fi

echo ""
echo "=== Current directory contents ==="
ls -la | grep -E "\.onnx$"

echo ""
echo "=== Testing file read permission ==="
if [ -r "facenet_embedding.onnx" ]; then
    echo "✅ File is readable"
else
    echo "❌ File is NOT readable"
fi

echo ""
echo "=== Program output (first few lines) ==="
cd ~/CENTURION/backend_cpp/build
./centurion 2>&1 | head -20
