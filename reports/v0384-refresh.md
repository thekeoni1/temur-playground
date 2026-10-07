# P14: the served snapshots move to temur v0.38.4

## Verdict

Both served snapshots are rebuilt on the released v0.38.4 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P13 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p13-* becomes state-p14-*, and every live reference moves
in the same commit. Nothing was released between v0.38.3 and v0.38.4.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd and to the text P13 captured. None
of the notices watched for appears, and no older version string is
inside either raw image while the new one is. The page harness reads
back the exact byte counts of the two NEW assets, which is what shows
the p14 pair is served rather than a cached p13 one.

v0.38.4 is the first refresh whose change the guest can see. F29 caps
`read` for the active model's window, and the guest runs at 8192, so
the big PDF's read now ends with the F29 footer, seen verbatim on both
tiers:

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)

The first line of the document is kept, and the proof's marker came
back on both tiers.

Three things are recorded rather than smoothed over. The networked
build landed on the LARGER of the two known sizes, so its asset is
about 1.5 MB bigger gzipped than P13's (it sits within 24,576 B raw
of P11's). The offline build landed 307,204 B raw BELOW P13's, outside the
known pair (only P6's offline build, before the 9p share and the
office reader, was smaller); it is reported as a question, not a
stop.
The PDF read got faster on both tiers (5.0 s offline, 5.3 s networked,
against 5.5 s and 5.8 s on v0.38.3), and the spreadsheet's memory
floor moved from 76.3 MB to 76.2 MB; page/app.js's measurement comment
was rewritten to say so. The sweep's only nonzero pattern is R4 on
binary and kernel content, under the standing P9 ruling. This commit
is not a decision to publish.

## The build input

    file    temur-v0.38.4-i686-unknown-linux-musl
    sha256  113bdfd7d445dcf529b115099927942f40c447f5e7923269e17cb8979b146cc0
    size    8,353,332 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-10-07; the i686 asset arrived in 0.82 s at HTTP
