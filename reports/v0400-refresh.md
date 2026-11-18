# P18: the served snapshots move to temur v0.40.0

## Verdict

Both served snapshots are rebuilt on the released v0.40.0 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P17 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p17-* becomes state-p18-*, and every live reference moves
in the same commit. Nothing was released between v0.39.0 and v0.40.0
(the kickoff's statement; this pass did not list the releases).
P17 ran on the desktop; this refresh runs on the laptop, as P10 to P16
did.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd and to P16's captured landings, and
the page's selftest frames are equal to P17's committed report. None of
the notices watched for appears. Counted with a digit lookahead, no
older version string is inside either raw image while the new one is.
The page harness reads back the exact byte counts of the two NEW
assets, which is what shows the p18 pair is served rather than a
cached p17 one.

v0.40.0 carries T69, and with it a tools-drop probe that a keyless
openai-compat session sends at start. Planning predicted from the
source that it would land on the proofs' scripted model as a turn and
shift the plan by one read. It did: run first with the stub unchanged,
the office-read proof failed 8 checks and the first request file was
the probe. One change to tools/guest-stub-model.sh refuses it the way
the stub already refuses any non-turn, and every proof then passed on
both tiers. The stub is planted per proof run and is inside neither
image, so no served byte changes because of it.

The F29 footer did NOT move. On both tiers it reads, verbatim, as at
P16 and P17:

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)

The file-cap gate passed on both tiers, so the caps do not move. The
PDF read took 5.0 s offline and 5.3 s networked against 6.0 s and 6.0 s
on v0.39.0, and the worse-tier PDF floor is 50.0 MB against 49.9 MB;
page/app.js's measurement comment was rewritten to those figures. On
this laptop the big-file spreadsheet is P16's document again (16,317,903
B, 148,801 rows), not P17's, as the kickoff expected, and the comment
says so.

Both builds landed on raw sizes no earlier refresh recorded, and the
tiers swapped size families against P17: networked 37,630,688 B (below
every networked figure P13 to P17 recorded) and offline 39,088,856 B. Both are
well inside the limit and both are reported, not stopped on.
The sweep's only nonzero pattern is R4 on binary and kernel content,
under the standing P9 ruling: all twelve controls fire and every
authored surface is 0.
This commit is not a decision to publish.

## The build input

    file    temur-v0.40.0-i686-unknown-linux-musl
    sha256  38ba7b97f93a5b43cf315f949832435f5425f305eeb781c87e42b54f2ca086ae
    size    8,385,332 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-11-18; the i686 asset arrived in 0.62 s at HTTP
