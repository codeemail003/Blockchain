#!/bin/bash

echo "🛑 Stopping PharbitChain Server"
echo "==============================="

# Check if PID file exists
if [ -f /workspace/real-blockchain/logs/server.pid ]; then
    PID=$(cat /workspace/real-blockchain/logs/server.pid)
    
    if ps -p $PID > /dev/null 2>&1; then
        echo "🔄 Stopping server (PID: $PID)..."
        kill $PID
        
        # Wait for graceful shutdown
        sleep 2
        
        # Force kill if still running
        if ps -p $PID > /dev/null 2>&1; then
            echo "⚡ Force stopping server..."
            kill -9 $PID
        fi
        
        echo "✅ Server stopped successfully"
    else
        echo "⚠️ Server is not running (PID file exists but process not found)"
    fi
    
    # Remove PID file
    rm -f /workspace/real-blockchain/logs/server.pid
else
    echo "⚠️ No PID file found. Trying to kill any running processes..."
    pkill -f "node src/index.js"
    echo "✅ Any running processes have been stopped"
fi