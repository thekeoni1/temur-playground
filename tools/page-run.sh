#!/bin/sh
# Drive one page check in headless Edge and return its posted report.
#
# THE TRAPS THIS SCRIPT EXISTS TO AVOID, all of them learned the hard way
# on this machine and none of them obvious from the outside:
#
#  1. NO --virtual-time-budget. It makes performance.now() virtual, which
#     collapses the relay probe and produces timings that are fiction.
#     Every measurement here is real time.
#  2. A FRESH, UNIQUE PROFILE per run, and only ever kill the process
#     using that profile path. A bare taskkill on msedge.exe would take
#     out the operator's own browser.
#  3. DELETE THE REPORT FIRST. A stale build/page-report-<mode>.json from
#     an earlier run reads exactly like a result, so a run that never
#     posted would look like a pass.
#  4. The local relay arrives as PAGE_DEV_RELAY at serve time; the
#     shipped page/_headers CSP is never edited to make a loop work.
#
# Usage: sh tools/page-run.sh <mode> <query> [waitSeconds]
#   e.g. sh tools/page-run.sh filecheck 'filecheck=1&offline=1' 60
set -e
cd "$(dirname "$0")/.."

MODE="$1"
QUERY="$2"
WAITS="${3:-60}"
EDGE="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PORT="${PAGE_PORT:-8088}"

[ -n "$MODE" ] || { echo "usage: page-run.sh <mode> <query> [waitSeconds]" >&2; exit 2; }

REPORT="build/page-report-$MODE.json"
rm -f "$REPORT"

# A Windows-side profile directory, unique per run, so the kill below can
# match on it and on nothing else.
STAMP=$(date +%s)-$$
WINPROF="C:\\Windows\\Temp\\pagerun-$STAMP"

URL="http://localhost:$PORT/?$QUERY"
echo "[page-run] mode=$MODE url=$URL profile=$WINPROF"

"$EDGE" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
  --user-data-dir="$WINPROF" \
  --disable-features=Translate,MediaRouter \
  "$URL" >/dev/null 2>&1 &

i=0
while [ "$i" -lt "$WAITS" ]; do
  if [ -f "$REPORT" ]; then break; fi
  i=$((i + 1))
  # A busy-free wait that does not need a foreground sleep.
  read -t 1 _ignored < /dev/null 2>/dev/null || true
  command sleep 1 2>/dev/null || true
done

# Kill ONLY the Edge that owns this run's profile path, by matching the
# command line. Never a bare image-name kill.
powershell.exe -NoProfile -Command \
  "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { \$_.CommandLine -like '*pagerun-$STAMP*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" \
  >/dev/null 2>&1 || true

if [ -f "$REPORT" ]; then
  echo "[page-run] report:"
  cat "$REPORT"
  echo
else
  echo "[page-run] NO REPORT POSTED for mode=$MODE after ${WAITS}s" >&2
  exit 1
fi
