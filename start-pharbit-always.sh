#!/bin/bash

echo "🚀 Starting PharbitChain Server (Always Running Mode)"
echo "====================================================="

# Navigate to the blockchain directory
cd /workspace/real-blockchain

# Kill any existing processes
pkill -f "node src/index.js" 2>/dev/null || true

# Start the server with nohup (runs in background, survives terminal close)
nohup node src/index.js > /workspace/real-blockchain/logs/server.log 2>&1 &

# Get the process ID
SERVER_PID=$!

# Save the PID to a file for easy management
echo $SERVER_PID > /workspace/real-blockchain/logs/server.pid

echo "✅ Server started with PID: $SERVER_PID"
echo "📝 Logs: /workspace/real-blockchain/logs/server.log"
echo "🆔 PID file: /workspace/real-blockchain/logs/server.pid"

# Wait a moment and test
sleep 3
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server is running successfully!"
    echo "🌐 Web Interface: http://localhost:3000"
    echo "📡 API Base: http://localhost:3000/api"
else
    echo "⚠️ Server may still be starting up..."
    echo "Check logs: tail -f /workspace/real-blockchain/logs/server.log"
fi

echo ""
echo "🔧 Management Commands:"
echo "  Stop server: kill \$(cat /workspace/real-blockchain/logs/server.pid)"
echo "  View logs: tail -f /workspace/real-blockchain/logs/server.log"
echo "  Check status: curl http://localhost:3000/api/health"