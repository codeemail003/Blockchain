#!/usr/bin/env bash
set -euo pipefail

docker compose build pharbitchain
docker compose up -d pharbitchain
docker compose ps