200 with the full byte count on the first fetch. The hash is checked
FIVE ways before the binary is used:

    computed from the downloaded file   113bdfd7...6cc0
    the published SHA256SUMS line       113bdfd7...6cc0
    the value planning supplied         113bdfd7...6cc0
    sha256sum -c in artifacts/          temur-v0.38.4-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.38.4`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.38.3,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.3  temur 0.38.4

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 42c885a6146377da1564c5f2af1164a850f6b985806b9ef53a580f2309d94db8,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim.

v0.38.3 was 8,350,964 bytes, so the binary GREW by 2,368 bytes. The
download arrived mode 644 and was set to 755; git records the rename
with no mode change.

## What did NOT change

                           this build (P14)   P13 record
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

All five hash identically to the values in reports/v0383-refresh.md,
so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the proofs, the page checks and the three
probes.

The two step files the generators write, build/steps-p14-net-snap.json
and build/steps-p14-offline-snap.json, are byte-identical to P13's
committed steps-p13-* files: the renamed generators changed their
header and output path only.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other and to P13's captures.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P13. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
equal to P13's committed report, and landingcheck reports cleanLanding
true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. The only paths
    named like temur are /etc/temur-motd, /usr/bin/temur and, on the
    offline tier, /root/.config/temur (its shipped config). A plain
    `temur` start on each restored snapshot printed no archive notice:
    the offline tier opened a new session ("# new session", header
    naming temur 0.38.4, otherwise the same screen as P13's) and the
    networked tier printed its no-config guidance, as designed.
(b) INIT'S REASONING-MODEL LINE: not seen. Neither the build nor any
    proof runs init against a model, and no such line appeared in any
    capture.
(c) TRUNCATION WORDING: none in either build log or either plain start.
    The F29 footer appears only inside the big-file proof's read, below.

    Counted, case-insensitive, for (a) to (c): "archived as", "truncat"
    and "reasoning" occur 0 times in both build logs. LIVE CONTROL: the
    same three greps over a copy of a build log with one planted line
    containing all three: 1 each. The plain-start probe's own two
    regexes were also run against a planted string inside the probe,
    and both fired.
(d) THE OLD VERSION STRINGS INSIDE THE MACHINE, counted in the raw
    images before gzip:

        build/state-p14-net.bin      "0.38.1" 0  "0.38.2" 0  "0.38.3" 0  control "0.38.4" 4
        build/state-p14-offline.bin  "0.38.1" 0  "0.38.2" 0  "0.38.3" 0  control "0.38.4" 4
        (the v0.38.4 binary itself:  "0.38.1" 0  "0.38.2" 0  "0.38.3" 0  "0.38.4" 4)

    The control count is 4 in each image and 4 in the binary itself
    (v0.38.3's binary carried its own string once), so every occurrence
    inside the machine is accounted for by /usr/bin/temur.

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p14-net.bin      39,375,580 B   17,641,108 B   16.82 MiB
    state-p14-offline.bin  37,331,672 B   15,677,271 B   14.95 MiB

    (p13, for comparison: 38,019,804 / 16,118,995 B = 15.37 MiB net,
                          37,638,876 / 15,827,000 B = 15.09 MiB offline)

    sha256  state-p14-net.bin.gz      77612dfa5504771c01abaa70f12a4fbdcdc9ff573ca9f3da49a8fa141d73c9bf
    sha256  state-p14-offline.bin.gz  8834f44f8aa21de0c6ac7cb328ee6cdd65f44d38c19d6b5cd3015c6e917eca92

Both are inside the limit with more than 8 MiB to spare. Each staged
.gz, gunzipped, is byte-identical (cmp) to the build/state-p14-*.bin
every proof ran against.

P10 and P11 established that a build lands on one of two sizes about
1.3 to 1.4 MB apart raw from identical inputs (reports/v0381-refresh.md
"Sizes"). This time the two tiers went different ways:

- networked, raw 39,375,580 B: the LARGER known size. It is 1,355,776 B
  larger than P13's 38,019,804 and 24,576 B larger than P11's
  39,351,004. Gzipped it is 1,522,113 B larger than P13's and 10,535 B
  larger than P11's.
- offline, raw 37,331,672 B: 307,204 B smaller than P13's 37,638,876
  and 319,492 B smaller than P11's 37,651,164, which were the smaller
  known offline size. It is outside the known pair; of the earlier
  offline builds only P6's, 35,246,812 B raw (reports/P6.md), was
  smaller. Gzipped it is 149,729 B smaller than P13's.

The binary grew by 2,368 bytes, so it is not the cause of either move.
The offline figure is outside the known pair by about 0.3 MB, which is
less than the megabytes the kickoff names as a question, and it is
reported here as a question all the same. As ruled at P11, this stays
a seed: one build per tier, the one every proof and page check above
ran against, no extra measuring build and no bisect.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p14-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p14-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p14-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p14-offline.bin (37331672 bytes)
    state saved: build/state-p14-net.bin (39375580 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using the one joined expression from P10:

       state-p14-net.bin.gz       0 hits
       state-p14-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, read
from a per-file listing that labels each line with its tier; the same
sizes as P13). It holds the build steps' own commands and no key;
check 3 covers it.

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open

and the five blocked cases (an unmapped address, a bare public IP, the
provider by name, port 80, loopback) each closed with HostBlocked.

RATE AND CONCURRENCY LIMITS FIRE, 9/9, "173 ip fields, all hashed": the
per-address concurrency cap trips at 24 and refuses with code 4001,
and the per-minute rate refuses with code 4002. The refusal probe adds
16/16.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log's 32 ip fields
are all 8-hex hashes; the dotted quads it does carry are its own bind
address, its documentation-range address map, and the destinations the
allowlist probe asked for. Its plain-text refusal lines number FIVE,
one per refused destination of the allowlist probe (the unmapped
address, the bare public IP, the provider by name, port 80, loopback);
the by-name case is refused and logged on the same path as the others.
(P13's log had 30 ip fields. The two extra are the open and the close
of one connection (relay log lines 27 and 28, 18:33:46Z and
18:34:05Z), logged inside the window of this job's out-of-tree footer
read on the networked tier, deviation 2; the attribution rests on
those timestamps.)

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs, and their text is identical to P13's reading: the key is
typed at the wizard's own hidden prompt inside the machine, the page
passes keystrokes there and nowhere else, files reach the provider on
the networked tier, and the relay holds ciphertext.

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

    PASS  the snapshot's temur is v0.38.4  temur 0.38.4
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured, and the F29 footer

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.38.4` on both.

                            v0.38.3 (p13)    v0.38.4 (p14)
    big.pdf   offline           5.5 s            5.0 s
    big.pdf   networked         5.8 s            5.3 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.3 MB          76.2 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,212 kB = 50.0 and 78,040 kB = 76.2, both on the
networked tier; P13's were 51,244 and 78,084 kB. The PDF times are
5,006 ms and 5,256 ms.)

