#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
BACKUP_DIR="$ROOT_DIR/backups"
CONTAINER=${CONTAINER:-pharbitchain}
DATA_PATH=${DATA_PATH:-/app/blockchain-db}

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$BACKUP_DIR/blockchain-db-$STAMP.tar.gz"

echo "Creating backup from container $CONTAINER ($DATA_PATH) -> $ARCHIVE"
docker exec "$CONTAINER" tar -C / -czf - "${DATA_PATH#'/'}" > "$ARCHIVE"
ln -sf "$(basename "$ARCHIVE")" "$BACKUP_DIR/LATEST.tar.gz"
echo "Backup complete: $ARCHIVE"