200 with the full byte count on the first fetch. The hash is checked
FIVE ways before the binary is used:

    computed from the downloaded file   38ba7b97...86ae
    the published SHA256SUMS line       38ba7b97...86ae
    the value planning supplied         38ba7b97...86ae
    sha256sum -c                        temur-v0.40.0-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.40.0`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.39.0,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.39.0  temur 0.40.0

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 f490cc6821d5226ea7b95b3ea34fe75e55004b8e10e3fe1c9ba22a90b884324a,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim. Its i686 line:

    38ba7b97f93a5b43cf315f949832435f5425f305eeb781c87e42b54f2ca086ae  temur-v0.40.0-i686-unknown-linux-musl

v0.39.0 was 8,368,620 bytes, so the binary GREW by 16,712 bytes. The
download arrived mode 644 and was set to 755; the v0.39.0 binary was
removed by name with `git rm`. No desktop soak exists for this release.

## What did NOT change

                           this build (P18)   P17 record
    kit/bzImage-p6         680f7536...8868    680f7536...8868
    kit/rootfs.cpio.gz     4d5cda4a...1e2e    4d5cda4a...1e2e
    tools/guest/motd       d72dfa14...f2a7    d72dfa14...f2a7
    tools/guest/console.sh d3a8f46c...e4bd    d3a8f46c...e4bd
    tools/guest/S30files   1a932892...2993    1a932892...2993

Full values:

    kit/bzImage-p6         680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz     4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd       d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files   1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

All five hash identically to the values in reports/v0390-refresh.md
lines 107-111, so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally,
once, from before the networked builds until before the selftest page
check, so its one log covers the builds, the proofs, the allowlist
probe and four of the five page checks. The privacy and refusal probes
start relays of their own and report their own logs.

The two step files the generators write, build/steps-p18-net-snap.json
and build/steps-p18-offline-snap.json, are byte-identical to P17's
committed steps-p17-* files: the renamed generators changed their
header and output path only.

`npm ci` was not run: node_modules was present and package-lock.json
did not change between c8cc992 and 73ed3bc (0 files). The installed
packages are v86 0.5.458+gd96be77, wisp-js 0.4.1 and xterm 6.0.0, as at
P17. package-lock.json is not in this diff.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes, extracted unanchored: the text between the login line
and the first prompt is 486 bytes on each tier, equal to
tools/guest/motd, equal between the tiers, and equal to P16's captured
landings, which are on this laptop (P17's captures stayed on the
desktop).

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED. The page's own frames agree: selftest's
frameAfterLaunch, frameAfterTyping and frameAfterExit are equal to
P17's committed report, and landingcheck reports cleanLanding true and
wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Each restored
    snapshot was asked directly with a plain `temur < /dev/null` start
    (no `timeout`; the probe also asked the guest, and `type timeout`
    answers "timeout: not found"). The start ran on both tiers: the
    offline tier printed its header ("temur 0.40.0 (model=local,
    thinking=false)"), the compact-profile notice and "> bye"; the
    networked tier printed temur's no-config guidance. The files named
    *temur* outside /proc and /sys are /etc/temur-motd and /usr/bin/temur
    on the networked tier, and those two plus /root/.config/temur on the
    offline tier: the overlay's own files and no session or state file.
(b) INIT'S REASONING-MODEL LINE: not seen. Neither the build nor any
    proof runs init against a model, and no such line appeared in any
    capture.
(c) TRUNCATION WORDING: none in either build log or either plain start.
    The F29 footer appears only inside the big-file proof's read, below.
(e) THE TOOLS-DROP WARNING: no line beginning "[!] the server at" and no
    "drop tool definitions" wording in either build log, in either
    plain start, or in any proof's captured turn. On the offline tier
    the configured server is not listening, so the probe is refused at
    connect; the networked tier lands with no config and its build's
    doctor step uses an anthropic config, where the probe never runs.

    Counted, case-insensitive, for (a), (b), (c) and (e): "archived as",
    "truncat", "reasoning", "[!] the server at" and "drop tool
    definitions" occur 0 times in both build logs. LIVE CONTROL: the
    same five greps over a copy of a build log with two planted lines:
    1 more each. The plain-start probe's four regexes were also run
    against planted strings inside the probe, and all four fired.
(d) THE VERSION STRINGS INSIDE THE MACHINE, counted in the raw images
    before gzip, plainly and ANCHORED with a digit lookahead
    (`grep -a -o -P '<v>(?!\d)'`).

                                 0.38.4 0.38.5 0.38.6 0.39.0 0.38.44 0.40.0
                                 pl an  pl an  pl an  pl an          pl an (control)
        build/state-p18-net.bin   3  0   0  0   0  0   0  0     3     1  1
        build/state-p18-offline   3  0   0  0   0  0   0  0     3     1  1
        (the v0.40.0 binary       3  0   0  0   0  0   0  0     3     1  1)

    These are planning's measured figures for the published asset,
    row for row. Every anchored count for 0.38.4 to 0.39.0 is 0, the
    plain "0.39.0" is 0 ("0.39.00" is 0 too), and the plain "0.38.4"
    count equals the "0.38.44" count in each image (3 = 3), so no old
    binary or old file is inside the machine. The control, 0.40.0, is 1
    plain and 1 anchored in each image and in the binary ("0.40.00" is
    0): the one copy of /usr/bin/temur accounts for every occurrence.
    The lookahead was checked: it counts "x0.39.0y" once and
    "x0.39.00y" not at all.

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p18-net.bin      37,630,688 B   15,951,590 B   15.21 MiB
    state-p18-offline.bin  39,088,856 B   17,367,298 B   16.56 MiB

    (p17, for comparison: 39,379,676 / 17,636,024 B = 16.82 MiB net,
                          37,679,836 / 15,837,865 B = 15.10 MiB offline)

    sha256  state-p18-net.bin.gz      7100e1ce19e31c8829220656502ea53578b54a91821fc5e0aae5ebf4ef75d211
    sha256  state-p18-offline.bin.gz  73ef947619ab43783478812deec8de22dfcdd5fddc5d1084c402d5e711020caa

Both are inside the limit with more than 8 MiB to spare. Each staged
.gz, gunzipped, is byte-identical to the build/state-p18-*.bin every
proof ran against.

The tiers swapped size families against P17, and both landed on raw
sizes no earlier refresh recorded:

- networked, raw 37,630,688 B: in the SMALLER networked family, and
  below every networked figure P13 to P17 recorded (the P6-era page
  snapshots were smaller still; reports/P6.md): 348,160 B under P15's
  37,978,848 and 389,116 B under P13's 38,019,804; 1,748,988 B under
  P17's 39,379,676 and 1,744,892 B under P16's 39,375,580. Gzipped it
  is 1,684,434 B smaller than P17's and 160,856 B smaller than P15's.
- offline, raw 39,088,856 B: in the LARGER offline family, 102,396 B
  above P16's and P15's 38,986,460, 1,409,020 B above P17's 37,679,836
  and 1,449,980 B above P13's 37,638,876. Gzipped it is 1,529,433 B
  larger than P17's and 25,718 B larger than P16's.

The binary grew by 16,712 bytes. Neither move is a STOP; both are
reported because the kickoff asks where each tier landed. As ruled at
P11, the two-size behaviour stays a seed: one build per tier, the one
every proof and page check above ran against, no extra measuring build
and no bisect. git pairs the asset renames ACROSS the tiers this time
(state-p17-offline -> state-p18-net, state-p17-net ->
state-p18-offline); the sha256s of the named files are what count.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p18-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p18-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p18-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p18-offline.bin (39088856 bytes)
    state saved: build/state-p18-net.bin (37630688 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using one joined expression:

       state-p18-net.bin.gz       0 hits
       state-p18-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, read
from a per-tier listing inside each restored snapshot, each line
labelled with its tier; the same sizes as P15 to P17). It holds the
build steps' own commands and no key; check 3 covers it.

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open

and the five blocked cases (an unmapped address, a bare public IP, the
provider by name, port 80, loopback) each closed with HostBlocked.

RATE AND CONCURRENCY LIMITS FIRE, 9/9, "173 ip fields, all hashed": the
per-address concurrency cap refuses with code 4001, and the per-minute
rate refuses with code 4002. The refusal probe adds 16/16, including
the cap admitting exactly 24 from one address and the global cap's
4003.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log has 33 ip fields,
all 8-hex hashes (17 ws_open and 16 ws_close events). Walking JSON keys
as well as values, the dotted quads it carries are its own bind
address, its documentation-range address map, and four "asked" fields
that all name the one mapped destination 192.0.2.1:443. By their
timestamps (the log does not tag them), stream ids 1 and 2 at 21:42:57Z
and 21:43:11Z are the two networked builds' doctor steps (red and
green); id 3 at 21:47:22Z falls when the allowlist probe ran, as its
on-list control; and id 9 at 21:51:49Z falls in netcheck's window.
These attributions are inferred from timing. Its plain-text refusal
lines number FIVE, one per refused destination of the allowlist probe
(the unmapped address, the bare public IP, the provider by name, port
80, loopback).

The log's last event is a ws_close with live 1, not live 0 as at P17:
the relay was stopped for the selftest with one page connection still
counted open. That is recorded, not explained further.

## Item 11: the page

THE KEY TRUST STORY IS STATED. page/index.html is byte-identical to
73ed3bc's in this commit, so the trust block is P17's, unchanged, five
paragraphs in the served index: the key is typed at the wizard's own
hidden prompt inside the machine, the page passes keystrokes there and
nowhere else, files reach the provider on the networked tier, and the
relay holds ciphertext.

NO SHIPPED FILE REFERENCES WebGPU, so its absence has nothing to break
(a static token count with a control; no run had WebGPU disabled):

    app.js 0   index.html 0   libv86.js 0   xterm.js 0   v86.wasm 0
      (navigator.gpu | webgpu | requestAdapter | GPUDevice)

    LIVE CONTROL, same grep shape for a token that IS there:
      libv86.js getContext  4 lines, 5 occurrences
    and what the renderer actually asks for: getContext("2d") x3

EXCEL RENDER WORKS: sample.xlsx is read out of the share as text on both
tiers, `== Sheet: sales ==`, in the office proof below.

THE APEX REDIRECT IS 302 AND STAYS 302 (ruled keep-302):

    http://temur.live       302 -> https://play.temur.live/
    https://temur.live      302 -> https://play.temur.live/
    http://play.temur.live  301 -> https://play.temur.live/
    following through:      https://play.temur.live/ 200

## Office read, re-proved on the new binary

ALL PASS on both tiers, 15 PASS lines each, including the version
assert:

    PASS  the snapshot's temur is v0.40.0  temur 0.40.0
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers. These are the runs after the stub change
in the next section.

## The session probe and the proof stub

WHAT PLANNING PREDICTED. v0.40.0 sends a tools-drop probe at the start
of every session on a keyless openai-compat endpoint, and a one-shot
run waits for it before its turn. Both proofs run `temur -p ... --plain`
against tools/guest-stub-model.sh with a keyless config, and the stub
treated every chat POST as a scripted turn.

RED FIRST, the stub unchanged and only the version pin moved, the
office-read proof on the offline tier:

    PASS  the snapshot's temur is v0.40.0  temur 0.40.0
    PASS  the agent ran to the end of the scripted plan
    FAIL  three office reads SUCCEEDED in the guest
    FAIL  the two controls FAILED, so the read tool is not merely permissive  2 succeeded, 2 refused, of 5
    FAIL  one tool result came back for each of the 5 reads  4 result(s)
    FAIL  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    FAIL  extracted text of /files/sample.docx contains "Word documents become plain text."
    FAIL  extracted text of /files/sample.xlsx contains "== Sheet: sales =="
    FAIL  control /files/not-really.pdf refused with the right sentence  Cannot read binary file: /files/blob.bin. Inspect it with bash instead (e.g. file, unzip -
    FAIL  control /files/blob.bin refused with the right sentence  no tool result found
    === FAILED (8): offline ===

The stub wrote SIX request files against a five-line plan. The first
is the probe, 91 bytes, saved verbatim:

    {"max_tokens":1,"messages":[{"content":"hi","role":"user"}],"model":"local","stream":false}

Its two fields as serialized are `"stream":false` and `"max_tokens":1`,
with no space after either colon. It carries no tools field, and no
second probe with the tool definitions followed: requests 2 to 6 are
the session's turns, each `"stream":true`, `"max_tokens":4096`, with
tools. The probe took the plan's first line, so every read shifted by
one and the plan ran one read short, as predicted. (The proof itself
does not list request files; an out-of-tree copy that adds only a
listing and a dump of them was run right after, against the same
snapshot, with the same failures; deviation 3.)

THE ONE HARNESS CHANGE, in tools/guest-stub-model.sh only. After the
request line, the headers and the existing non-chat check, the body is
now read before the counter moves, into /tmp/stub-body, and a body that
carries `"stream":false` gets the stub's existing non-turn answer: the
same 404 and the same JSON error line, the counter not moved, no
request file written. A turn's body is then copied to req-N.json as
before. The comment block that records the v0.36.0 /models finding
gains a paragraph saying what v0.40.0 added and why the probe is
refused. The stub's sha256 moves from 73164d58... (4,903 B) to
a5a87910... (6,028 B). It was checked on the host first, with its two
paths moved into a scratch directory: the RED run's probe body got 404
with no counter and no file, a streamed body got 200 and req-1.json, a
second probe got 404 with the counter still 1, and a second streamed
body got req-2.json.

GREEN, both tiers, both proofs, every check passing. Request files
the stub wrote, beside each plan's length:

    proof         tier        plan   request files   of which "stream":false
    office-read   offline       5          6                   0
    office-read   networked     5          6                   0
    big-file      offline       1      2 per turn              (not dumped)
    big-file      networked     1      2 per turn              (not dumped)

Five reads plus the turn that stops make six for the office proof; one
read plus the stop make two per big-file turn. The office counts and
fields are from the out-of-tree copy's dump of every request file; the
big-file counts are from the guest listing the out-of-tree tail copy
printed before the proof's own removal of each turn's files. These are
the counts a plan of that length gives with no probe in the way; P17
did not count request files. Under RED the office proof also wrote six
files, but one was the probe and only four were reads. No proof sent a request that
was neither a scripted turn nor the probe, and no compaction request
appeared.

On the offline tier with the stub listening, the 404 on the bare probe
leaves the session silent: no "[!] the server at" line and no "drop
tool definitions" wording appears in any proof's captured turn.

THE STUB SHIPS IN NEITHER IMAGE. It is planted per proof run, and the
proofs save no state. Searched in both raw images: the changed stub
whole (6,028 B) 0, the 73ed3bc stub whole 0, its sha256 hex 0, and the
strings "chatcmpl-gueststub", "OFFICE-READ-PROOF-END" and "NOR IS EVERY
CHAT POST" 0 each. CONTROL: the same search over an image with the
changed stub appended finds it once. No served byte changes because of
this edit.

The release's other changes, the doctor tool-call probe and the
keep-first-call path, are not exercised by anything in the guest.

`temur doctor` ON THE RESTORED OFFLINE SNAPSHOT, out of tree, saving no
state, stdin from /dev/null, verbatim (a record, not a gate):

    PASS: config parsed: /root/.config/temur/config.json
    PASS: active selection: provider "openai-compat", model "local", http://127.0.0.1:8080/v1
    PASS: credentials: keyless (no api_key_file configured)
    PASS: key isolation: keyless config, no key files to guard
    NOTE: bash key sandbox: not needed (keyless config)
    PASS: install: the temur on PATH (/usr/bin/temur) is this running binary (temur 0.40.0)
    PASS: sessions dir /root/.local/state/temur/sessions: absent, will be created on first save
    FAIL: unreachable: http://127.0.0.1:8080/v1: TCP connect failed: Connection refused (os error 111)
    NOTE: model check at http://127.0.0.1:8080/v1 skipped: model listing GET http://127.0.0.1:8080/v1/models: io: Connection refused
    PASS: project instructions: none here (looked for TEMUR.md, then AGENTS.md, in the repository root and the working directory)
    NOTE: measuring the prompt floor against the server; on a CPU-only server this is a large prefill (up to 300s)
    NOTE: prompt floor measurement inconclusive: the server at http://127.0.0.1:8080/v1 did not answer within 300s (a slow local server may need longer to prefill the system prompt and every definition); the figure below is the estimate
    PASS: prompt floor (estimate): ~2894 tokens; window 8192; 35% of the window
    NOTE: that estimate is prompt bytes divided by 4, which is not tokenization: expect it to be off by some percent in either direction. A networked run against a keyless openai-compat server reports a measured figure instead. Reference measurement (2026-10-27, llama.cpp, Qwen3-4B-Instruct-2507, measured from a short working-directory path; a longer one raises both): 7,501 tokens for the full profile, 3,267 for the compact one.
    NOTE: the prompt floor moves with the length of the cwd path and the number of installed skills, both of which ride in the system prompt
    NOTE: tools-drop probe: sending 10 tool definitions (~6KB) to http://127.0.0.1:8080/v1; a local server must prefill all of it, which can take minutes the first time
    NOTE: tools-drop probe at http://127.0.0.1:8080/v1 skipped: the server reported no usable prompt_tokens
    doctor: 8 pass, 0 warn, 1 fail

The tool-call probe did not run, since the tools-drop probe did not
pass. No v0.39.0 capture exists on this machine to compare against.
One line is observed and not explained: the prompt-floor NOTE says the
server "did not answer within 300s", but the connection was refused
and the probe's end-of-command marker came back after doctor's summary
line, inside the at-most-60 s wait the probe gives that command
(probe-session-state.mjs in the work directory; no duration was
logged).

## The file-cap gate, re-measured, and the F29 footer

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.40.0` on both.

                            v0.39.0 (p17)    v0.40.0 (p18)
    big.pdf   offline           6.0 s            5.0 s
    big.pdf   networked         6.0 s            5.3 s
    big.pdf   lowest MemAvailable, worse tier
                                49.9 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.2 MB          76.2 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,168 kB = 50.0 and 77,992 kB = 76.2, both on the