The PDF times and the spreadsheet floor moved, so page/app.js's
measurement comment was rewritten to what was measured: v0.38.4 named,
"5.0 s offline, 5.3 s networked", "never left 76.2 MB", and v0.38.3's
times kept for comparison in place of v0.38.1's. The PDF floor did not
move. Documents unchanged: big.pdf 15.51 MiB / 1098 pages, big.xlsx
15.56 MiB / 148,801 rows. The 16 MiB and 64 MiB caps are unchanged.

THE F29 FOOTER, the first sighting on the playground. The guest config
says context_window 8192, so v0.38.4's `read` stops at the registry's
cap for that window. The tool result the big-file proof read back from
temur's request body for big.pdf is 7,591 bytes on both tiers (8,337
bytes at P13), and it ends, on both tiers, verbatim:

    54: 

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)
    </content>

Its first lines are the document's own, and line 3 is the marker:

    1: 
    2: 
    3: BIG-PDF-PAGE-ONE-MARKER

so the marker check passes by design, as the kickoff expected. The
committed proof prints only the first 900 bytes of a tool result, so
the footer was read by an out-of-tree copy of the proof (deviation 2).
The spreadsheet's tool result is unchanged at 68 bytes, temur's own
refusal sentence, with no footer.

## 9p restore, both tiers

ALL PASS, 8 checks per tier: ICRNL on with no page nudge, the mount
survives restore, the share ships empty, upload and download hashes
match in both directions, the hash survives drop_caches and a remount,
and temur is present with the share as its working directory.

## Both tiers in a real browser

Headless Edge, real time, local relay supplied by PAGE_DEV_RELAY at
serve time. The shipped CSP in page/_headers is unedited. tools/page-run.sh
deletes each report before its run.

    landingcheck  networked, cleanLanding true, wizardAtFirstQuestion true,
                  readyMs 1997
    netcheck      networked, wireBytes 17,641,108, stateBytes 39,375,580,
                  readyMs 2017, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 15,677,271, stateBytes
                  37,331,672, readyMs 1019, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p14 pair.

## The stamp names v0.38.4

