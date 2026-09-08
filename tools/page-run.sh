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
#     THE PROFILE DOES NOT ISOLATE DOWNLOADS BY ITSELF, and this comment
#     used to imply that it did. filecheck clicks a real download button
#     on purpose, and a fresh profile's default download directory is
#     still the OS Downloads folder, so three proof runs quietly left
#     three files in the operator's own Downloads. The profile is given
#     an explicit download directory below, inside itself, so a run
#     cleans up with the rest of the temp profile.
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

# THE PROFILE GOES IN THE USER'S OWN TEMP, not C:\Windows\Temp, which is
# where this script used to put it. That directory has ACLs a normal
# Windows process cannot fully use: PowerShell can create a folder there
# and then cannot delete it, and no profile this script named ever
# actually appeared on disk. So the browser was falling back to a default
# profile, which is the real reason downloads kept landing in the
# operator's Downloads folder no matter what this script called its
# profile. Asked for at run time rather than hardcoded.
WINTMP=$(powershell.exe -NoProfile -Command '[System.IO.Path]::GetTempPath()' 2>/dev/null | tr -d '\r\n')
[ -n "$WINTMP" ] || { echo "page-run: cannot read the Windows temp path" >&2; exit 1; }
WINPROF="${WINTMP}pagerun-$STAMP"
WSLPROF=$(printf '%s' "$WINPROF" | sed 's|\\|/|g; s|^[Cc]:|/mnt/c|')

# Send downloads INTO the throwaway profile. There is no command-line
# flag for this that Edge honours reliably, but a profile's Preferences
# file is read at startup, so the directory is set there before the
# browser is launched. Written through the WSL view of the same path the
# browser is given as a Windows path.
mkdir -p "$WSLPROF/Default"
# JSON, so every backslash in the Windows path has to be doubled. Written
# with python rather than by hand because getting that escaping wrong
# produces a file Edge silently discards, which looks exactly like the
# setting not working.
DLDIR="$WINPROF\\downloads"
python3 -c 'import json,sys; json.dump({"download":{"default_directory":sys.argv[1],"prompt_for_download":False},"savefile":{"default_directory":sys.argv[1]}}, open(sys.argv[2],"w"))' \
  "$DLDIR" "$WSLPROF/Default/Preferences"
mkdir -p "$WSLPROF/downloads"

URL="http://localhost:$PORT/?$QUERY"
# printf, not echo: the profile path contains backslashes and some
# shells' echo expands \t in "\Temp" into a tab, which prints a path
# that does not exist and sends the next reader chasing it.
printf '[page-run] mode=%s url=%s profile=%s\n' "$MODE" "$URL" "$WINPROF"

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
