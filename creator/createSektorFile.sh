#!/bin/bash
# Creates a sektor and writes it to sektor_<name>.json in the repository root.
# Usage: ./createSektorFile.sh <name>
set -euo pipefail

SEKTOR_NAME="${1:-}"
if [ -z "$SEKTOR_NAME" ]; then
  echo "Usage: $0 <name>" >&2
  exit 1
fi

CREATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(dirname "$CREATOR_DIR")"
OUTPUT_FILE="$REPOSITORY_ROOT/sektor_${SEKTOR_NAME}.json"

cd "$CREATOR_DIR"
source ~/.nvm/nvm.sh
nvm use --silent >/dev/null 2>&1

SEKTOR_JSON=$(npx tsx createSektor.ts)

echo "$SEKTOR_JSON" > "$OUTPUT_FILE"
echo "Created $OUTPUT_FILE"
