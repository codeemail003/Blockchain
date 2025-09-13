#!/bin/bash

# PharbitChain Server Startup Script
cd /workspace/real-blockchain

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the server
exec node src/index.js