networked tier; the offline tier's were 51,192 and 78,100 kB. P17's
were 51,124 and 78,040 kB. The PDF times are 5,010 ms offline and
5,260 ms networked; P17's were 6,021 and 6,016 ms.)

The PDF turn time includes the probe's round trip to the stub before
the turn; it fell by 1,011 ms offline and 756 ms networked against
P17's desktop run. That is what was measured; this pass does not say
why. One harness difference is in play: the changed stub holds each
turn's body in the guest's /tmp, which is RAM, during the read (about
20.5 KB on the big-file turn), where the old stub wrote it straight to
the share. The 44 kB move in the PDF floor is of that order; this pass
does not attribute it.

The PDF times and the PDF floor moved, so page/app.js's measurement
comment was rewritten to what was measured: v0.40.0 named, "5.0 s
offline, 5.3 s networked", "50.0 MB", "never left 76.2 MB" (unchanged),
and v0.39.0's readings kept for comparison in place of v0.38.6's (6.0 s
offline, 6.0 s networked, 49.9 MB). The 50.0 MB floor is 1,380 kB
above v0.35.0's 49,788 kB, so the comment's "about 1.3 MB roomier than
the same read on v0.35.0" stands. The PDF is unchanged: big.pdf
16,264,413 B / 15.51 MiB / 1098 pages. THE SPREADSHEET FOLLOWS THE
MACHINE: on this laptop big.xlsx is 16,317,903 B / 15.56 MiB / 148,801
rows (sheet XML 72,638,765 B, 4.45x), P16's document, against P17's
desktop 16,361,891 B / 15.60 MiB / 149,201 rows (step5-bigfile-*.log
line 3; build/proof-bigfile-read-*.json sizeBytes). The comment's xlsx
line moved back to 15.56 MiB, 148,801 rows. It is under the 16 MiB
per-file cap, and temur refused it in 0.5 s on both tiers. The 16 MiB
and 64 MiB caps are unchanged; the gate did not ask for a move.

