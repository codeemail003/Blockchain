#!/usr/bin/env bash
set -euo pipefail

ARCHIVE=${1:-}
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 /path/to/backup.tar.gz" >&2
  exit 1
fi

CONTAINER=${CONTAINER:-pharbitchain}
DATA_PATH=${DATA_PATH:-/app/blockchain-db}

echo "Stopping container $CONTAINER"
docker stop "$CONTAINER" || true

echo "Restoring $ARCHIVE into $CONTAINER:$DATA_PATH"
docker run --rm -i \
  -v pharbitchain_data:$DATA_PATH \
  -v "$ARCHIVE":/backup.tar.gz:ro \
  alpine sh -c "rm -rf $DATA_PATH/* && tar -C / -xzf /backup.tar.gz"

echo "Starting container $CONTAINER"
docker start "$CONTAINER"
echo "Restore complete"

