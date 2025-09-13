#!/bin/bash

# PharbitChain Server Monitor Script
# This script checks if the server is running and restarts it if needed

LOG_FILE="/workspace/real-blockchain/logs/monitor.log"
PID_FILE="/workspace/real-blockchain/logs/server.pid"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Check if server is running
if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        # Server is running, check if it's responding
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log "✅ Server is running and healthy (PID: $PID)"
            exit 0
        else
            log "⚠️ Server process exists but not responding, restarting..."
            kill $PID 2>/dev/null
            sleep 2
        fi
    else
        log "⚠️ Server process not found, restarting..."
    fi
else
    log "⚠️ No PID file found, starting server..."
fi

# Start the server
cd /workspace/real-blockchain
nohup node src/index.js > /workspace/real-blockchain/logs/server.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > $PID_FILE

log "🔄 Server restarted with PID: $NEW_PID"

# Wait and verify
sleep 5
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Server restarted successfully"
else
    log "❌ Failed to restart server"
fi