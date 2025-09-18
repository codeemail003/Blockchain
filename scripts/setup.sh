#!/bin/bash
# Pharbit Blockchain Setup Script
# Creates directory structure and installs dependencies

set -e

# Create core directories
mkdir -p real-blockchain/src/{blockchain,network,security,compliance,monitoring,pharma,integration,api}
mkdir -p tests/{unit,integration,performance,security}
mkdir -p configs/{dev,staging,prod}

# Initialize Node.js project if not already present
if [ ! -f package.json ]; then
  npm init -y
fi

# Install dependencies
npm install express ws crypto-js leveldb merkle-tree-gen axios
npm install --save-dev jest supertest eslint prettier nodemon

echo "Pharbit Blockchain setup complete."