The footer stamp reads, from the served page:

    temur v0.38.4 (release, sha256 113bdfd7d445dcf529b115099927942f40c447f5e7923269e17cb8979b146cc0)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.4, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code` is in the page the local
server served. The app.js the local server served is byte-identical to
page/app.js in this commit.

    CONTROL at 30307bc:  old sha 1 hit, new sha 0 hits   (page/app.js)
    working tree:        old sha 0 hits, new sha 1 hit

## The pre-publish sweep

Run LAST. Both pattern files are referenced BY PATH and never opened into
this repository, printed or copied: the sandbox file (7 active patterns,
S1..S7) and the release leak file (5 active, R1..R5). Findings are
positional counts only.

CONTROLS ARE GENERATED, one per pattern, by walking each pattern's parse
tree to a string that matches it. All twelve fire, and appending them to
the added-lines surface raises every pattern's count:

    S1..S7 control fires: YES (7/7)
    R1..R5 control fires: YES (5/5)

Counts, patterns as written (case-sensitive):

    surface                                   S1..S7  R1,R2,R3,R5   R4
    1  added lines of the diff (-M)              0         0         0
    2  the commit message                        0         0         0
    3  every tracked file                        0         0        15
         of which tracked text files             0         0         5
    4  both new .gz, through gzip                0         0        28
    5  full history (all refs, blobs, commit     0         0        22
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 15 hits in 10 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits), the five committed kit/kernel*.config files (1 each; the
  five "text" hits), and the new state-p14-net.bin.gz as committed
  bytes (1). The new state-p14-offline.bin.gz has no hit as committed
  bytes.
- surface 4, 28 hits: 14 in each decompressed p14 image.
- surface 5, 22 hits in 15 blobs: the same nine kit blobs (14 hits),
  the committed state-p8 (3), state-p9 (1) and state-p10 (1) offline
  .gz blobs, the two p13 .gz blobs now in history (1 each), and the new
  p14 net .gz blob (1). Surface 5 is the full history over all refs
  plus this commit's staged tree and message, so it counts the
  committed state.

Against P13 (surface 3 16, surface 5 21): the p13 pair leaves the tree
(-2 on surface 3) and stays in history, and of the new pair only the
networked .gz hits as committed bytes (+1 on both surfaces). The
authored surfaces, 1 and 2, are zero for all twelve patterns, and no
authored text file in the tree has a hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 34 / 41 / 150 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0384-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P13 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at 30307bc
(U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this is captured
output, not prose written here. No prose this pass wrote has a hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.4-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.4/temur-v0.38.4-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.4/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.4-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.4-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p14-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p14-offline-snap.json 128 \
        build/state-p14-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p14-offline-snap.json 128 build/state-p14-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p14-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p14-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p14-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p14-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p14-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p14-offline.bin offline
    # ... and the same three with state-p14-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p14-*.bin.gz

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
30307bc in this commit.

## Deviations from the kickoff

1. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10 to P13: each
   restored snapshot was listed for temur state and started once with a
   plain `temur`. It is not committed. It tests its own two regexes
   against a planted string.
2. A SECOND OUT-OF-TREE PROBE read the F29 footer. The committed
   big-file proof logs only the first 900 bytes of a tool result, so
   the footer the kickoff asks to record was in no capture. A copy of
   tools/proof-bigfile-read.mjs, outside the repository, differing in
   two added lines that print the last 400 bytes of each tool result
   and in its JSON output path (the work directory, not build/), was
   run once per tier against the same two snapshots after the committed
   proof had run. It reported GATE PASS on both tiers with the same
   7,591-byte and 68-byte tool results. The committed build/*.json are
   from the committed proof's run. It is not committed, and the
   committed proof is not changed. It also measured, and these
   readings are NOT in the table or in page/app.js, which use the
   committed run only: big.pdf read in 4.8 s on both tiers, lowest
   MemAvailable 50.0 MB offline and 49.9 MB networked (0.1 MB below
   the committed run's floor); big.xlsx 0.5 s and 76.2 MB on both
   tiers. Whether the comment's "50.0 MB" should carry the lower
   reading is left to planning.
3. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P13.
4. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 to P13; no whole-DOM count was taken. The
   wrap rule was read from the page the local server served.
5. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here.
6. The page harness launches Windows Edge, and tools/page-run.sh puts
   that run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design, used at P9 to P13; the profile holds nothing from
   this job but a browser session against localhost. The logs this job
   kept replace the profile path with a placeholder, and the five
   profiles this job's runs created were removed by name afterwards.
7. As at P13, git pairs the asset renames WITHIN each tier
   (state-p13-net -> state-p14-net, state-p13-offline ->
   state-p14-offline); the sha256s above are of the named files either
   way.
8. Every comment line the kickoff listed was moved; no tracked
   reference outside the list named the version or the pair. The five
   lines that still name an earlier version after the move are the
   intended history and comparison lines: artifacts/PROVENANCE.md 12,
   14 and 16, and page/app.js 872 and 874.

## Corrections

1. The first rewrite of the measurement comment in page/app.js
   addressed the PDF-time line and the spreadsheet-floor line by line
   numbers (860 and 863) taken from the kickoff's 850-874 range rather
   than from the file. The WRONG ASSUMPTION was that those numbers
   pointed at those lines; they sit at 858 and 862, so the first pass
   changed the other four lines and left these two unchanged. The diff
   review caught it, the two lines were located by grep and moved, and
   the residual-pin grep was run after that.
2. The draft commit message said the offline build landed "below any
   earlier offline build", and the draft report said no earlier build
   had shown that size. The WRONG ASSUMPTION was that the two-size
   pair P10 and P11 established spans every earlier build; P6's
   offline build (35,246,812 B raw, reports/P6.md) was smaller. The
   independent check caught it, and both now say "outside the known
   pair" and name P6.

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below. Its line numbers refer to the draft, not to this file.
The transport HTML-escaped one pair of angle brackets; it is shown here
as the characters.

WHAT WAS DONE ABOUT IT. Blocking 1 is done: the commit message now says
"below P13's and P11's offline builds, outside the known pair", and the
report's two sentences (non-blocking 4) name P6 as the one smaller
build; this is correction 2. Blocking 2 is done: the sweep and the
register check were re-run on this final text and the final commit
message, and the numbers above are from that run. Non-blocking 3 is
disclosed in deviation 2 and left to planning to rule. 5 is done (the
cmp is logged and stated under "Sizes"). 7 is done (relay log lines 27
and 28 are cited in item 10). 6 is left as it is: those PROVENANCE
lines are pre-existing and off the pin list. 8 is in the report to
planning.

VERBATIM:

    # Independent check: P14 snapshot refresh (staged on 30307bc)

    `env | grep -c ANTHROPIC_API_KEY` = 0. I modified nothing and opened no held-out pattern files. In the playground repo I ran only read-only git commands, plus sha256sum, wc, cmp and gzip -dc.

    ## Direct verification from the index

    | Item | Result |
    |---|---|
    | staged.diff vs a fresh `git diff --cached -M 30307bc` | cmp identical. staged.stat also identical. |
    | staged reports/v0384-refresh.md vs draft-report.md | cmp identical (both still carry CHECK_PLACEHOLDER at line 615) |
    | HEAD and origin/main | both 30307bc6140c16677644f995ff3a3665b2fb368a. No unstaged changes. |
    | page/assets/state-p14-net.bin.gz | blob df18da9, mode 100644, 17,641,108 B, sha256 77612dfa5504771c01abaa70f12a4fbdcdc9ff573ca9f3da49a8fa141d73c9bf, gunzipped 39,375,580 B. The gunzipped stream cmp-equals build/state-p14-net.bin. |
    | page/assets/state-p14-offline.bin.gz | blob 7f6d4f7, mode 100644, 15,677,271 B, sha256 8834f44f8aa21de0c6ac7cb328ee6cdd65f44d38c19d6b5cd3015c6e917eca92, gunzipped 37,331,672 B. The gunzipped stream cmp-equals build/state-p14-offline.bin. |
    | artifacts/temur-v0.38.4-i686-unknown-linux-musl | mode 100755, 8,353,332 B, sha256 113bdfd7d445dcf529b115099927942f40c447f5e7923269e17cb8979b146cc0, cmp identical to the cut's staged release file |
    | artifacts/SHA256SUMS | 428 B, 4 lines, sha256 42c885a6146377da1564c5f2af1164a850f6b985806b9ef53a580f2309d94db8, cmp identical to the cut's staged copy |
    | relay/, kit/, tools/guest/ | index entries hash-identical to 30307bc's tree listing, and `git diff --cached --quiet 30307bc` is clean for each. relay/ last commit is 9c9eb67. |
    | page/index.html | staged and working copy both byte-identical to 30307bc |
    | page/app.js as served (the job's served-app.js copy) | cmp-equal to staged page/app.js (60,254 B) |
    | build/steps-p14-{net,offline}-snap.json | same blob ids as steps-p13-* (1c07571, 26e596a). Byte-identical, as the report says. |

    ## Q1. Does the diff do what the kickoff says and nothing else?

    **YES.**

    The step 3 pin list, item by item:

    - **.gitignore:23-24** moved to state-p14-* (staged.diff 1-14).
    - **THIRD_PARTY.md:64-65** moved (staged.diff 16-29).
    - **artifacts/PROVENANCE.md** (staged.diff 31-94):
      - 6-8: file, sha and size 8353332.
      - 11-17: the "replaces" paragraph now names v0.38.3, 9789fde1... and 8350964 bytes, and cites reports/v0383-refresh.md. The v0.38.2 and v0.36.0 never-served sentences are kept. No new sentence was added.
      - 21: date 2026-10-07.
      - 24 and 29: both URLs are v0.38.4.
      - 34: the sha256sum -c line.
      - 38: the published line.
      - 46: now points to v0384-refresh.md.
      - Line 9 (type) and the "fourth, independent check" wording at 41-44 were not on the list and are unchanged. See non-blocking item 6.
    - **page/app.js:60-61** TEMUR_VERSION and TEMUR_SHA256 move together.
    - **page/app.js:64-75** "THE P14 PAIR", line 72 "The p13 pair", and SNAP_ONLINE/SNAP_OFFLINE moved to state-p14-*.
    - **page/app.js:850-874**
      - 853: v0.38.4.
      - 858: 5.0 s / 5.3 s.
      - 862: 76.2 MB.
      - 872-874: "on v0.38.4, the same as on v0.38.3", with 5.5 s / 5.8 s on v0.38.3.
      - These match the P13-precedent shape. The 16 MiB and 64 MiB caps are untouched (staged.diff 659-723).
    - **tools/stage-page.sh:13, 67-68, 71-87** all moved, including "superseded p13 files" (staged.diff 1442-1494).
    - **gen-steps-p13-* renamed to p14.** Only line 1 and the output path (137 / 70) changed, at 97% and 96% similarity (staged.diff 1364-1405).
    - **proof-office-read.mjs 1, 137, 138** and **proof-bigfile-read.mjs 270, 271**: the label and the escaped regex both moved to 0\.38\.4 (staged.diff 1406-1440).
    - **page/assets**: the p13 pair renamed to p14, paired within tier (staged.diff 725-736). This matches deviation 7.

    Steps 2, 4-7 and 11:

    - Binary renamed with no mode change (100755 to 100755, staged.diff 109-114).
    - SHA256SUMS is verbatim. The other three lines match the kickoff prefixes 3dc00719, 1e9b6a4f and cee92df0.
    - The ten regenerated build/*.json, the two new steps-p14 JSON files and reports/v0384-refresh.md are present. This is the same 26-file shape as P13's 30307bc commit.

    Unasked changes: none.

    - The two new build/steps-p14-*.json are not on the pin list. They are covered by "Tracked build/*.json ... per precedent": P13 added steps-p13-* the same way.
    - A residual grep over the index for 0.38.1, 0.38.2, 0.38.3, 9789fde1, state-p13 and p13- (excluding reports/, build/, page/assets/ and vendor/) leaves only the five intended history/comparison lines: PROVENANCE 12, 14, 16 and app.js 872, 874. This matches step3-pins-after.log and deviation 8.

    ## Q2. Do the logs contain every line the kickoff requires?

    **PARTLY.** Every pre-commit item is present. Some items can only exist after the commit, and the final sweep must be re-run.

    ### Step 1 (step1-preconditions.log)

    - Key count 0 (L2).
    - HEAD and origin/main 30307bc (L3-4).
    - Porcelain 0 (L5).
    - relay tip 9c9eb67 (L6).
    - node v24.20.0 (L7).
    - node_modules present (L8).
    - sample.* 0 (L9).
    - package-lock sha (L10). It is unchanged because it is absent from the diff.

    ### Step 2

    - step2-download.log L2-6: HTTP 200, 8353332 B, 0.823825 s, curl exit 0.
    - step2-verify.log:
      - Byte count first (L1).
      - Computed sha (L2).
      - The SHA256SUMS line (L3).
      - The kickoff value (L4-5).
      - `sha256sum -c` OK with exit 0 (L6-7).
      - cmp exit 0 for the binary and for SHA256SUMS (L8-9).
      - SHA256SUMS facts (L10).
      - Mode 755 (L11).
      - `file` output (L12).

    ### Step 3

    - step3-pins-before.log (48 lines) and step3-pins-after.log (5 lines).
    - The required "FAIL before the pin moves" is in step5-office-preswap.log L6 (`FAIL  the snapshot's temur is v0.38.3  temur 0.38.4`, EXIT=1 at L67).

    ### Step 4

    - step4-overlay.log: mkcpio exit 0.
    - RED on both tiers:
      - step4-offline-red.log L255-259 (EXIT=3, "no state file written (correct)").
      - step4-net-red.log L288-292 (same).
    - GREEN on both tiers:
      - step4-offline-green.log L255-257.
      - step4-net-green.log L288-290 ("assert PASSED: entries=0 used_size=0 inodes=1", state saved, EXIT=0).
    - Landing text verbatim: landing-net.txt and landing-offline.txt, 486 B each. I confirmed both cmp-equal tools/guest/motd.
    - Byte check: step4-landing-bytes.log L1-5, including equality to P13.
    - Watches (a)-(c): step4-watches-abc.log L1-9 with controls. step4-session-state-{net,offline}.log carry the plain-start probe and its regex controls.
    - Watch (d): step4-watch-d.log L1-3, all four counts per tier plus the binary.

    ### Step 5

    - 9p restore: step5-proof-9p.log, 8 PASS lines per tier, EXIT=0.
    - mkdocs: step5-mkdocs.log, EXIT=0.
    - Office read: step5-office-{offline,net}.log, 15 PASS lines each, including the version assert and the two refusal controls.
    - Big-file read: step5-bigfile-{offline,net}.log, GATE PASS.
    - F29 footer verbatim: step5-f29-tail-{offline,net}.log L44.
    - File-cap figures: step5-filecap-numbers.log L1-8.
    - Relay probes: step5-relay-probes.log, 6/6, 9/9 and 16/16.

    ### Step 6 (step6-stage.log)

    - Stage exit 0 (L19).
    - `ls -l` output (L20-21).
    - Size, raw size, MiB, sha and under-25MiB for each tier (L22-23).
    - Which of the two known sizes each tier landed on is a judgment in the report (lines 175-193), made from prior reports, not from a log. That is acceptable.

    ### Step 7

    - Five page logs: step7-page-landingcheck, netcheck, filecheck, textcheck and selftest. The profile path is a placeholder in each.
    - step7-relay-stopped.note: 0 listeners.
    - step7-dom-readings.log:
      - Frames unchanged (L1-3).
      - stampText (L4).
      - Sha count new 1 / old 0 (L5).
      - ?v=30307bc (L6).
      - Served app.js equals the working copy (L7).
      - Controls at 30307bc (L9).
      - Single element (L10).
      - Trust <p> = 5 (L11).
      - Wrap rule 1 (L12).
      - Release URL 200 (L13).

    ### Step 8

    - step8-item9.log: byte scan with controls (L2-3), in-guest markers, assert, and .ash_history sizes labelled by per-tier file (L15-16).
    - step8-item10.log: 7 log surfaces at 0 with controls (L2-8), probes, 32 HASHED8 (L29), and five refusals labelled by destination (L30).
    - step8-item11.log: WebGPU tokens with getContext control, the five paragraphs, Excel PASS on both tiers, and apex 302/302/301/200.

    ### Step 9

    - step9-sweep-draft.log (case-sensitive) and step9-sweep-nocase.log: 12/12 controls fire, plus a surface-1 rise control. All five surfaces are covered, with R4 hits listed per item.
    - step9-r4-blob-paths.log maps the blob ids to paths.
    - step9-register-draft.log: four surfaces, a planted control per surface, and the 30307bc comparison for the three machine-capture files.

    ### Gaps

    1. **The step 9 sweep and register ran on the draft report (with CHECK_PLACEHOLDER) and the draft commit message.** Once this answer is pasted in, reports/v0384-refresh.md changes. The sweep (all five surfaces) and the register check must be re-run on the final staged report and final message, so the sweep is still LAST.
    2. **Items that can only exist after the commit** are not yet logged:
       - commit sha and parent 30307bc;
       - `git diff --stat -M 30307bc..HEAD` and the file count (expected 26);
       - ahead/behind 1/0;
       - the planning report file and its sha256;
       - the "not yet reported to planning" line.

    ### Weak spots (none blocking)

    - **Asset-to-build equality.** The job logged only that the staged .gz decompresses to the right size (step6-stage.log L22-23, "rawfile="). It did not log that the bytes match the build the proofs ran against. I ran that cmp and both tiers are equal; the log could carry it.
    - **The extra two ip fields.** The report says the two ip fields beyond P13's 30 came from the out-of-tree footer run. This rests only on timing: relay.log L27-28 (ws_open 18:33:46Z, ws_close 18:34:05Z) against the tail-net log's write time (14:34:05 local, UTC-4). No log line ties them together.
    - **"Trust text identical to P13's".** This holds because page/index.html has no diff. No log compares the text itself.

    ## Q3. Does every number and quoted string appear in a primary?

    **PARTLY.** One claim in the commit message is contradicted by a primary. One framing should be ruled on by planning. Everything else checks out.

    ### Checked and correct

    - **Sizes, recomputed:**
      - 39,375,580 - 38,019,804 = 1,355,776
      - 39,375,580 - 39,351,004 = 24,576 (the P11 figure is from v0383-refresh.md:152)
      - 17,641,108 - 16,118,995 = 1,522,113
      - 17,641,108 - 17,630,573 = 10,535
      - 37,638,876 - 37,331,672 = 307,204
      - 37,651,164 - 37,331,672 = 319,492
      - 15,827,000 - 15,677,271 = 149,729
      - 8,353,332 - 8,350,964 = 2,368
    - **MiB:** 17,641,108 / 2^20 = 16.82 and 15,677,271 / 2^20 = 14.95. 25 - 16.82 = 8.18 MiB, so "more than 8 MiB to spare" holds.
    - **kB/1024:**
      - 51,212 gives 50.01, shown as 50.0.
      - 78,040 gives 76.21, shown as 76.2.
      - P13's 51,244 gives 50.04 and 78,084 gives 76.25, shown as 50.0 and 76.3.
      - The worse tier is networked for both, which is correct from the committed JSONs.
    - **Timings:** 5,006 ms and 5,256 ms give 5.0 s and 5.3 s. P13's 5,507 and 5,756 give 5.5 s and 5.8 s.
    - **Tool result:** 7,591 B. P13's was 8,337 B. The "900 bytes" figure is 7,591 - 6,691 from the bigfile logs, L41.
    - **Footer:** the string matches step5-f29-tail-*.log L44 exactly. That includes "Output capped at 7624 bytes", "lines 1-54" and "offset=55".
    - **Watch (d):** 4/4/4 and 0s match step4-watch-d.log. "v0.38.3's binary carried its own string once" matches v0383-refresh.md:144.
    - **Harness readings:** readyMs 1997/2017/1019, echo 2 ms, 17 terms, and 16.0 MB / 64.0 MB match the step7 logs.
    - **.ash_history:** 556 / 1,569 match step8-item9.log and v0383-refresh.md:216.
    - **Relay:** 6/6, 9/9, "173 ip fields, all hashed", 24 / 4001, 4002 and 16/16 match step5-relay-probes.log. 32 vs 30 ip fields and FIVE refusals match step8-item10.log and v0383-refresh.md:238.
    - **Sweep sums:**
      - Surface 3: 15 = 2+2+3+2+5+1 in 10 files.
      - Surface 4: 28 = 14+14.
      - Surface 5: 22 = 14 (nine kit blobs) + 3 + 1 + 1 + 1 + 1 + 1 in 15 blobs.
      - Text hits: 5.
      - Case-insensitive: 34 / 41 / 150.
      - P13's 16 / 21 match v0383-refresh.md.
      - "-2 / +1" is consistent.
    - **Register:** the counts 0/0/0 x3, 0/2/3 and the 30307bc comparison 1/1/0 and 1/1/1 match step9-register-draft.log.
    - **Correction 1:** lines 858 and 862 are confirmed from the staged app.js hunk.

    ### Wrong or framed beyond its primary

    1. **draft-commit-msg.txt line 33-34** says "the offline build landed about 0.3 MB raw below any earlier offline build". This is contradicted by reports/P6.md:129 at 30307bc: state-p6-offline.bin was 35,246,812 B raw, which is smaller. The primaries support "about 0.3 MB raw below P13's and P11's, outside the known pair". The draft report's own wording is literally true but loose and could be tightened the same way:
       - report line 33-34: "a size no earlier build has shown"
       - report line 185: "No earlier build has landed here"
    2. **The out-of-tree footer run (deviation 2) measured more than the report says.** step5-f29-tail-net.log L21 shows lowest MemAvailable 49.9 MB, and both tail runs took 4.8 s (L22 in each). The report and the app.js comment (line 871-872: "50.0 MB spare is the smallest margin either tier showed on v0.38.4") use only the committed proof run. Those committed numbers come from a primary. But a v0.38.4 run on the same snapshots did go lower, and deviation 2 does not say so. This needs a planning ruling: either disclose it in deviation 2, or rule that only the committed run counts.
    3. **Minor: PROVENANCE.md is out of step with the report.** Its unchanged type line omits "version 1 (GNU/Linux)", which the report has at line 47 (from step2-verify.log L12). Its line 41-44 still calls the in-machine check the "fourth" check and names only the office proof, while the report and commit message say "sixth" and name both proofs. These are pre-existing lines, not on the pin list. This is a consistency note, not an error.

    ## Overall verdict

    The staged diff is correct and limited to the kickoff's scope. The index matches every stated hash and size, and the logs carry every pre-commit line the kickoff requires. Do not commit until the commit-message wording is fixed and the sweep and register are re-run on the final texts.

    ### Blocking (before commit)

    1. Fix draft-commit-msg.txt line 33-34 "below any earlier offline build". reports/P6.md:129 contradicts it. Suggested wording: "below P13's and P11's offline builds, outside the known pair".
    2. After inserting this answer into reports/v0384-refresh.md, and after any wording fix, re-run the step 9 sweep (all five surfaces, both pattern files, controls firing) and the register check on the final staged report and final message. Log both.

    ### Non-blocking

    3. Planning ruling: disclose in deviation 2 that the out-of-tree run measured 49.9 MB networked and 4.8 s on both tiers, or rule that it need not be disclosed.
    4. Optionally tighten report lines 33-34 and 185 to "outside the known pair, below P13's and P11's".
    5. Optionally log the gunzip-vs-build cmp. It passes on both tiers, verified here.
    6. The PROVENANCE.md line 9 type string and the "fourth" wording at 41-44 lag the report. These are pre-existing and off the pin list.
    7. The relay 32-vs-30 ip-field attribution rests on timestamps only. Consider citing relay.log L27-28.
    8. After the commit, the planning report must still carry: commit sha, parent, `diff --stat -M 30307bc..HEAD`, file count, ahead/behind 1/0, its own sha256, and "not yet reported to planning".

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
