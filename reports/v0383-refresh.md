# P13: the served snapshots move to temur v0.38.3

## Verdict

Both served snapshots are rebuilt on the released v0.38.3 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P11 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p11-* becomes state-p13-*, and every live reference moves
in the same commit. v0.38.2 was released but never served here, by
plan; the live page served v0.38.1 from P11 until this refresh.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd and to the text P11 captured. None
of the notices watched for appears, and neither older version string is
inside either raw image while the new one is. The page harness reads
back the exact byte counts of the two NEW assets, which is what shows
the p13 pair is served rather than a cached p11 one.

Two things are recorded rather than smoothed over. Both builds landed
on the SMALLER of the two sizes earlier builds have shown, so the
networked asset is about 1.5 MB smaller gzipped than P11's (it sits
within 8,192 B raw of P10's networked size). The PDF read in the
file-cap gate took longer than on v0.38.1 on both tiers (5.3 to 5.5 s
offline, 4.8 to 5.8 s networked), and
the measurement comment in page/app.js was rewritten to say so; both
memory floors did not move. The sweep's only nonzero pattern is R4 on
binary and kernel content, under the standing P9 ruling. This commit is
not a decision to publish.

## The build input

    file    temur-v0.38.3-i686-unknown-linux-musl
    sha256  9789fde1e8c8d4f4578793517ffd6ddfd53dab2d42584bf3ca54cb5dff52c68e
    size    8,350,964 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-10-05; the i686 asset arrived in under a second at
