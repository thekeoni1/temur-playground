#!/bin/sh
# A SCRIPTED MODEL THAT RUNS INSIDE THE GUEST, served by busybox inetd on
# loopback. One HTTP request per connection, handed to us on stdin/stdout.
#
# WHY THIS EXISTS, AND WHY IT IS NOT A MOCK. The office-read proof has to
# show the EXTRACTED TEXT, and no temur surface ever prints tool output:
# the one-shot UI, the plain REPL and the TUI all print a tool's name and
# title and nothing else. The text exists in exactly one place, the
# request body temur sends to its provider, so the proof has to stand
# where that body arrives. `--mock` replaces the transport and throws the
# body away, which is why it cannot answer this question.
#
# WHY IN THE GUEST RATHER THAN ON THE HOST. The relay's allowlist is four
# provider hostnames (relay/relay.mjs, and G1 says it does not change for
# this milestone), so the guest cannot reach a bench server on the host.
# It can reach its own loopback without going near the relay at all, so
# the scripted model runs here, beside the thing under test, and the bytes
# it records are bytes the guest produced.
#
# It is dumb on purpose: a counter and two canned replies. Every line it
# emits is a fixed string, so it parses no JSON and cannot flatter the
# result by reinterpreting it.
#
#   call 1..N    ask for read(filePath=<Nth line of the plan>)
#   call N+1     stop, having said how many tool results it was handed
#
# The request bodies are saved into the share, where the harness reads
# them back over 9p and prints what temur sent. NOTHING HERE SHIPS: it is
# planted for one proof run that saves no state, and a run that saves
# state would be refused by the empty-at-snapshot assert for exactly the
# files this writes.
#
# Planted at /tmp/stub.sh; see tools/proof-office-read.mjs.

SHARE=/files
PLAN=/tmp/stub-plan
COUNT=/tmp/stub-count

N=$(cat "$COUNT" 2>/dev/null || echo 0)
N=$((N + 1))
echo "$N" > "$COUNT"

# --- read the request: headers, then exactly Content-Length bytes -------
CR=$(printf '\r')
len=0
while IFS= read -r line; do
  case "$line" in
    "" | "$CR") break ;;
    [Cc]ontent-[Ll]ength:*) len=$(echo "$line" | tr -dc '0-9') ;;
  esac
done
if [ "${len:-0}" -gt 0 ]; then
  # head -c, not dd bs=1: the body grows with every tool result carried
  # forward, and a byte-at-a-time read of 30 kB inside the emulator is
  # slow enough to look like a hang.
  head -c "$len" > "$SHARE/req-$N.json"
fi

# --- reply ---------------------------------------------------------------
d() { printf 'data: %s\n\n' "$1"; }

printf 'HTTP/1.1 200 OK\r\n'
printf 'Content-Type: text/event-stream\r\n'
printf 'Cache-Control: no-cache\r\n'
printf 'Connection: close\r\n'
printf '\r\n'

HEAD='{"id":"chatcmpl-gueststub","object":"chat.completion.chunk","created":1757462400,"model":"guest-stub","choices":[{"index":0,"delta":'
d "$HEAD"'{"role":"assistant","content":""},"finish_reason":null}]}'

TOTAL=$(wc -l < "$PLAN")
if [ "$N" -le "$TOTAL" ]; then
  F=$(sed -n "${N}p" "$PLAN")
  # The tool-call arguments are a JSON STRING containing JSON, so the
  # inner quotes are escaped here rather than by anything clever.
  A1='{"tool_calls":[{"index":0,"id":"call_'
  A2='","type":"function","function":{"name":"read","arguments":"{\"filePath\": \"'
  A3='\"}"}}]},"finish_reason":null}]}'
  d "$HEAD$A1$N$A2$F$A3"
  d "$HEAD"'{},"finish_reason":"tool_calls"}]}'
else
  # THIS body only. Every request carries the whole conversation, so
  # counting across all of them counts each result again for every later
  # turn (1+2+3+4+5 for a five-read plan) and reads like a bug.
  M=$(grep -o '"role":"tool"' "$SHARE/req-$N.json" 2>/dev/null | wc -l)
  d "$HEAD"'{"content":"STUB WAS HANDED '"$M"' TOOL RESULT(S)"},"finish_reason":null}]}'
  d "$HEAD"'{"content":"\nOFFICE-READ-PROOF-END"},"finish_reason":null}]}'
  d "$HEAD"'{},"finish_reason":"stop"}]}'
fi
d '[DONE]'