THE F29 FOOTER, UNCHANGED. The guest config says context_window 8192.
The tool result the big-file proof read back from temur's request body
for big.pdf is 7,591 bytes on both tiers (7,591 at P17), and it ends,
on both tiers, verbatim:

    54: 

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)
    </content>

which is the text P16 and P17 recorded. Its first lines are the
document's own, and line 3 is the marker:

    1: 
    2: 
    3: BIG-PDF-PAGE-ONE-MARKER

so the marker check passes. The committed proof prints only the first
900 bytes of a tool result, so the footer was read by an out-of-tree
copy of the proof (deviation 2). The spreadsheet's tool result is
unchanged at 68 bytes, temur's own refusal sentence, with no footer.

## 9p restore, both tiers

ALL PASS, 8 checks per tier: ICRNL on with no page nudge, the mount
survives restore, the share ships empty, upload and download hashes
match in both directions, the hash survives drop_caches and a remount,
and temur is present with the share as its working directory.

## Both tiers in a real browser

Headless Edge, real time, local relay supplied by PAGE_DEV_RELAY at
serve time. The shipped CSP in page/_headers is unedited.
tools/page-run.sh is unedited from 73ed3bc; it deletes each report
before its run, and each run log also records that no stale report was
present. Every page/app.js edit (the pins and the measurement comment)
was finished before the first round, the stamp was redone from a bare
index (cmp-identical to 73ed3bc's before stamping), and the five checks
ran ONCE. No file appeared in the operator's Downloads folder: 522
entries before and after, 0 names differing (step7-downloads.log). The
filecheck download landed inside its run's own profile (1 file), which
was then removed.

    landingcheck  networked, cleanLanding true, wizardAtFirstQuestion true,
                  readyMs 1985
    netcheck      networked, wireBytes 15,951,590, stateBytes 37,630,688,
                  readyMs 1968, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake) #", the trailing " #"
                  as the log and the JSON carry it
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 17,367,298, stateBytes
                  39,088,856, readyMs 1041, echo 7 ms

The selftest frames equal 73ed3bc's committed report. netcheck and
selftest report exactly the wire and state sizes of the two NEW assets,
which is the check that the page serves the p18 pair. The echo reads 7
ms against P17's 1 ms; recorded, not explained.

## The stamp names v0.40.0

The footer stamp reads, from the served page:

    temur v0.40.0 (release, sha256 38ba7b97f93a5b43cf315f949832435f5425f305eeb781c87e42b54f2ca086ae)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.40.0, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js:567 `sha.textContent = TEMUR_SHA256`). The trust block in the
served index has 5 <p>. The wrap rule `#stamp code` is in the index the
local server served (1 hit). The app.js the local server served is
byte-identical to page/app.js in this commit, and the served index
references app.js?v=73ed3bc, the parent, since the stamp runs on an
uncommitted tree.

    CONTROL at 73ed3bc:  old sha 1 hit, new sha 0 hits   (page/app.js)
    working tree:        old sha 0 hits, new sha 1 hit

## The pre-publish sweep

Run LAST. Both pattern files are referenced BY PATH and never opened into
this repository, printed or copied: the sandbox pattern file (7 active
patterns, S1..S7) and the release leak file (5 active, R1..R5). Their
active counts were read structurally (non-comment, non-blank lines),
never by content. Findings are positional counts only. The sweep and
the register check are P16's laptop scripts, copied into this job's
work directory with the base commit and the asset names moved.

CONTROLS ARE GENERATED, one per pattern, by walking each pattern's parse
tree to a string that matches it. All twelve fire, and appending all of
them to the added-lines surface raises every pattern's count:

    S1..S7 control fires: YES (7/7)
    R1..R5 control fires: YES (5/5)

A hit is a match. Counts, patterns as written (case-sensitive):

    surface                                   S1..S7  R1,R2,R3,R5   R4
    1  added lines of the diff (-M)              0         0         0
    2  the commit message                        0         0         0
    3  every tracked file                        0         0        15
         of which tracked text files             0         0         5
    4  both new .gz, through gzip                0         0        28
    5  full history (all refs, blobs, commit     0         0        26
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 15 hits in 10 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits), the five committed kit/kernel*.config files (1 each; the
  five "text" hits), and page/assets/state-p18-offline.bin.gz as
  committed bytes (1). The new networked .gz has no hit as committed
  bytes.
- surface 4, 28 hits: 14 in each decompressed p18 image.
- surface 5, 26 hits in 19 blobs: the same nine kit blobs (14 hits),
  the eight earlier snapshot blobs P17 listed (state-p8, p9, p10
  offline; the two p13; p14 net; the two p15; 10 hits, state-p8's
  blob counting 3), the p16 offline blob (1), and the new p18 offline
  .gz blob aa847ad9 (1). Commit messages and path names: 0. Surface 5
  is the full history over all refs plus this commit's staged tree and
  message, so it counts the committed state.

Against P17 (surface 3 14, surface 4 22, surface 5 25): the p17 pair
leaves the tree with no hit as committed bytes, the new offline .gz
hits once as committed bytes (+1 on surfaces 3 and 5), and each
decompressed image carries 14 hits where P17's carried 11. The
authored surfaces, 1 and 2, are zero for all twelve patterns, and no
authored text file in the tree has a hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 41 / 43 / 232 on surfaces
3, 4 and 5 and stays 5 on the tracked text files and on the text
blobs, messages and paths of surface 5, the same five kernel configs.

