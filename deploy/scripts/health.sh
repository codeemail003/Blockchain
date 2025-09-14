#!/usr/bin/env bash
set -euo pipefail

URL=${1:-http://localhost:3000/api/health}
echo "Checking health at $URL"
curl -fsS "$URL" | jq . || curl -fsS "$URL" || true

