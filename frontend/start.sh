#!/usr/bin/env bash
# ============================================================
# The Centurion® — Frontend Setup Script
# Run from ~/CENTURION/frontend/
# ============================================================
set -e

echo ""
echo "_______________________________________________________"
echo "  INITIALISING FORNTEND..."
echo "  CENTURION® FRONTEND SETUP"
echo "_______________________________________________________"
echo ""

# ── Install Node.js if needed ─────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[SETUP] Installing Node.js..."
  sudo dnf install -y nodejs npm
fi
echo "[OK] Node $(node -v) | npm $(npm -v)"

# ── Install dependencies ──────────────────────────────────────
echo "[SETUP] Installing dependencies..."
npm install

# ── Check backend is running ──────────────────────────────────
echo "[SETUP] Checking backend connection..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo "[OK] Backend is running on :8080"
else
  echo "[WARN] Backend not detected on :8080"
  echo "       Start it with: cd ~/CENTURION/backend_cpp/build && ./centurion &"
fi

echo ""
echo "════════════════════════════════════════"
echo "  Starting Centurion® Frontend on :3000"
echo "  Open: http://localhost:3000"
echo "════════════════════════════════════════"
echo ""

REACT_APP_BACKEND_URL=http://localhost:8080 npm start