Logs: step9-sweep-input.log (the paths' stat and structural counts),
step9-sweep-final.log and step9-sweep-nocase-final.log (the final
text); the -draft logs are the first runs, with the same counts.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective: its stem as a whole word, with an
optional "ly" or "y", case-insensitive.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0400-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P17 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot; the
same three files carry the same counts at 73ed3bc. No prose this pass
wrote has a hit, including the stub's new comment paragraph.

The figures above are from step9-register-final.log, run on the final text of
the report and the commit message.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    npm ci                      # only if node_modules is missing

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.40.0-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.40.0/temur-v0.40.0-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.40.0/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.40.0-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.40.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p18-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p18-offline-snap.json 128 \
        build/state-p18-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p18-offline-snap.json 128 build/state-p18-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p18-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p18-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p18-net.bin

    # the version strings inside each raw image, anchored and plain
    grep -a -o -P '0\.39\.0(?!\d)' build/state-p18-net.bin | wc -l   # 0
    grep -a -o -F '0.38.4' build/state-p18-net.bin | wc -l           # = the 0.38.44 count
    grep -a -o -P '0\.40\.0(?!\d)' build/state-p18-net.bin | wc -l   # 1

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p18-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p18-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p18-offline.bin offline
    # ... and the same three with state-p18-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p18-*.bin.gz

    # both tiers in a real browser, relay up for netcheck, down for selftest
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    sh tools/page-run.sh landingcheck 'landingcheck=1'
    sh tools/page-run.sh netcheck     'netcheck=1'
    sh tools/page-run.sh filecheck    'filecheck=1'
    sh tools/page-run.sh textcheck    'textcheck=1'
    sh tools/page-run.sh selftest     'selftest=1'     # relay stopped first

`tools/stamp.mjs` rewrites page/index.html's asset refs in place as a
build transform. The committed form keeps them BARE, so the file was
restored from the index before committing; it is byte-identical to
73ed3bc in this commit.

## Deviations from the kickoff

1. AN OUT-OF-TREE SESSION PROBE was run for (a) and (e), as in P10 to
   P17: each restored snapshot was listed for temur state, asked `type
   timeout`, listed /root/.ash_history for item 9, and started once
   with a plain `temur < /dev/null`, without `timeout`. It tests its
   four regexes against planted strings and checks that the start
   actually ran. On the offline tier the same probe captured `temur
   doctor`. It is not committed.
2. AN OUT-OF-TREE COPY OF tools/proof-bigfile-read.mjs read the F29
   footer, as the kickoff directs. It was copied from the committed
   proof after the version pin moved and differs in two added lines
   that print the last 400 bytes of each tool result, one added line
   that lists the turn's request files before the proof's own removal
   of them, and its JSON output path (the work directory). It ran once
   per tier after the committed proof, against the same snapshots,
   and reported GATE PASS on both with the same 7,591-byte and 68-byte
   tool results. Its timings stay out of the table and the comment;
   they are: big.pdf 5.0 s offline (5,003 ms) and 4.8 s networked
   (4,758 ms), lowest MemAvailable 51,180 kB offline and 51,240 kB
   networked; big.xlsx 0.5 s on both, lowest MemAvailable 78,052 kB
   offline and 78,148 kB networked.
3. AN OUT-OF-TREE COPY OF tools/proof-office-read.mjs, the committed
   proof plus one block before its JSON write that lists the request
   files in the share, prints /tmp/stub-count, dumps each req-N.json to
   the work directory with its "stream" and "max_tokens" fields, and a
   JSON output path in the work directory. It ran once after the RED
   run (stub unchanged) and once per tier after the GREEN runs. The
   committed proof is unchanged by it and the committed build/*.json
   are from the committed proof's runs. The kickoff asked to keep the
   req-*.json the RED run wrote; the committed proof cannot hand them
   out, so this copy is where they come from.
4. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P17.
5. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 to P17; no whole-DOM count was taken. The
   wrap rule was read from the index the local server served.
6. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here. It is P16's laptop script,
   copied unchanged into this job's work directory.
7. The page harness launches Windows Edge, and tools/page-run.sh puts
   each run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design. The logs replace the profile path with a
   placeholder, and the five profiles this job created were removed by
   name afterwards, from the directory GetTempPath reports. 53 older
   pagerun-* profiles were present and are not this job's; they were
   left alone.
8. Every pin the kickoff listed was moved; no tracked reference outside
   the list named the version or the pair. The lines that still name
   an earlier version after the move are the intended history and
   comparison lines (artifacts/PROVENANCE.md, page/app.js; listed in
   step3-pins-after.log). Not on the pin list and left as it was:
   artifacts/PROVENANCE.md still calls the in-machine version check the
   "fourth" check, where this report counts it as the sixth. Its "type"
   line says "Intel 80386, statically linked, stripped"; this laptop's
   file(1) also prints "version 1 (GNU/Linux)" between those. The line
   was left as it was.
9. build/steps-p18-net-snap.json and build/steps-p18-offline-snap.json
   are added as new files, byte-identical to the p17 step files.
10. The pin greps before and after the move used ONE pattern, kept in
   step3-pin-pattern.txt beside the logs. build/page-report-textcheck.json
   is unchanged by the run; it carries no timing or size fields.
11. The binary was downloaded into the work directory and copied into
   artifacts/ after the five-way check, rather than downloaded into
   artifacts/ directly as Reproduce shows. The bytes are the same (cmp,
   and the in-tree sha256sum -c).
12. `npm ci` was not run, as the kickoff allows: node_modules was
   present and the lock did not move in 73ed3bc.
13. THE RELAY RAN ONCE for the whole job (P17 restarted it for its page
   reruns), so there is one relay log, and its last event reads live 1
   (item 10).
14. The process check's `pgrep -af '[r]elay/relay.mjs'` matched the
   shell that had just launched the relay (correction 3). Later checks
   read `pgrep -a -x node` and the listener count on 8089.
15. THE ADDED LINES ARE NOT ALL ASCII: regenerated build/*.json machine
   captures carry non-ASCII, as at P9 to P17 (see the register check).
   This report follows that precedent.
16. The diff touches the 27 files the kickoff expected: P17's 26 under
   their p18 or v0.40.0 names, plus tools/guest-stub-model.sh. No file
   is outside that list.
17. The doctor capture asked for `temur doctor` once; it was run inside
   the session probe, from the shell prompt, with stdin from /dev/null.
   The probe has no state-saving step.
18. Three actions have no log line of their own: the `git rm` of the
   v0.39.0 binary and of the p17 pair by explicit name (the diff shows
   the result), the raw output of the `pgrep -af` relay check
   (correction 3), and the stamp's "release" href as read from the DOM
   (step7-dom-readings.log logs the URL's 200; page/app.js:62 builds
   the href from TEMUR_VERSION).

## Corrections

1. The first host-side check of the changed stub rewrote its paths with
   two sed substitutions in the wrong order. The WRONG ASSUMPTION was
   that the scratch path would not contain "/tmp/"; it did, so the
   share path was rewritten twice and the streamed branch could not
   write its file. Nothing was wrong with the stub. The check was
   rerun from a directory under the work dir with the substitutions
   reordered (step5a-stub-hostcheck.log).
2. The first copy of the session probe was cut at the wrong line and
   lost the restore and its prompt wait. The WRONG ASSUMPTION was that
   P16's probe kept its restore within its first 27 lines. It was
   rebuilt from P16's first 33 lines before it ever ran.
3. The relay check `pgrep -af '[r]elay/relay.mjs'` was run in the same
   shell command that launched the relay. The WRONG ASSUMPTION was that
   the bracket form keeps the check from matching its own shell; that
   shell's command line held the launch text "relay/relay.mjs" itself,
   so it matched. The real relay process was the other line, and the
   8089 listener count (1) confirmed it.

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff and stat,
the draft of this report, the draft commit message, and the gate and
scan logs and request dumps of this job (the work directory's
check-bundle). It never saw the conversation that produced the work,
and the two sweep pattern files were held out of its reach. Its answer
is reproduced verbatim below, indented. Its line numbers refer to the
draft, not to this file.

WHAT WAS DONE ABOUT IT. Blocking 1 and 2: the final report and commit
message were staged and the sweep and the register check were re-run
LAST, after this answer was pasted (step9-sweep-final.log,
step9-sweep-nocase-final.log, step9-register-final.log); the sections
above cite them. Blocking 3: both sentences now say "below every
networked figure P13 to P17 recorded", and the size section names the
smaller P6-era snapshots. Blocking 4: the doctor sentence now cites the
probe's end-of-command marker and its at-most-60 s wait in the probe
source, and says no duration was logged. Non-blocking 1 to 4: deviation
8, the file-cap timing sentence, the landing sentence and the relay
sentence were corrected. Non-blocking 5: the report's description of
the stub change now says the body is read before the counter moves.
The stub's own comment still says "before anything else"; editing it
would change the stub the proofs ran with (sha a5a87910...), so it is
left as run and raised with planning rather than changed after the
proofs. Non-blocking 6: the file-cap section now states the /tmp body
and the 44 kB floor move without attributing it. Non-blocking 7 is
deviation 3 and the request-count section as written. Non-blocking 8
is deviation 18. Non-blocking 9: the comment's 1.3 is computed from kB,
as at P17 (1,336 kB there); it is left. Non-blocking 10: the commit
message now calls the byte counts gzipped and the raw sizes new.
Non-blocking 11 needs no change here.

    ## Independent check of P18 (staged change on 73ed3bc, uncommitted)

    Scope: I read only the bundle (kickoff.md, staged.diff, staged.stat, draft-report.md, draft-commit-msg.txt, logs/, req/) and ran read-only git in the playground clone. I did not open either pattern file, ran no scan script, changed no file, and ran nothing in a guest or browser. I could not read the P16 kickoff, so where this kickoff says "as P16 step N", I checked only what this kickoff spells out.

    Facts about the inputs that the brief got wrong:
    - The index already holds reports/v0400-refresh.md. staged.diff and staged.stat therefore show 27 files, not 26. The staged copy is an earlier draft of 798 lines that still contains SWEEP_VERDICT_PLACEHOLDER, SWEEP_SECTION_PLACEHOLDER and REGISTER_SECTION_PLACEHOLDER. The working-tree copy is byte-identical to draft-report.md (885 lines), and only those three hunks differ from the staged copy.
    - `git diff --cached -M 73ed3bc` today has the same sha256 as staged.diff (52f484c6...).

    ### Q1. Does the diff do what the spec says and nothing else?

    Yes. Every point below was checked against the index.

    **File list.** There are 27 files. That is P17's 26 (73ed3bc's own `--stat`) under their p18 / v0.40.0 names, plus tools/guest-stub-model.sh. No file falls outside that list. page/index.html, relay/, page/_headers, tools/page-run.sh and package-lock.json have no staged and no working-tree diff against 73ed3bc.

    **page/index.html** has blob 44de6c17 at both 73ed3bc and the index, so it is byte-identical.

    **relay/:** `git log -1 73ed3bc -- relay/` is 9c9eb67, and there is no diff.

    **Step 3 pins, one by one:**
    - .gitignore:23-24 now negates state-p18-*.
    - THIRD_PARTY.md:64-65 names the p18 pair.
    - artifacts/PROVENANCE.md:
      - Moved to v0.40.0: size 8385332, both URLs, the `sha256sum -c` line, the published line, and "Downloaded 2026-11-18".
      - The "replaces" paragraph names v0.39.0 with sha b54b4f3b... and 8368620 bytes, and cites reports/v0390-refresh.md.
      - The never-served sentences are kept.
      - "See reports/v0400-refresh.md" is in place.
    - artifacts/SHA256SUMS: the staged blob is 428 B with sha256 f490cc68..., which matches the kickoff and step2-verify.log. Its lines begin aarch64 49957b43, armv7 ee5d1d31, i686 38ba7b97 and x86_64 c7c02367.
    - The binary: the staged blob is 8,385,332 B, sha256 38ba7b97...86ae, mode 100755. v0.39.0 is gone, and git shows it as a rename.
    - page/app.js:
      - Lines 60-61 moved together.
      - "THE P18 PAIR" and v0.40.0 are in the header comment.
      - "The p17 pair is removed" is in place.
      - SNAP_ONLINE and SNAP_OFFLINE point at state-p18-*.
    - tools/stage-page.sh:13, 67-68 and 71-87 are all moved.
    - The two generators were renamed with git mv. Only line 1 and the output path changed (similarity 97% and 96%).
    - tools/proof-office-read.mjs:1, 137 and 138, and tools/proof-bigfile-read.mjs:270 and 271: both the label and the escaped regex now read 0.40.0.
    - page/assets: the p17 pair was removed and the p18 pair added.
      - Staged net blob: 15,951,590 B, sha256 7100e1ce..., gunzips to 37,630,688 B.
      - Staged offline blob: 17,367,298 B, sha256 73ef9476..., gunzips to 39,088,856 B.
    - The renames pair across tiers (p17-offline to p18-net, p17-net to p18-offline). This is git's similarity choice only, and the report says so.

    **Leftover references.** I ran my own case-insensitive grep for p17, 0.39, b54b4f3b, p18 and 0.40 over the staged tree, outside reports/, build/ and vendor/. Apart from the intended lines, the only hits are unrelated: `zoom: 0.39` in index.html and `LIBUPNP18` in kit/buildroot.config. Nothing outside the pin list names the version or the pair.

    **The stub change, against section A's limits:**
    - The new code reads the body into /tmp/stub-body.
    - It adds one refusal branch, `grep -q '"stream":false'`, whose 404 header lines and JSON error line are byte-for-byte the existing non-turn branch.
    - Moving the counter increment after the branch, and writing req-N.json from the saved body, are the minimum the refusal needs to leave the counter and the share untouched.
    - The match string is exactly the field as req/req-1.json serializes it.
    - The new comment paragraph extends the 50-59 block in the same voice.
    - I judge this within "a body read and one refusal branch".
    - Sizes and shas: 4,903 B (73164d58...) before and 6,028 B (a5a87910...) after. logs/step5a-stub.diff is identical to the staged stub diff.

    Two notes on the stub (both non-blocking):
    - (a) The new comment, and report line 406, say the body is read "before anything else". It is actually read after the request line, the headers and the non-chat-POST check. "Before the counter moves" would be accurate.
    - (b) Each turn's body now also sits in the guest's /tmp, which is RAM, during the measured read. The big-file turn's body is about 20.5 KB (step5-f29-tail-*.log req-2.json). P18's PDF floor differs from P17's by 44 kB (51,168 vs 51,124). Treat that 0.1 MB move as within the noise this harness change could add, which the report already does by not explaining it.

    **The app.js measurement comment, against the committed JSON** (staged build/proof-bigfile-read-*.json, read by me):
    - PDF turn time: 5,010 ms offline and 5,260 ms networked. The comment's "5.0 s offline, 5.3 s networked" is right.
    - PDF floor on the worse tier: networked minAvailableKb 51,168, which is 49.97, so "50.0 MB" is right. Offline is 51,192.
    - xlsx floor on the worse tier: 77,992, which is 76.16, so "never left 76.2 MB" is right.
    - The xlsx document: sizeBytes 16,317,903 matches the "15.56 MiB, 148,801 rows" in step5-bigfile-*.log line 3.
    - The prior readings: 73ed3bc's JSON gives 6,021 and 6,016 ms, and networked 51,124 (49.93). The comment's "6.0 s offline and 6.0 s networked" and "49.9 MB on v0.39.0" are right.
    - The shape "on v0.40.0, ... on v0.39.0" is kept.
    - "About 1.3 MB roomier than v0.35.0": 51,168 - 49,788 = 1,380 kB, which is 1.35, so 1.3 is defensible. A reader subtracting the two displayed figures (50.0 - 48.6) gets 1.4. This is non-blocking.

    ### Q2. Do the logs contain every line the spec requires?

    **Anchor and step 1:** step1-preconditions.log has:
    - the key count 0;
    - "fast-forward: c8cc992..73ed3bc";
    - HEAD and origin/main both 73ed3bc3...;
    - porcelain 0;
    - relay tip 9c9eb67;
    - node v24.20.0;
    - node_modules present, lock changed 0;
    - sample.* 0;
    - `pgrep -x` counts.

    The `pgrep -af '[r]elay/relay.mjs'` output itself is not logged; correction 3 describes it. The five unchanged inputs are in step0-unchanged-inputs.log. MemAvailable before the first guest is in step4-mem.log (8840 MiB).

    **Step 2:**
    - step2-download.log: HTTP 200 for both files, 8,385,332 B.
    - step2-verify.log covers all five checks: computed, SHA256SUMS line, kickoff value, `sha256sum -c` OK, and cmp exits 0. It also shows mode 755 and the SHA256SUMS figures (4 lines, 428 B, f490cc68...).
    - MISSING: no log line shows the `git rm` of the v0.39.0 binary by explicit name. Only the diff shows the result.

    **Step 3:** step3-pin-pattern.txt holds one pattern, a superset of the kickoff's. It adds b54b4f3b, P17 and 38ba7b97. It is used in step3-pins-before.log (73ed3bc) and step3-pins-after.log (index). The "FAIL before the pin moves" line is in step5-office-preswap.log: "FAIL  the snapshot's temur is v0.39.0  temur 0.40.0".

    **Step 4:**
    - Overlay: step4-overlay.log.
    - Assert RED on both tiers: step4-offline-red.log:257-259 and step4-net-red.log:290-292, both EXIT=3 with "no state file written".
    - GREEN: step4-*-green.log, assert PASSED, then "state saved".
    - Landing bytes: step4-landing-bytes.log has 486, 486, equality with the motd, equality between tiers, and equality with P16's captured landings.
    - Watches (a), (c) and (e): step4-watches-abce.log, with controls, and step4-session-state-*.log, with the start-ran check, `type timeout`, and regex controls.
    - Watch (b) is checked only by a 'reasoning' grep. No init runs, which the report says.
    - Watch (d): step4-watch-d.log has every row the kickoff asks for, plus the lookahead check.
    - Stamp: step4-stamp.log.
    - Step files: step4-steps-cmp.log.

    **Section A:**
    - A.1, the RED run: step5a-red-office-offline.log (stub sha 73164d58, "stub git diff lines: 0", FAILED (8)).
    - The request files and the probe bytes are in step5a-red-office-offline-reqdump.log and req/req-1..6.json. Note that these files come from a re-run of the out-of-tree dump copy, not from the RED run itself (deviation 3 discloses this).
    - A.3: step5a-stub.diff and step5a-stub-hostcheck.log.
    - A.4, GREEN: step5-office-{offline,net}.log, step5-bigfile-{offline,net}.log and step5-proof-9p.log, all with stub sha a5a87910.
    - Request counts:
      - office proof: step5-office-*-reqdump.log (6 each, stub-count 6, no "stream":false);
      - big-file proof: step5-f29-tail-*.log, 2 per turn, from the tail copy and not from the committed run.
    - Stub in neither image: step5a-stub-not-in-images.log, with control.

    **Step 5:**
    - 9p: step5-proof-9p.log.
    - mkdocs: step5-mkdocs.log.
    - Office and big-file: as above.
    - Relay probes: step5-relay-probes.log, 6/6, 9/9 and 16/16.
    - Footer: step5-f29-footer.log and step5-f29-tail-*.log, with the copy's changes in tail-probe.diff.
    - Figures: step5-filecap-numbers.log.

    **Step 6:** step6-stage.log and step6-size-compare.log have both sizes, both shas, both raw sizes, gunzip cmp identical, and the comparison with P17, P16, P15 and P13. The P13 gz figure is "not recorded here".

    **Step 7:**
    - step7-page-{landingcheck,netcheck,filecheck,textcheck,selftest}.log, each with "stale report present before run: no".
    - step7-dom-readings.log has the stamp segment, sha counts, control on 73ed3bc, the one element, 5 `&lt;p&gt;`, the wrap rule, served app.js equal to the working copy, and "release URL: 200".
    - Partial: the "release" anchor's href is not logged as read from the DOM. Only the URL's HTTP status is.
    - step7-relay-stopped.note, step7-downloads.log, profiles.list, profile-cleanup.log (GetTempPath, five removed by name, 53 left).
    - The restore of index.html to bare form is in step8-items.log ("bare, restored == 73ed3bc: identical"). I confirmed it in git.

    **Step 8:** step8-items.log covers items 9, 10 and 11 with controls, and the apex 302.

    **Step 9:** step9-sweep-input.log, step9-sweep-draft.log, step9-sweep-nocase-draft.log and step9-register-draft.log.
    - MISSING: step9-sweep-final.log, step9-sweep-nocase-final.log and step9-register-final.log. The report cites them at lines 665 and 694, and they are not in the bundle.
    - The -draft runs scanned the STAGED report, which is the placeholder version. Their surface 1 (added lines) and surface 5 (staged blobs) therefore did not cover the report text now in draft-report.md, nor this check once it is pasted.
    - The kickoff requires the sweep LAST, so these runs must follow the paste.

    **STOPs:** None fires in the logs. RED failed. The stub change is within limits. Watch (d) and (e) are clean. The footer and marker match. Landings equal the motd. Authored surfaces are 0 in the drafts. Host MemAvailable is about 8800 MiB at each proof start. Memory is sampled only at run start, never during a run.

    **Report to planning:** The planning report (sandbox-p18-refresh-report.md) is not in the bundle, so I cannot check it. Of its listed contents, the draft report carries:
    - the fast-forward line (via step1);
    - section A in full;
    - watch (e) per tier;
    - the doctor capture, which I confirmed verbatim against step4-session-state-offline.log once CRs are stripped;
    - the file count of 27;
    - corrections with the wrong assumption named;
    - deviations;
    - the held line.

    The staged.stat 27 is the only primary for the file count. No log records it.

    ### Q3. Does every number and quoted string appear in a primary?

    I checked every figure in the draft report and commit message against logs, req/, the index and 73ed3bc. All agree except these:

    **Disagree:**
    - **Lines 49-50 ("the smallest networked figure recorded") and line 222 ("below every recorded networked figure").** reports/P6.md:128 at 73ed3bc records build/state-p6-net.bin at 34,575,072 B, and the P3, P4 and P5 page snapshots are about 35.1 MB. 37,630,688 is the smallest networked figure since P7, not ever. The four differences on lines 222-224 (348,160; 389,116; 1,748,988; 1,744,892) are right.
    - **Line 829 (deviation 8): "Its 'type' line says 'Intel 80386', which is what this laptop's file(1) prints."** step2-verify.log shows file(1) printing "ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped". PROVENANCE.md's unchanged type line lacks "version 1 (GNU/Linux)", as the draft report's own line 62 shows. The fragment matches; the line does not.
    - **Line 503: "it fell by about a second on both tiers".** Offline fell 1,011 ms (6,021 to 5,010). Networked fell 756 ms (6,016 to 5,260).
    - **Line 135: "(P17's were not on the desktop)".** By the report's own account P17 ran on the desktop, so this reads inverted. Presumably it means P17's captures are not on this laptop.
    - **Lines 116-117: the one relay log "covers ... the three probes".** relay.log holds only the allowlist probe's traffic (stream 3 and the five refusal lines). The privacy probe reports its own 7-line log in step5-relay-probes.log, so it did not use this relay's log.
    - **Line 406 and the stub comment: "read before anything else".** See Q1 note (a).

    **Unsupported (no primary in the bundle or at 73ed3bc):**
    - **Lines 479-480: "the whole doctor run returned inside the probe's 60 s bound".** No log records a 60 s bound or a doctor duration. step4-session-state-*.log mentions only a "20 s bound" for the plain start.
    - **Lines 665-666 and 694:** step9-sweep-final.log, step9-sweep-nocase-final.log and step9-register-final.log do not exist in the bundle. Every sweep and register figure on lines 618-692 matches the -draft logs exactly. That includes:
      - 7/7 and 5/5 controls fire;
      - 15 hits in 10 files, 28, and 26 in 19 blobs (I mapped the blob ids to paths with git: state-p8/p9/p10 offline, p13 x2, p14 net, p15 x2, p16 offline, and aa847ad9 = the staged p18 offline .gz);
      - 41 / 43 / 232;
      - register 0/0/0, 0/0/0, 0/0/0 and 0/2/3, with controls;
      - P17's 14 / 22 / 25 from v0390-refresh.md.

      But the -draft runs predate the report text they now describe.
    - **Line 64, "env -i curl":** not shown in any log (step2-download.log shows curl results only). Line 612's claim that the scripts are P16's, copied, and correction 2 are process statements with no log. Line 126's package versions are supported by 73ed3bc's package-lock.json and the P17 report, not by a P18 log.

    **Commit message:**
    - Lines 20-21: "The sizes are 15,951,590 B networked and 17,367,298 B offline, both new raw sizes". The two figures are the gzip sizes, while "new raw sizes" refers to the uncompressed 37,630,688 and 39,088,856. The wording conflates them.
    - Every other number in the message (8 checks, 5.0 s, 5.3 s, 50.0 MB, 38ba7b97, 8,385,332) is supported.

    **Supported, sample of what I verified:**
    - 0.62 s (0.619487) and mode 644 to 755.
    - The five full hashes.
    - Watch (d) table rows.
    - 486 B.
    - PLANT_9P names and EXIT=3.
    - 556 / 1,569.
    - 33 ip fields, 17 ws_open / 16 ws_close.
    - Stream ids 1, 2, 3, 9 and their timestamps.
    - Five plain refusal lines; last event live 1.
    - 522 entries; 53 profiles.
    - readyMs 1985 / 1968 / 1041; echo 7 vs 1.
    - wireBytes and stateBytes.
    - The RED FAIL lines and "FAILED (8)".
    - Probe body: 91 B, verbatim with req/req-1.json.
    - Request counts 6 / 6 / 2 per turn.
    - 73164d58 / 4,903 and a5a87910 / 6,028.
    - Doctor output, verbatim.
    - 51,192 / 78,100 / 51,168 / 77,992; P17 51,124 / 78,040 / 6,021 / 6,016.
    - 1,380 kB over 49,788.
    - 16,317,903 / 148,801 / 72,638,765 / 4.45x; P17 16,361,891 / 149,201.
    - 7,591 and 68 bytes; the footer, verbatim; the marker at line 3.
    - Tail figures 5,003 / 4,758 / 51,180 / 51,240 / 78,052 / 78,148.
    - MiB figures 15.21 / 16.56 / 16.82 / 15.10.
    - Gzip deltas 1,684,434 / 160,856 / 1,529,433 / 25,718.

    ### Findings

    **BLOCKING (resolve before the commit):**
    1. Re-stage reports/v0400-refresh.md. The index holds the placeholder draft (798 lines) and not the final text.
    2. Run the step 9 sweep and register check LAST, after this check is pasted and the final report and commit message are staged. Produce the -final logs the report cites (lines 665, 694), and make sure their counts still match lines 618-692. As of this check those logs do not exist, and the -draft runs did not scan the current report text.
    3. Report lines 49-50 and 222: "the smallest networked figure recorded" and "below every recorded networked figure" are contradicted by reports/P6.md:128 (state-p6-net.bin 34,575,072 B). Qualify them, for example "since P7".
    4. Report lines 479-480: the "60 s bound" has no primary. Source it or remove it.

    **NON-BLOCKING:**
    1. Deviation 8 (line 829): file(1) prints "version 1 (GNU/Linux)", which PROVENANCE.md's type line lacks. Either say so, or note that the line was left as history.
    2. Line 503 "about a second on both tiers": networked fell 0.76 s.
    3. Line 135 "(P17's were not on the desktop)" reads inverted.
    4. Lines 116-117: the one relay log covers the allowlist probe, not all three probes.
    5. Stub comment and report line 406: "read before anything else" should be "before the counter moves". This is in a committed file, so fixing it is cheap now.
    6. The stub now keeps each request body in guest /tmp (RAM) during the measured read, about 20.5 KB on the big-file turn. That is about half the size of the 44 kB P17-to-P18 floor move. The report attributes nothing, which is right, but a reader may want this stated.
    7. RED request files come from a re-run of the dump copy, not from the RED run itself (disclosed in deviation 3). Big-file request counts come from the tail copy, not the committed run (disclosed).
    8. Missing log lines: the explicit-name `git rm` of the v0.39.0 binary; the output of the `pgrep -af '[r]elay/relay.mjs'` check; the stamp's "release" href as read from the DOM (only the URL's 200 is logged).
    9. app.js "about 1.3 MB roomier" is right from kB (1,380 kB, about 1.35), but the displayed figures 50.0 and 48.6 differ by 1.4.
    10. Commit message lines 20-21 call the gzip byte counts "new raw sizes".
    11. The P16 kickoff's "Report to planning" list (lines 382-409) and the planning report file were outside my inputs and are unchecked.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries and
name the sha.
