#!/bin/bash
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?使い方: _tools/game-harness.sh <ゲームフォルダ>}"

exec node "$ROOT/_tools/game-harness.mjs" "$TARGET"
