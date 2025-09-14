#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./setup-fabric-assets.sh /path/to/fabric-samples/test-network
#
# Copies connection profile and an enrolled app user cert/key from Fabric test-network
# into this repo's backend and enables Fabric in the backend .env.

if [ $# -lt 1 ]; then
  echo "Usage: $0 /absolute/path/to/fabric-samples/test-network" >&2
  exit 1
fi

TEST_NET_DIR="$1"
if [ ! -d "$TEST_NET_DIR" ]; then
  echo "❌ Not a directory: $TEST_NET_DIR" >&2
  exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$ROOT_DIR/pharbit-contracts/backend"
FABRIC_DIR="$BACKEND_DIR/fabric"
WALLET_DIR="$FABRIC_DIR/wallet"

mkdir -p "$WALLET_DIR"

# Prefer Org1
ORG1_DIR="$TEST_NET_DIR/organizations/peerOrganizations/org1.example.com"
CONN_PROFILE="$ORG1_DIR/connection-org1.json"

if [ ! -f "$CONN_PROFILE" ]; then
  echo "❌ connection-org1.json not found at: $CONN_PROFILE" >&2
  echo "Make sure you've run: ./network.sh up createChannel -c mychannel -ca -s couchdb" >&2
  exit 1
fi

# Try to find an enrolled app user under a temp enroll dir
# If you followed FABRIC_README.md, you likely have an appUser enroll folder at:
#   $TEST_NET_DIR/test-network/appUser
# Otherwise, try to infer from MSP tree (keystore/signcerts)

APPUSER_CERT_CANDIDATE=$(ls -1 "$TEST_NET_DIR"/appUser/signcerts/*.pem 2>/dev/null | head -n1 || true)
APPUSER_KEY_CANDIDATE=$(ls -1 "$TEST_NET_DIR"/appUser/keystore/* 2>/dev/null | head -n1 || true)

if [ -z "${APPUSER_CERT_CANDIDATE}" ] || [ -z "${APPUSER_KEY_CANDIDATE}" ]; then
  # Fallback: look under Org1 MSP for a sample user (NOT recommended for prod)
  APPUSER_CERT_CANDIDATE=$(ls -1 "$ORG1_DIR"/users/*/msp/signcerts/*.pem 2>/dev/null | head -n1 || true)
  APPUSER_KEY_CANDIDATE=$(ls -1 "$ORG1_DIR"/users/*/msp/keystore/* 2>/dev/null | head -n1 || true)
fi

if [ -z "${APPUSER_CERT_CANDIDATE}" ] || [ -z "${APPUSER_KEY_CANDIDATE}" ]; then
  echo "❌ Could not find enrolled app user cert/key. See FABRIC_README.md to register and enroll appUser." >&2
  exit 1
fi

cp "$CONN_PROFILE" "$FABRIC_DIR/connection-org1.json"
cp "$APPUSER_CERT_CANDIDATE" "$WALLET_DIR/appUser-cert.pem"
cp "$APPUSER_KEY_CANDIDATE" "$WALLET_DIR/appUser-key.pem"

# Ensure .env exists and enable FABRIC_* variables
if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  else
    touch "$BACKEND_DIR/.env"
  fi
fi

# Update .env
sed -i "s@^#\s*FABRIC_CONNECTION_PROFILE=.*@FABRIC_CONNECTION_PROFILE=./fabric/connection-org1.json@" "$BACKEND_DIR/.env" || true
grep -q '^FABRIC_CONNECTION_PROFILE=' "$BACKEND_DIR/.env" || echo 'FABRIC_CONNECTION_PROFILE=./fabric/connection-org1.json' >> "$BACKEND_DIR/.env"

sed -i "s@^FABRIC_CHANNEL=.*@FABRIC_CHANNEL=mychannel@" "$BACKEND_DIR/.env" || true
grep -q '^FABRIC_CHANNEL=' "$BACKEND_DIR/.env" || echo 'FABRIC_CHANNEL=mychannel' >> "$BACKEND_DIR/.env"

sed -i "s@^FABRIC_CHAINCODE=.*@FABRIC_CHAINCODE=basic@" "$BACKEND_DIR/.env" || true
grep -q '^FABRIC_CHAINCODE=' "$BACKEND_DIR/.env" || echo 'FABRIC_CHAINCODE=basic' >> "$BACKEND_DIR/.env"

sed -i "s@^FABRIC_CERT=.*@FABRIC_CERT=./fabric/wallet/appUser-cert.pem@" "$BACKEND_DIR/.env" || true
grep -q '^FABRIC_CERT=' "$BACKEND_DIR/.env" || echo 'FABRIC_CERT=./fabric/wallet/appUser-cert.pem' >> "$BACKEND_DIR/.env"

sed -i "s@^FABRIC_KEY=.*@FABRIC_KEY=./fabric/wallet/appUser-key.pem@" "$BACKEND_DIR/.env" || true
grep -q '^FABRIC_KEY=' "$BACKEND_DIR/.env" || echo 'FABRIC_KEY=./fabric/wallet/appUser-key.pem' >> "$BACKEND_DIR/.env"

echo "✅ Copied Fabric assets into backend and enabled .env"
echo " - Connection profile: $FABRIC_DIR/connection-org1.json"
echo " - Wallet cert:       $WALLET_DIR/appUser-cert.pem"
echo " - Wallet key:        $WALLET_DIR/appUser-key.pem"
echo " - .env updated:      $BACKEND_DIR/.env"

echo "Next: restart backend and test:\n  cd $BACKEND_DIR && npm start\n  curl http://localhost:4000/fabric/health"

