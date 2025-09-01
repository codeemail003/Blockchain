#!/bin/bash

echo "🏥 Starting Pharbit Pharmaceutical Blockchain Server..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the real-blockchain directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing server first."
    echo "   You can kill the process using: lsof -ti:3000 | xargs kill -9"
    exit 1
fi

echo "🚀 Starting server on port 3000..."
echo "🌐 Dashboard will be available at: http://localhost:3000"
echo "📡 API will be available at: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

# Start the server
npm start