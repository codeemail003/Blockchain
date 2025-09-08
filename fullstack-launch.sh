#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
REAL_DIR="$ROOT_DIR/real-blockchain"
PHARMA_DIR="$ROOT_DIR/pharbit-contracts"
LOG_DIR="$ROOT_DIR/.fullstack-logs"
mkdir -p "$LOG_DIR"

print_header() {
  echo "=============================================="
  echo "$1"
  echo "=============================================="
}

check_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ Missing required command: $1"; exit 1; }
}

wait_for_http() {
  local url="$1"; local retries="${2:-30}"; local delay="${3:-0.5}"
  for _ in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    sleep "$delay"
  done
  return 1
}

port_in_use() {
  local port="$1"
  lsof -Pi ":$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

start_real_blockchain() {
  print_header "Starting Real Blockchain (port 3000)"
  check_cmd node
  cd "$REAL_DIR"
  if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies (real-blockchain)..."
    npm install
  fi
  if port_in_use 3000; then
    echo "⚠️  Port 3000 already in use. Skipping start."
  else
    echo "🚀 Launching real-blockchain..."
    nohup node src/index.js > "$LOG_DIR/real-blockchain.log" 2>&1 &
    echo $! > "$LOG_DIR/real-blockchain.pid"
  fi
  echo "⏳ Waiting for health..."
  if wait_for_http "http://localhost:3000/api/health" 60 0.5; then
    echo "✅ Real Blockchain ready: http://localhost:3000"
  else
    echo "❌ Real Blockchain failed to start. See $LOG_DIR/real-blockchain.log"
    exit 1
  fi
}

stop_real_blockchain() {
  if [ -f "$LOG_DIR/real-blockchain.pid" ]; then
    PID=$(cat "$LOG_DIR/real-blockchain.pid" || true)
    if [ -n "${PID:-}" ] && ps -p "$PID" >/dev/null 2>&1; then
      echo "🛑 Stopping real-blockchain (pid $PID)"
      kill "$PID" || true
      sleep 1
    fi
    rm -f "$LOG_DIR/real-blockchain.pid"
  fi
  pkill -f "real-blockchain/src/index.js" >/dev/null 2>&1 || true
}

start_pharma_backend() {
  print_header "Starting Pharma Contracts Backend (port 4000)"
  check_cmd node
  cd "$PHARMA_DIR/backend"
  if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies (pharma backend)..."
    npm install
  fi
  if port_in_use 4000; then
    echo "⚠️  Port 4000 already in use. Skipping start."
  else
    echo "🚀 Launching pharma backend..."
    nohup npm start > "$LOG_DIR/pharma-backend.log" 2>&1 &
    echo $! > "$LOG_DIR/pharma-backend.pid"
  fi
  echo "⏳ Waiting for backend..."
  if wait_for_http "http://localhost:4000/api/health" 60 0.5; then
    echo "✅ Pharma Backend ready: http://localhost:4000"
  else
    echo "❌ Pharma Backend failed to start. See $LOG_DIR/pharma-backend.log"
    exit 1
  fi
}

stop_pharma_backend() {
  if [ -f "$LOG_DIR/pharma-backend.pid" ]; then
    PID=$(cat "$LOG_DIR/pharma-backend.pid" || true)
    if [ -n "${PID:-}" ] && ps -p "$PID" >/dev/null 2>&1; then
      echo "🛑 Stopping pharma backend (pid $PID)"
      kill "$PID" || true
      sleep 1
    fi
    rm -f "$LOG_DIR/pharma-backend.pid"
  fi
  pkill -f "pharbit-contracts/backend/server.js" >/dev/null 2>&1 || true
}

open_urls() {
  echo "URLs:"
  echo "- Real Blockchain API: http://localhost:3000/api"
  echo "- Real Blockchain Health: http://localhost:3000/api/health"
  echo "- Pharma Backend API: http://localhost:4000/api"
}

show_logs() {
  echo "Log files in: $LOG_DIR"
  ls -la "$LOG_DIR" || true
  echo "Tail example: tail -f $LOG_DIR/real-blockchain.log $LOG_DIR/pharma-backend.log"
}

usage() {
  cat <<EOF
Fullstack Launcher

Usage:
  $0 start-all        # Start real-blockchain (3000) and pharma backend (4000)
  $0 start-real       # Start only real-blockchain
  $0 start-pharma     # Start only pharma backend
  $0 stop             # Stop all started services
  $0 status           # Show health of services
  $0 logs             # Show log file locations

Notes:
  - Requires Node.js and npm
  - Logs: $LOG_DIR
  - Real blockchain guide: real-blockchain/REAL_BLOCKCHAIN_GUIDE.md
EOF
}

status() {
  echo "Real Blockchain:"
  if curl -fsS http://localhost:3000/api/health >/dev/null 2>&1; then echo "  ✅ up"; else echo "  ❌ down"; fi
  echo "Pharma Backend:"
  if curl -fsS http://localhost:4000/api/health >/dev/null 2>&1; then echo "  ✅ up"; else echo "  ❌ down"; fi
}

case "${1:-}" in
  start-all)
    start_real_blockchain
    start_pharma_backend
    open_urls
    ;;
  start-real)
    start_real_blockchain
    open_urls
    ;;
  start-pharma)
    start_pharma_backend
    open_urls
    ;;
  stop)
    stop_real_blockchain
    stop_pharma_backend
    echo "✅ All services stopped"
    ;;
  status)
    status
    ;;
  logs)
    show_logs
    ;;
  *)
    usage
    ;;
esac

