#!/bin/bash
echo "Setting up Centurion Environment..."

# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
    cmake \
    libopencv-dev \
    libtorch-dev \
    nodejs \
    npm \
    mongodb \
    tor

# Setup Python environment for AI models
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision numpy opencv-python

echo "✓ Environment setup complete!"

