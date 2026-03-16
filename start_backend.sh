#!/bin/bash
cd ~/CENTURION/backend_cpp/build

export MONGO_URI="mongodb://localhost:27017"
export MONGO_DB="centurion"
export MODEL_DIR="/home/aura/CENTURION/backend_cpp/models/"
export LOG_DIR="/home/aura/CENTURION/logs/"
export SNAPSHOT_DIR="/home/aura/CENTURION/snapshots/"
export CENTURION_PORT="8080"
export GPIO_ENABLED="false"

mkdir -p /home/aura/CENTURION/logs /home/aura/CENTURION/snapshots

echo "[START] Launching Centurion backend..."
./centurion