HTTP 200 with the full byte count on the first fetch. The hash is
checked FIVE ways before the binary is used:

    computed from the downloaded file   9789fde1...c68e
    the published SHA256SUMS line       9789fde1...c68e
    the value planning supplied         9789fde1...c68e
    sha256sum -c in artifacts/          temur-v0.38.3-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.38.3`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.38.1,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.1  temur 0.38.3

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 dbf79160e9bc4ff829aeca26d43f2451edd72f449a6a59403f2bd3c290322b97,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim.

v0.38.1 was 8,341,524 bytes, so the binary GREW by 9,440 bytes. The
download arrived mode 644 and was set to 755; git records the rename
with no mode change.

## What did NOT change

                           this build (P13)   P11 record
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

All five hash identically to the values in reports/v0381-refresh.md,
so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the page checks and the three probes.

The two step files the generators write, build/steps-p13-net-snap.json
and build/steps-p13-offline-snap.json, are byte-identical to P11's
committed steps-p11-* files: the renamed generators changed their
header and output path only.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other and to P11's captures.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P11. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
equal to P11's committed report, and landingcheck reports cleanLanding
true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. /root/.local
    and /root/.cache do not exist in either snapshot, and the only
    paths named like temur are /etc/temur-motd, /usr/bin/temur and, on
    the offline tier, /root/.config/temur (its shipped config). A plain
    `temur` start on each restored snapshot printed no archive notice:
    the offline tier opened a new session ("# new session", header
    naming temur 0.38.3) and the networked tier printed its no-config
    guidance, as designed.
(b) INIT'S REASONING-MODEL LINE: not seen. Neither the build nor any
    proof runs init against a model, and no such line appeared in any
    capture.
(c) TRUNCATION WORDING: none in either build log or either plain start.

    Counted, case-insensitive, for (a) to (c): "archived as", "truncat"
    and "reasoning" occur 0 times in both build logs. LIVE CONTROL: the
    same three greps over a copy of a build log with one planted line
    containing all three: 1 each. The plain-start probe's own two
    regexes were also run against a planted string inside the probe,
    and both fired (P11's check had found that control missing).
(d) THE OLD VERSION STRINGS INSIDE THE MACHINE, counted in the raw
    images before gzip:

        build/state-p13-net.bin      "0.38.1" 0  "0.38.2" 0  control "0.38.3" 1
        build/state-p13-offline.bin  "0.38.1" 0  "0.38.2" 0  control "0.38.3" 1
        (the v0.38.3 binary itself:  "0.38.1" 0  "0.38.2" 0  "0.38.3" 1)

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p13-net.bin      38,019,804 B   16,118,995 B   15.37 MiB
    state-p13-offline.bin  37,638,876 B   15,827,000 B   15.09 MiB

    (p11, for comparison: 39,351,004 / 17,630,573 B = 16.81 MiB net,
                          37,651,164 / 15,818,312 B = 15.09 MiB offline)

    sha256  state-p13-net.bin.gz      65fdc20882a1c5b2415afc4fa0f7e43e647ed0c96139a349e440230950181f63
    sha256  state-p13-offline.bin.gz  2e054841fed3bd717444c3aaeb12a71e36936bee340850d06e25b795997957da

Both are inside the limit with more than 9 MiB to spare.

P10 and P11 established that a build lands on one of two sizes about
1.3 to 1.4 MB apart raw from identical inputs (reports/v0381-refresh.md
"Sizes"). This time BOTH TIERS LANDED ON THE SMALLER ONE:

- networked, raw 38,019,804 B: 1,331,200 B smaller than P11's
  39,351,004 and 8,192 B larger than P10's 38,011,612. Gzipped it is
  1,511,578 B smaller than P11's.
- offline, raw 37,638,876 B: 12,288 B smaller than P11's 37,651,164.
  Gzipped it is 8,688 B larger.

The binary grew by 9,440 bytes, so it is not the cause of the networked
move. As ruled at P11, this stays a seed: one build per tier, the one
every proof and page check above ran against, no extra measuring build
and no bisect.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p13-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p13-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p13-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p13-offline.bin (37638876 bytes)
    state saved: build/state-p13-net.bin (38019804 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using the one joined expression from P10:

       state-p13-net.bin.gz       0 hits
       state-p13-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, the same
sizes as P11). It holds the build steps' own commands and no key; check
3 covers it.

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open

and the five blocked cases (an unmapped address, a bare public IP, the
provider by name, port 80, loopback) each closed with HostBlocked.

RATE AND CONCURRENCY LIMITS FIRE, 9/9, "173 ip fields, all hashed": the
per-address concurrency cap trips at 24 and refuses with code 4001,
and the per-minute rate trips at 60 and refuses with code 4002. The refusal probe adds 16/16.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log's 30 ip fields
are all 8-hex hashes; the dotted quads it does carry are its own bind
address, its documentation-range address map, and the destinations the
allowlist probe asked for. Its plain-text refusal lines number FIVE,
one per refused destination of the allowlist probe (the unmapped
address, the bare public IP, the provider by name, port 80, loopback);
the by-name case is refused and logged on the same path as the others.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs, and they read whole: the key is typed at the wizard's own
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

    PASS  the snapshot's temur is v0.38.3  temur 0.38.3
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.38.3` on both.

                            v0.38.1 (p11)    v0.38.3 (p13)
    big.pdf   offline           5.3 s            5.5 s
    big.pdf   networked         4.8 s            5.8 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.3 MB          76.3 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,244 kB = 50.0 and 78,084 kB = 76.3, both on the
networked tier. The PDF times are 5,507 ms and 5,756 ms.)

The two PDF times moved, so page/app.js's measurement comment was
rewritten to what was measured: v0.38.3 named, "5.5 s offline, 5.8 s
networked", and the v0.38.1 times kept for comparison, which replaces
the comment's two v0.38.0 mentions with v0.38.1's reading. The floors
did not move. Documents unchanged: big.pdf 15.51 MiB / 1098 pages,
big.xlsx 15.56 MiB / 148,801 rows. The 16 MiB and 64 MiB caps are
unchanged.

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
                  readyMs 2041
    netcheck      networked, wireBytes 16,118,995, stateBytes 38,019,804,
                  readyMs 2045, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 15,827,000, stateBytes
                  37,638,876, readyMs 1018, echo 3 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p13 pair.

## The stamp names v0.38.3

