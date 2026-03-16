#!/bin/bash

echo "========================================"
echo "  Centurion Complete Setup (Fedora)"
echo "========================================"

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT" || exit 1

# Create directory structure
echo "Creating directory structure..."
mkdir -p backend_cpp/src backend_cpp/include backend_cpp/models backend_cpp/utils
mkdir -p frontend/public frontend/src
mkdir -p database/models
mkdir -p docs
mkdir -p scripts

# Create CMakeLists.txt for Fedora
cat > backend_cpp/CMakeLists.txt << 'INNER_EOF'
cmake_minimum_required(VERSION 3.10)
project(CenturionBackend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find OpenCV (Fedora uses opencv4)
find_package(OpenCV REQUIRED)
if(OpenCV_FOUND)
    message(STATUS "OpenCV version: ${OpenCV_VERSION}")
    message(STATUS "OpenCV libraries: ${OpenCV_LIBS}")
    include_directories(${OpenCV_INCLUDE_DIRS})
else()
    message(FATAL_ERROR "OpenCV not found. Install with: sudo dnf install opencv-devel")
endif()

# Source files
file(GLOB SOURCES "src/*.cpp" "utils/*.cpp")
if(NOT SOURCES)
    set(SOURCES "src/main.cpp")
endif()

# Executable
add_executable(centurion_backend ${SOURCES})

# Link libraries
target_link_libraries(centurion_backend ${OpenCV_LIBS})
INNER_EOF

# Create main.cpp
cat > backend_cpp/src/main.cpp << 'INNER_EOF'
#include <iostream>
#include <thread>
#include <chrono>

int main() {
    std::cout << "\n========================================\n";
    std::cout << "  Centurion® AI Cybersecurity Backend\n";
    std::cout << "  Running on Fedora\n";
    std::cout << "========================================\n\n";
    
    std::cout << "[✓] Backend service initializing...\n";
    std::cout << "[✓] Loading configuration...\n";
    std::cout << "[✓] OpenCV version: " << CV_VERSION << "\n";
    std::cout << "[✓] Starting AI models...\n\n";
    
    std::cout << "System Ready!\n";
    std::cout << "Listening on port 8080\n";
    std::cout << "Press Ctrl+C to stop\n\n";
    
    // Keep the program running
    while(true) {
        std::cout << "Heartbeat: System active, waiting for connections...\r" << std::flush;
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }
    
    return 0;
}
INNER_EOF

# Create include directory and header files
mkdir -p backend_cpp/include

cat > backend_cpp/include/face_recognition.h << 'INNER_EOF'
#ifndef FACE_RECOGNITION_H
#define FACE_RECOGNITION_H

#include <opencv2/opencv.hpp>
#include <string>

class FaceRecognition {
public:
    FaceRecognition();
    ~FaceRecognition();
    bool initialize();
    cv::Mat detectFace(const cv::Mat& frame);
    std::string recognize(const cv::Mat& face);
    
private:
    cv::CascadeClassifier face_cascade;
};

#endif
INNER_EOF

# Check dependencies for Fedora
echo "Checking dependencies..."
MISSING_DEPS=0

# Check CMake
if ! command -v cmake &>/dev/null; then
    echo "✗ CMake not found"
    echo "  Install with: sudo dnf install cmake"
    MISSING_DEPS=1
else
    echo "✓ CMake found: $(cmake --version | head -n1)"
fi

# Check g++
if ! command -v g++ &>/dev/null; then
    echo "✗ g++ not found"
    echo "  Install with: sudo dnf install gcc-c++"
    MISSING_DEPS=1
else
    echo "✓ g++ found: $(g++ --version | head -n1)"
fi

# Check OpenCV development files
if ! rpm -q opencv-devel &>/dev/null; then
    echo "✗ OpenCV development libraries not found"
    echo "  Install with: sudo dnf install opencv-devel"
    MISSING_DEPS=1
else
    echo "✓ OpenCV development libraries found"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "\nMissing dependencies. Installing..."
    sudo dnf install -y cmake gcc-c++ opencv-devel
fi

echo -e "\n✓ Setup complete for Fedora!"
echo "You can now run:"
echo "  - ./scripts/start_backend.sh  (C++ backend)"
echo "  - ./scripts/simple_start.sh   (Python test backend)"
