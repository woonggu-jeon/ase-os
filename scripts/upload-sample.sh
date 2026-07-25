#!/usr/bin/env bash
#
# Upload a local video sample to the running API and print the response.
#
# Usage:
#   scripts/upload-sample.sh <path-to-video>
#
# The file can live anywhere on your machine; it is streamed to the API, which
# stores it under apps/api/uploads/ and records metadata in SQLite.
#
set -euo pipefail

FILE="${1:-}"
API="${API_ORIGIN:-http://localhost:3001}"

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 <path-to-video-file>" >&2
  exit 1
fi

echo "Uploading '$FILE' to $API/api/videos ..." >&2
curl -sS -F "video=@${FILE}" "${API}/api/videos" |
  { command -v jq >/dev/null 2>&1 && jq . || cat; }
echo
