#!/bin/bash

echo "========================================"
echo "  Starting Centurion Backend Service"
echo "  Fedora Edition"
echo "========================================"

# Get the absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Project root: $PROJECT_ROOT"

# Check if backend_cpp exists
if [ ! -d "$PROJECT_ROOT/backend_cpp" ]; then
    echo "Error: backend_cpp directory not found"
    exit 1
fi

# Navigate to backend_cpp
cd "$PROJECT_ROOT/backend_cpp" || exit 1

# Create build directory if it doesn't exist
mkdir -p build
cd build || exit 1

# Clean previous build if any
rm -rf *

# Run CMake
echo "Configuring with CMake..."
cmake .. || { echo "CMake configuration failed"; exit 1; }

# Build the project
echo "Building project..."
make -j$(nproc) || { echo "Build failed"; exit 1; }

# Check if executable was created
if [ ! -f "centurion_backend" ]; then
    echo "Error: Executable not found after build"
    exit 1
fi

# Run the backend
echo -e "\nStarting Centurion Backend...\n"
./centurion_backend
