#!/bin/bash

echo "🚀 Starting PharbitChain Blockchain Server..."
echo "=============================================="

# Navigate to the blockchain directory
cd /workspace/real-blockchain

# Check if server is already running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server is already running at http://localhost:3000"
    echo "🌐 Web Interface: http://localhost:3000"
    echo "📡 API Base: http://localhost:3000/api"
    exit 0
fi

# Start the server
echo "🔄 Starting server..."
node src/index.js &

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Server started successfully!"
        echo ""
        echo "🌐 Web Interface: http://localhost:3000"
        echo "📡 API Base: http://localhost:3000/api"
        echo "🔧 Health Check: http://localhost:3000/api/health"
        echo ""
        echo "Press Ctrl+C to stop the server"
        break
    fi
    sleep 2
done

# Keep the script running
wait