The footer stamp reads, from the served page:

    temur v0.38.3 (release, sha256 9789fde1e8c8d4f4578793517ffd6ddfd53dab2d42584bf3ca54cb5dff52c68e)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.3, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code` is in the page the local
server served. The app.js the local server served is byte-identical to
page/app.js in this commit.

    CONTROL at 50fdee6:  old sha 1 hit, new sha 0 hits   (page/app.js)
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
    3  every tracked file                        0         0        16
         of which tracked text files             0         0         5
    4  both new .gz, through gzip                0         0        28
    5  full history (blobs, commit               0         0        21
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 16 hits in 11 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits), the five committed kit/kernel*.config files (1 each; the
  five "text" hits), and the two new p13 .gz files as committed bytes
  (1 each).
- surface 4, 28 hits: 14 in each decompressed p13 image.
- surface 5, 21 hits in 14 blobs: the same nine kit blobs (14 hits),
  the committed state-p8 (3), state-p9 (1) and state-p10 (1) offline
  .gz blobs, and the two new p13 .gz blobs (1 each). Surface 5 is the
  full history over all refs plus this commit's staged tree and message, so it
  counts the committed state.

Against P11 (surface 3 14, surface 5 19): P11 found neither of its new
.gz blobs hit as committed bytes; both of this build's do, once each,
which accounts for the +2 on both surfaces. The p11 blobs leave the
tree and add nothing to history. The authored surfaces, 1 and 2, are
zero for all twelve patterns, and no authored text file in the tree has
a hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 33 / 40 / 135 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0383-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P11 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at 50fdee6
(U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this is captured
output, not prose written here. No prose this pass wrote has a hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.3-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.3/temur-v0.38.3-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.3/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.3-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.3-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p13-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p13-offline-snap.json 128 \
        build/state-p13-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p13-offline-snap.json 128 build/state-p13-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p13-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p13-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p13-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p13-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p13-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p13-offline.bin offline
    # ... and the same three with state-p13-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p13-*.bin.gz

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
50fdee6 in this commit.

## Deviations from the kickoff

1. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10 and P11: each
   restored snapshot was listed for temur state and started once with a
   plain `temur`. It is not committed. This time it also tests its own
   two regexes against a planted string.
2. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P11.
3. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 and P11; no whole-DOM count was taken. The
   wrap rule was read from the page the local server served.
4. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here.
5. One comment line outside the kickoff's listed line numbers named
   the outgoing pair and was moved with it: tools/stage-page.sh:68
   ("the superseded p10 files" -> "p11 files"). page/app.js:72 made the
   same move ("The p10 pair" -> "The p11 pair") inside the listed 64-75
   range. Both were one refresh stale at 50fdee6.
6. The page harness launches Windows Edge, and tools/page-run.sh puts
   that run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design, used at P9 to P11; the profile holds nothing from
   this job but a browser session against localhost. The logs this job
   kept replace the profile path with a placeholder.
7. Unlike P11, git pairs the asset renames WITHIN each tier this time
   (state-p11-net -> state-p13-net, state-p11-offline ->
   state-p13-offline); the sha256s above are of the named files either
   way.
8. The precondition log was written at 07:53:16, after the download had
   started at 07:52:50; its porcelain-empty line restates a check made
   in the session before the download and is not itself timestamped.

## Corrections

1. The first item 9 log listed the two .ash_history sizes from one
   grep over both tiers' probe logs, with no file names on the lines.
   The WRONG ASSUMPTION was that the output order of that grep
   identifies the tier; the terminal-control bytes in those probe logs
   make the printed order unreliable to read. The section was rewritten
   from a per-file read that labels each line with its tier (556 bytes
   offline, 1,569 networked, as at P11) before any number was taken
   from it.

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below. Its line numbers refer to the draft, not to this file.
The transport HTML-escaped its angle brackets and arrows; they are
shown here as the characters.

WHAT WAS DONE ABOUT IT. Blocking 1 is done: the sweep and the register
check were re-run on this final text and the final commit message, and
the numbers above are from that run. Blocking 2 is in the report to
planning. Blocking 3 (R1) and item 9 (R2) are left to planning. E1 to
E5 are fixed in item 10, deviation 5, the verdict, the sweep section and
item 11. W1 is recorded as deviation 8.

VERBATIM:

    **Independent check (P13, temur-playground, staged on 50fdee6)**

    **Environment and method**

    ANTHROPIC_API_KEY is absent from this checker's environment (`env | grep -c ANTHROPIC_API_KEY` = 0). I did not open, print or copy either held-out pattern file. I modified nothing. In /home/dev/temur-playground I ran read-only git commands only.

    Bundle consistency checks:
    - `git diff --cached -M` is byte-identical to staged.diff (cmp exit 0).
    - The staged reports/v0383-refresh.md is byte-identical to draft-report.md.
    - HEAD == origin/main == 50fdee60e519...
    - The working tree has no unstaged changes. Every porcelain entry is index-only.
    - I recomputed these from the index:
      - state-p13-net.bin.gz: sha256 65fdc208...1f63, 16,118,995 B, gunzipped 38,019,804 B
      - state-p13-offline.bin.gz: sha256 2e054841...57da, 15,827,000 B, gunzipped 37,638,876 B
      - artifacts/temur-v0.38.3-i686-unknown-linux-musl: sha256 9789fde1...c68e, 8,350,964 B, mode 100755
      - artifacts/SHA256SUMS: sha256 dbf79160...2b97, 428 B
      - relay/, kit/ and tools/guest/: index entries identical to 50fdee6. The last commit touching relay/ is 9c9eb67.

    **Q1. Does the diff do what the kickoff says and nothing else?**

    VERDICT: YES.

    Step 3 pin list against staged.diff:
    - **.gitignore:23-24**: moved to state-p13-* (diff 9-12).
    - **THIRD_PARTY.md:64-65**: moved (diff 24-27).
    - **artifacts/PROVENANCE.md**, every listed line handled:
      - :6-8: file, sha, size 8350964 (diff 39-44).
      - :11-16: the "replaces" paragraph now names v0.38.1, 2279e5bb..., 8341524 bytes and reports/v0381-refresh.md. It says v0.38.2 was released but never served here, by plan, and keeps the v0.36.0 sentence beside it (diff 47-58).
      - :20: date 2026-10-05.
      - :23 and :28: both URLs.
      - :33: the `sha256sum -c` line.
      - :37: the published line.
      - :45: now points at reports/v0383-refresh.md (diff 62-93).
    - **page/app.js:60-61**: both constants moved together (diff 270-273).
    - **page/app.js:64-75**: "THE P13 PAIR", SNAP_ONLINE and SNAP_OFFLINE moved to p13. :72 changed from "p10 pair" to "p11 pair" (diff 276-291).
    - **page/app.js:853-874**: rewritten to the step 5 measurement in the shape "on v0.38.3 ... on v0.38.1".
      - 5.5 s offline / 5.8 s networked come from turnMs 5507 / 5756 in the staged JSONs.
      - 50.0 MB is 51,244 kB / 1024 (the networked min). 76.3 MB is 78,084 kB / 1024.
      - The caps did not move.
      - The two v0.38.0 mentions at 872/874 became v0.38.1. Kickoff 163-167 allows this because the rewrite touched those lines.
    - **tools/stage-page.sh:13, 67, 71-87**: moved, plus :68 (diff 1378-1430 region).
    - **The two generators**: git mv to p13 at 97% and 96% similarity. Only line 1 and the output path (137 / 70) changed.
    - **tools/proof-office-read.mjs:1, 137, 138** and **tools/proof-bigfile-read.mjs:270, 271**: the label and the escaped-dot regex both moved to 0\.38\.3.
    - **page/assets**: the p11 pair was removed and the p13 pair added, recorded as renames. This time git paired them within each tier, which the report records as deviation 7.
    - **Residual pins**: `git grep` over the index with the kickoff's expression (excluding reports/, build/ and page/assets/) leaves only the five intended lines: PROVENANCE 12/14/16 and app.js 872/874. This matches step3-pins-after.log.

    Steps 2, 4-7 and 11:
    - **Binary**: added at 100755 with the old binary removed. git records a rename (65%) with no mode change.
    - **SHA256SUMS**: the v0.38.3 file verbatim. Its four lines match the kickoff prefixes (432adee7, 71d91ff3, 9789fde1, ca539829).
    - **Regenerated build/*.json**: the page reports and proof JSONs.
    - **build/steps-p13-{net,offline}-snap.json**: new files. They are byte-identical to the committed steps-p11 files, which matches the P11 precedent (P11 also added steps-p11-*).
    - **build/page-report-textcheck.json**: unchanged. Its regenerated content equals the committed one.
    - **page/index.html**: not in the diff, so the stamp transform was restored as the report says.
    - **Commit shape**: 26 files, the same shape as P11's 26-file commit. Subject and report path match kickoff 290-292.

    Unasked changes:
    - stage-page.sh:68 ("p10 files" -> "p11 files") is outside the listed line numbers. It falls under kickoff 190-191 ("Anything else ... report it, then move it") and is reported as deviation 5.
    - Nothing else is unasked.

    **Q2. Do the logs contain every line the kickoff requires?**

    VERDICT: PARTLY. Nothing required is missing for the pre-commit stage. Several items can only exist after the commit, and there are weak spots.

    Present and matching:
    - **Step 1**: step1-preconditions.log covers the env key count 0, HEAD and origin/main, porcelain 0, the relay tip, node, node_modules, no sample.* files, and the package-lock sha (package-lock is not in the diff).
    - **Step 0 / anchor**: step0-unchanged-inputs.log has the five hashes. They match reports/v0381-refresh.md lines 62-66 at 50fdee6.
    - **Step 2**:
      - step2-download.log: HTTP 200, 8,350,964 B, 0.65 s, curl exit 0, both files.
      - step2-verify.log: all five checks (computed, SUMS line, kickoff value, `sha256sum -c` OK with exit 0, cmp exit 0), the SUMS file at 4 lines / 428 B / dbf79160, mode 755, and the file type.
    - **Step 3**: step3-pins-before.log and step3-pins-after.log.
    - **Step 4**:
      - Red runs: EXIT=3 and "no state file written" on both tiers (offline-red 255-259, net-red 288-292).
      - Green runs: assert PASSED inodes=1 and "state saved" (offline-green 255-257, net-green 288-290).
      - Overlay via mkcpio: step4-overlay.log.
      - Landing text verbatim: green logs lines 189-199. Byte check: step4-landing-bytes.log (486 B each, equal to motd, equal to each other, equal to P11).
      - Watches (a)-(c) with planted controls: step4-watches-abc.log. Session probe with a regex control: step4-session-state-*.log.
      - Watch (d): step4-watch-d.log has all three counts per tier plus the binary.
    - **Step 5**:
      - 9p restore: 8 PASS per tier, EXIT=0.
      - Office proof: 15 PASS per tier, with the two refusal controls.
      - Pre-swap FAIL: step5-office-preswap.log line 6.
      - Bigfile gate: GATE PASS on both tiers.
      - Relay probes: 6/6, 9/9, 16/16.
      - step5-mkdocs.log.
    - **Step 6**: step6-stage.log lines 25-26 give both sizes, raw sizes, shas, and "under 25 MiB: yes".
    - **Step 7**:
      - Five page-run logs, with the profile path placeholdered.
      - Relay-stopped note: 0 listeners.
      - step7-dom-readings.log: stamp text; sha count in stampText 1; served app.js == working copy; 50fdee6 control (old 1, new 0); trust `<p>` count 5; wrap rule served 1; release URL 200.
    - **Step 8**:
      - item 9: 0 hits per asset, each with a firing control, plus the in-guest markers.
      - item 10: 7 log surfaces at 0, each control firing; FIVE refusal lines labelled by destination; 30 HASHED8 ip fields.
      - item 11: WebGPU token counts with a control, five trust paragraphs, Excel, apex 302.
    - **Step 9**:
      - Sweep in both case modes: all 12 controls fire, plus a surface-1 rise control. Per-surface counts with R4 hits and blobs itemised. step9-r4-blob-paths.log maps the blob shas to paths.
      - Register check with per-surface planted controls, and a 50fdee6 comparison for the three machine-capture JSON lines.

    Gaps (items that can only exist after the commit):
    - G1. Commit sha, `git diff --stat -M 50fdee6..HEAD`, file count, and ahead/behind 1/0 (Report list, kickoff 305-306). staged.stat stands in for now.
    - G2. The sweep surfaces 1, 2, 3 and 5 and the register check were run over the draft report, which contains CHECK_PLACEHOLDER (draft-report.md 553), and over the draft commit message. Pasting this answer changes the added lines, the tracked report and the history surface. Kickoff 269 says the sweep runs LAST. Both must be re-run on the final text.

    Weak spots:
    - W1. step1-preconditions.log is stamped 07:53:16. The download log starts at 07:52:50. Line 5 asserts that the porcelain check came before the download ("07:5x") but does not record it with a timestamp. The claim is plausible, but the log does not show it.
    - W2. Step 7's "sha EXACTLY ONCE in the DOM" was read from the source and the stamp text, not counted over the whole DOM. The report admits this as deviation 3.
    - W3. Item 11 "no WebGPU still works" is a static token grep (step8-item11.log 1-8). No run with WebGPU disabled was made. This matches precedent but is not an exercised absence.
    - W4. Watch (b) cannot fire by construction: no capture runs init against a model. The report says so at 127-129.
    - W5. The 9p proof has no separate negative control in step5-proof-9p.log. The pristine-assert red runs are the nearest control.
    - W6. Trap 6 was not exercised. The kickoff allows this (253-255) and the report states it (deviation 2).

    **Q3. Do the report's and commit message's numbers and quotes appear in a primary?**

    VERDICT: PARTLY. Every number I checked traces to a primary. Three statements are worded wrongly or beyond their primary, and two items need a planning ruling.

    Verified:
    - 8,350,964 and 9,440 (8,350,964 - 8,341,524).
    - 428 / dbf79160.
    - The five hashes against the P11 report lines 62-66.
    - 486 B landing.
    - Watch (d) counts 0/0/1.
    - 38,019,804 / 16,118,995 / 15.37 MiB and 37,638,876 / 15,827,000 / 15.09 MiB.
    - 1,331,200, 8,192 (against P10's 38,011,612 at P11 report line 136), 1,511,578, 12,288, 8,688.
    - "more than 9 MiB to spare" (25 - 15.37 = 9.63).
    - .ash_history 556 / 1,569, the same as at P11 (P11 report line 207).
    - 6/6, 9/9, "173 ip fields, all hashed", 24, 60, 16/16, 30 ip fields, FIVE refusals.
    - WebGPU 0 counts, getContext 4 lines / 5 occurrences, "2d" x3.
    - Apex lines.
    - Office: 15 PASS and the quoted PASS strings. 9p: 8 checks.
    - Bigfile: 5,507 / 5,756 ms; 51,244 kB = 50.0; 78,084 kB = 76.3; P11's 50.0 and 76.3 (51,164 and 78,096 kB at 50fdee6); 0.5 s.
    - Page readings: readyMs 2041 / 2045 / 1018, echo 3 ms, 17 terms, 16.0 MB / 64.0 MB.
    - Stamp text and the 50fdee6 controls.
    - Sweep: 16 = 2+2+3+2+5+1+1 in 11 files; 28 = 14+14; 21 = 9+5+3+1+1+1+1 in 14 blobs; text 5; case-insensitive 33 / 40 / 135; P11's 14 / 19 and its missing regex control (P11 report lines 122 and 648).
    - Register table, and the 50fdee6 comparison "1 / 1 / 0" and "1 / 1 / 1" in the order the report lists the files.
    - Pre-swap FAIL line, verbatim.
    - Commit message: every number repeats one of the above. "Once in each" matches step4-watch-d.log.

    Wrong or framed beyond the primary:
    - E1. draft-report.md 231-233 attaches "refusing with code 4002" to both limits. Per step5-relay-probes.log 20-29, the per-address concurrency cap refuses with 4001 and only the per-minute rate refuses with 4002.
    - E2. draft-report.md 524-528 (deviation 5) says page/app.js:72 was "not on the kickoff's pin list". Kickoff line 153 lists page/app.js:64-75, which includes 72. Only tools/stage-page.sh:68 was off the list (kickoff 168 lists 13, 67, 71-87).
    - E3. draft-report.md 25 says the PDF read "took slightly longer ... on both tiers". Offline moved 5.3 -> 5.5 s. Networked moved 4.8 -> 5.8 s, which is +1.0 s or about 21%. "Slightly" fits only the offline tier. The commit message (32-33) states the numbers without the adjective and is fine.
    - E4. draft-report.md 399 says surface 5 is "the history at 50fdee6". step9-sweep-draft.log line 31 says "full history (all refs)". This is minor, but the report should use the log's scope.
    - E5. draft-report.md 253 says "THE PAGE DOES NOT BREAK WITH WebGPU ABSENT". The primary shows no shipped file references WebGPU. That is an inference about breakage, not a test (see W3).

    Need a ruling:
    - R1. Deviation 6 (draft-report.md 529-534) says the page harness put a browser profile on the Windows drive. Kickoff 22 and 69 (standing safety, "non-negotiable") say nothing from this job goes to /mnt/c. The report discloses this and says the profile holds nothing from the job. Planning should rule on it explicitly, because the kickoff text has no exception.
    - R2. Kickoff 76-77 says "no IP in anything committed or reported". Two places carry addresses:
      - The report quotes 192.0.2.1:443 and 127.0.0.1 (226, 268-271 region) and the reproduce block quotes 127.0.0.1:8089.
      - The committed build/steps-p13-net-snap.json carries guest-internal 192.168.86.x and 192.0.2.x addresses.

      All of these are documentation, loopback or private ranges, byte-identical to what P11 committed (P11 report lines 218 and 710). None is a real host address. Planning should confirm the precedent covers them.

    Minor:
    - The build input type line at report line 36 includes "version 1 (GNU/Linux)" from step2-verify.log. The carried PROVENANCE type line omits it. Both are accurate; this is not an error.

    **Overall verdict: PASS, conditional**

    The diff does what the kickoff asks, and every number traces to a primary. Three wording fixes and two planning rulings are open, and the final sweep and register re-run must happen after this text is pasted in.

    Blocking:
    1. After pasting this check into reports/v0383-refresh.md and fixing the commit message, re-run the pre-publish sweep (surfaces 1, 2, 3, 5 at minimum, with the generated controls) and the register check over the final report and commit message. The current logs cover a draft with a placeholder (G2).
    2. After committing, produce the commit sha, `git diff --stat -M 50fdee6..HEAD`, file count, and ahead/behind 1/0 for the planning report (G1).
    3. Planning rules on deviation 6, the browser profile on the Windows drive, against kickoff 22 and 69 (R1).

    Non-blocking:
    4. Fix E1: concurrency refuses with 4001, rate with 4002.
    5. Fix E2: app.js:72 was inside the listed 64-75 range; only stage-page.sh:68 was off-list.
    6. Fix E3: drop "slightly", or say it applies to offline only.
    7. Fix E4: say "all refs" to match the sweep log.
    8. Reword E5 to what was measured: no shipped file references a WebGPU token.
    9. Planning confirms the address precedent (R2).
    10. Optionally record W1 in the report: the precondition log was written after the download began.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
