# P11: the served snapshots move to temur v0.38.1

## Verdict

Both served snapshots are rebuilt on the released v0.38.1 i686-musl
binary. The kernel and the three guest overlay files are hash-identical
to the P10 record, and the relay is untouched (its tip is still 9c9eb67
and relay/ has no diff): only /usr/bin/temur moved. state-p10-* becomes
state-p11-*, and every live reference moves in the same commit.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are byte-identical
to tools/guest/motd and to the text P10 captured. None of the notices
watched for appears, and the old version string is absent from both raw
images while the new one is present. The page harness reads back the
exact byte counts of the two NEW assets, which is what shows the p11
pair is served rather than a cached p10 one.

Three things are recorded rather than smoothed over. The two-size
behaviour P10 measured on the networked tier now shows on the offline
tier too: this offline build came out 1.32 MB smaller raw than P10's,
and a rebuild from identical inputs came out near P10's size (39,035,608
against 38,974,172 B raw; measured, not explained, and not bisected). Three measured numbers under the file-cap
comment moved slightly, and the comment was rewritten around them. The
sweep's only nonzero pattern is R4 on binary and kernel content, under
the standing P9 ruling. This commit is not a decision to publish.

## The build input

    file    temur-v0.38.1-i686-unknown-linux-musl
    sha256  2279e5bbf486cc90f720e3d843c95f9ce3d3dd2341adf77ee3661877560e0740
    size    8,341,524 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL. The hash is checked FIVE ways before the binary is used:

    computed from the downloaded file   2279e5bb...0740
    the published SHA256SUMS line       2279e5bb...0740
    the value planning supplied         2279e5bb...0740
    sha256sum -c in artifacts/          temur-v0.38.1-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read proof asks the
restored snapshot's own temur for its version, on both tiers, and got
`temur 0.38.1`. That check FAILED first on the offline tier, while still
pinned to 0.38.0, which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.0  temur 0.38.1

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 f21dfb3ddb9badf75c830ef4c123b6722fb3e57a14617255e01f7a1104aac3f7,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim.

v0.38.0 was 8,338,132 bytes, so the binary GREW by 3,392 bytes. The
download arrived mode 644 and was set to 755; the rename carries no mode
change.

## What did NOT change

    kit/bzImage-p6         680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz     4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd       d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files   1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

All five hash identically to the values in reports/v038-refresh.md, so
G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the page checks and the three probes.

The two step files the generators write, build/steps-p11-net-snap.json
and build/steps-p11-offline-snap.json, are byte-identical to P10's
steps-p10-* files: the renamed generators changed their header and
output path only.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other and to P10's captures.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P10. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
unchanged from P10's committed report, and landingcheck reports
cleanLanding true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. /root/.local does
    not exist in either snapshot, and the only paths named like temur
    are /etc/temur-motd, /usr/bin/temur and, on the offline tier,
    /root/.config/temur (its shipped config). A plain `temur` start on
    each restored snapshot printed no archive notice: the offline tier
    opened a new session ("# new session", header naming temur 0.38.1)
    and the networked tier printed its no-config guidance, as designed.
(b) INIT'S REASONING-MODEL LINE: not seen. Neither the build nor any
    proof runs init against a model, and no such line appeared in any
    capture.
(c) TRUNCATION WORDING: none appeared in either build log or either
    plain start.

    Counted, case-insensitive, for (a) to (c): "archived as", "truncat"
    and "reasoning" occur 0 times in both build logs and 0 times in both
    plain-start probes (excluding the probe's own summary line, which
    names the words it looks for). LIVE CONTROL: the same three greps
    over a build log with one planted line containing all three: 1 each.
    The probe's own regexes were not given a planted match.
(d) THE OLD VERSION STRING INSIDE THE MACHINE, counted in the raw images
    before gzip:

        build/state-p11-net.bin      "0.38.0" 0   control "0.38.1" 1
        build/state-p11-offline.bin  "0.38.0" 0   control "0.38.1" 1
        (the v0.38.1 binary itself:  "0.38.0" 0   "0.38.1" 1)

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p11-net.bin      39,351,004 B   17,630,573 B   16.81 MiB
    state-p11-offline.bin  37,651,164 B   15,818,312 B   15.09 MiB

    (p10, for comparison: 38,011,612 / 16,108,107 B = 15.36 MiB net,
                          38,974,172 / 17,338,758 B = 16.54 MiB offline)

    sha256  state-p11-net.bin.gz      1abe815df49548a3fa2bc21202ad74662eedf2e2303f8eed1d47c44e7b8280ef
    sha256  state-p11-offline.bin.gz  7c3cf068d84147d6efba1284ecfdafc97ca0a94b7166919a1a543e332ac7782f

Both are inside the limit with more than 8 MiB to spare.

THE NETWORKED BUILD LANDED ON THE LARGER OF P10's TWO SIZES: its raw
state, 39,351,004 B, is the exact byte count of P10's "rebuild 1". It is
committed as built; nothing was rebuilt to match P10's served size.

THE OFFLINE ASSET MOVED BY MEGABYTES, raw -1,323,008 and gzip
-1,520,446, which the kickoff names as a question to report. It was
measured with one further build from identical inputs, then deleted:

    build (compressed in-process, gzip level 9)   raw           gzip        zero 4 KiB pages
    shipped (proved) offline build                 37,651,164 B  15,808,077  797/9193 = 8.67 percent
    offline rebuild 1                              39,035,608 B  17,352,071  798/9531 = 8.37 percent
    networked tier, for scale                      39,351,004 B  17,630,179  795/9608 = 8.27 percent

(this table's gzip column is Python's in-process compressor, so it
differs by up to about 10 KB from the gzip(1) figures above.)

So in these two builds the offline tier landed on two sizes about
1.4 MB apart raw (1,384,444 B; 1.5 MB gzipped), and P10's asset sat near
the larger one. The binary is not the cause: it
grew by 3,392 bytes. The mechanism is not established. The shipped asset
is the build every proof and page check above ran against.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p11-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p11-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p11-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p11-offline.bin (37651164 bytes)
    state saved: build/state-p11-net.bin (39351004 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using the one joined expression from P10:

       state-p11-net.bin.gz       0 hits
       state-p11-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, the same
sizes as P10). It holds the build steps' own commands and no key; check
3 covers it.

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open

and the five blocked cases (an unmapped address, a bare public IP, the
provider by name, port 80, loopback) each closed with HostBlocked.

RATE AND CONCURRENCY LIMITS FIRE, 9/9, "173 ip fields, all hashed". The
refusal probe adds 16/16.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log's 30 ip fields
are all 8-hex hashes; the dotted quads it does carry are its own bind
address, its documentation-range address map, and the destinations the
allowlist probe asked for.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs, and they read whole: the key is typed at the wizard's own
hidden prompt inside the machine, the page passes keystrokes there and
nowhere else, files reach the provider on the networked tier, and the
relay holds ciphertext.

THE PAGE DOES NOT BREAK WITH WebGPU ABSENT. No shipped file references
it:

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

    PASS  the snapshot's temur is v0.38.1  temur 0.38.1
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured

GATE PASS on both tiers.

                            v0.38.0 (p10)    v0.38.1 (p11)
    big.pdf   offline           5.0 s            5.3 s
    big.pdf   networked         5.0 s            4.8 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.2 MB          76.3 MB

The two PDF times and the spreadsheet floor moved, so page/app.js's
measurement comment was rewritten to what was measured: v0.38.1 named,
"5.3 s offline, 4.8 s networked", "never left 76.3 MB", and the v0.38.0
times kept for comparison. Documents unchanged: big.pdf 16,264,413 B /
15.51 MiB / 1098 pages, big.xlsx 16,317,903 B / 15.56 MiB / 148801 rows.
The 16 MiB and 64 MiB caps are unchanged.

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
                  readyMs 2291
    netcheck      networked, wireBytes 17,630,573, stateBytes 39,351,004,
                  readyMs 3119, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 15,818,312, stateBytes
                  37,651,164, readyMs 1023, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p11 pair.

## The stamp names v0.38.1

The footer stamp reads, from the served page:

    temur v0.38.1 (release, sha256 2279e5bbf486cc90f720e3d843c95f9ce3d3dd2341adf77ee3661877560e0740)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.1, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code { overflow-wrap: anywhere; }`
is in the page the local server served.

    CONTROL at 09f44d9:  old sha 1 hit, new sha 0 hits   (page/app.js)
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
    3  every tracked file                        0         0        14
         of which tracked text files             0         0         5
    4  both new .gz, through gzip                0         0        28
    5  full history (blobs, commit               0         0        19
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content: kit/bzImage
and bzImage-p2, -p3, -p4, the five committed kit/kernel*.config files
(the five "text" hits), and the snapshot assets decompressed. The
authored surfaces, 1 and 2, are zero for all twelve patterns, and no
authored text file in the tree has a hit. Surface 5 is the history at
09f44d9 plus this commit's staged tree and message, so it counts the
committed state. It is 19, the same as P10's: the five history hits
beyond the kit, in three blobs, are the committed state-p8 (3), -p9 (1)
and -p10 (1) offline .gz blobs, and neither new p11 .gz blob hits as committed bytes. Surface 3
is one lower than P10's 15 for the same reason: the p10 offline blob
left the tree.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 36 / 41 / 121 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0381-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 and P10 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at 09f44d9
(U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this is captured
output, not prose written here. No prose this pass wrote has a hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.1-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.1/temur-v0.38.1-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.1/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.1-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.1-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p11-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p11-offline-snap.json 128 \
        build/state-p11-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p11-offline-snap.json 128 build/state-p11-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p11-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p11-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p11-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p11-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p11-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p11-offline.bin offline
    # ... and the same three with state-p11-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p11-*.bin.gz

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
09f44d9 in this commit.

## Deviations from the kickoff

1. THE OFFLINE SIZE was measured with one extra build rather than
   accepted silently or rebuilt until it matched P10. The first build,
   the one every proof ran against, is the one committed; the rebuild
   was measured and deleted. See "Sizes".
2. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10: each restored
   snapshot was listed for temur state and started once with a plain
   `temur`. It is not committed.
3. GIT PAIRS THE ASSET RENAMES ACROSS TIERS. `git diff -M` shows
   state-p10-offline.bin.gz -> state-p11-net.bin.gz and
   state-p10-net.bin.gz -> state-p11-offline.bin.gz, because rename
   detection pairs by similarity and the two tiers swapped sizes. The
   files themselves are right: the sha256s above are of the named files.
4. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 and P10.
5. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10; no whole-DOM count was taken. The wrap rule was
   read from the page the local server served, not from the file alone.
6. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here.

## Corrections

1. A first count of the relay log's plain-text refusal lines was
   labelled "the four off-list probe targets" when it counted five. The
   WRONG ASSUMPTION was that the probe's by-name case is refused
   elsewhere; it is refused by the same code path and logged the same
   way. The line was replaced in item10.log (so the first label survives
   only in the session transcript) with one that lists all five
   destinations, before any number was taken from it.
2. The draft of this report said "the three history hits beyond the
   kit" in the sweep section; the independent check found it is five
   hits in three blobs. The WRONG ASSUMPTION was one hit per blob.
   Fixed above, with the drafted size wording the check flagged
   ("P10-sized", "about 1.3 MB", "a few KB").

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below, including its FAIL verdict on the draft. Its line
numbers refer to the draft, not to this file.

WHAT WAS DONE ABOUT IT. B1 is fixed in the sweep section. B2 is done:
the sweep and the register check were re-run on this final text and
this final commit message, and the numbers above are from that run. N1
to N4 are fixed in the verdict, "Sizes", "The build input" and the
commit message. N5 is half done: a logged count of the three watch words
over both build logs and both plain-start probes, with a planted control
that fired, is now under (c); the probe's own regexes were not re-run
with a planted match, because that needs the machine again. N6 and N9
are followed in the report to planning. N7 (a guest-internal address in
the step file, byte-identical to P10's already-public one) and N8 (the
pre-existing "fourth" in PROVENANCE.md) stand as written and are left to
planning. The transport HTML-escaped the answer's angle brackets; they
are shown here as the characters.

VERBATIM:

    INDEPENDENT CHECK (fresh subagent; given the kickoff, staged.diff/.stat,
    draft report, draft commit message, and the gate/scan logs; read-only
    git on the playground index and on 09f44d9; held-out pattern files not
    opened). ANTHROPIC_API_KEY set in the checker's env: no.

    Q1. Does the diff do what the kickoff says and nothing else?
    Yes. Walking step 3 against staged.diff:
    - .gitignore:23-24 -> state-p11-* . Done.
    - THIRD_PARTY.md:64-65 -> p11 names. Done.
    - artifacts/PROVENANCE.md 6-8, 11-15, 23, 28, 33, 37, "See reports/"
      sentence: all moved (file, sha, 8341524, both URLs, -c line,
      published line, date 2026-09-29). The "replaces" paragraph names
      v0.38.0, 542e56ab..., 8338132, reports/v038-refresh.md. The v0.36.0
      sentence is kept. Done.
    - artifacts/SHA256SUMS: index blob is 428 B, sha256 f21dfb3d...,
      4 lines matching binary-verify.log. Done.
    - binary: git records R066 v0.38.0 -> v0.38.1 at 100755 with no mode
      line. The index blob hashes to 2279e5bb...0740, 8341524 B. Done.
    - page/app.js:60-61 both constants moved together; 64-75 P11 pair,
      SNAP_* -> p11; 853-874 rewritten in the "on v0.38.1 ... on v0.38.0"
      shape, caps untouched. Done. Figures re-derived from the committed
      JSON: 5262 ms -> 5.3 s, 4755 ms -> 4.8 s, 51164 KB/1024 = 49.96 ->
      50.0, 78096 KB/1024 = 76.27 -> 76.3.
    - tools/stage-page.sh 13, 67-68, 71-87. Done.
    - gen-steps-p10-* -> p11 (R097/R096), header and output path only.
      Done.
    - proof-office-read.mjs 1, 137, 138 and proof-bigfile-read.mjs 270,
      271: the label and the escaped-dot regex. Done.
    - page/assets: p10 pair removed, p11 pair added. Index sizes are
      17630573 / 15818312, sha256 1abe815d... / 7c3cf068..., and the
      decompressed sizes 39351004 / 37651164 match the build logs. Done.
    Not on the list, but in scope under "build/*.json per precedent": 10
    regenerated build/*.json, plus two NEW build/steps-p11-*.json whose
    blob ids are identical to steps-p10-*.json at 09f44d9. steps-p10-* stay
    tracked, as steps-p9-* did at P10.
    Missing: nothing. Re-running the kickoff's grep on the index leaves
    only the intended prior-version mentions (PROVENANCE.md:12,14 and
    app.js:872,874). A wider grep for old sizes, "p10" and "0.38" found
    nothing stale. relay/ tree unchanged (last touched 9c9eb67); kit/,
    tools/guest/, page/index.html and page/_headers have no diff.
    Unasked content: none beyond machine captures. The landingcheck stamp
    says "build 09f44d9" (the parent, from a dirty-tree stamp), and the
    selftest ua moved to Edg/154. Both are captured output.

    Q2. Do the logs carry every line the kickoff requires?
    1 preconditions.log: key 0, HEAD = origin/main = 09f44d9..., porcelain
      0, relay tip 9c9eb67, node, node_modules, sample.* 0, lockfile sha.
      Complete.
    2 binary-verify.log: all five checks verbatim, SHA256SUMS 4 lines /
      428 B / f21dfb3d, cmp 0, the three other lines, mode 644 -> 755,
      old file removed by name. Complete.
    G1 g1.log: all five hashes equal reports/v038-refresh.md:59-63 at
      09f44d9. Complete.
    3 pins-before.log / pins-after.log, including the escaped-dot form.
      Complete.
    4 overlay.log, offline-red/green.log, net-red/green.log: RED EXIT=3
      with "no state file written" on both tiers; GREEN inodes=1 with
      states 37651164 / 39351004. landing-bytes.log: 486 = motd on both
      tiers, net == offline, == P10. watch-d.log: 0/1 per tier.
      session-state*.log: (a) NO, (b)/(c) NO.
      Weak: (a)-(c) have no live control. The regexes in
      probe-session-state.mjs:38-39 never ran against a string that should
      match. The report's claim at draft-report.md:114-115 that no
      truncation wording appears in "either build log" has no count line
      in any log. A read-only grep of the build logs for
      archived/truncat/reasoning returns 0 hits, so the claim holds, but
      only by that grep.
    5 proof-9p.log (8 PASS per tier), office-offline/net.log (15 PASS
      each, ALL PASS), office-preswap.log (the recorded FAIL, offline tier
      only), bigfile-offline/net.log (GATE PASS), relay-probes.log (6/6,
      9/9, 16/16). Complete.
    6 stage.log: both sizes, both sha256s, both under 25 MiB.
      size-question.log covers the offline question. Complete.
    7 page-*.log and dom-readings.log: stamp text, release URL 200, the
      new sha 1/0 in the working tree against old 1/0 at 09f44d9 as
      control, trust <p> 5, wrap rule served, netcheck/selftest byte
      read-back. relay-stopped.note: 0 listeners.
      Weak: there is no whole-DOM sha count (declared as deviation 5), the
      release link is resolved from source rather than from the rendered
      href, and no log line shows the report file being deleted before
      each run (trap 5). The page-*.log files carry a local Windows
      user-profile path in their first line; do not quote those lines in
      anything reported.
    8 item9.log, item10.log, item11.log: each scan has a +1 planted
      control that fired. The apex is 302/302 and play is 301 -> 200.
      "No WebGPU still works" is shown only by an absence-of-reference
      grep with a control (P10 precedent); no run had WebGPU disabled.
    9 sweep.log, sweep-nocase.log, register.log: 7/7 and 5/5 controls
      fire, the surface-1 live control rose (17), and all five surfaces
      have counts. Register: per-surface planted controls all rose by 1.
    Report-to-planning list: commit sha, stat -M, file count and 1/0
    ahead/behind do not exist yet (nothing is committed; the stat shows 26
    files). The "five hashes beside the P10 values" are one column plus a
    "match" sentence in draft-report.md:62-69; the planning report should
    print both columns.

    Q3. Does every number and quoted string appear in a primary?
    Re-derived correctly:
    - 8341524-8338132 = 3392.
    - 38974172-37651164 = 1323008 (1.32 MB); 17338758-15818312 = 1520446.
    - 17630573/2^20 = 16.81 MiB; 15818312/2^20 = 15.09; 25-16.81 = 8.19
      MiB (> 8).
    - 797/9193 = 8.67%, 798/9531 = 8.37%, 795/9608 = 8.27%.
    - R4: 14 = 2+2+3+2+5; 28 = 14+14; 19 = 14+1+1+3.
    - P10's 15 and 19: v038-refresh.md:598.
    - 39351004 = P10 "rebuild 1": v038-refresh.md:137.
    - ash_history 556/1569: v038-refresh.md:188.
    - File-cap v0.38.0 column 5.0/5.0/50.0/76.2: v038-refresh.md:267-273.
    - Office 15 PASS, 9p 8 checks, readyMs 2291/3119/1023, echo 2 ms, 17
      terms, 16.0/64.0 MB, 173 ip fields, 30 HASHED8.
    - Register 0/0/0 x3 and 0/2/3, with 09f44d9 per-file values 1/1/0 and
      1/1/1: register.log.
    - Commit message: 5.3/4.8 s, 76.2 -> 76.3, 50.0 unmoved, "0.38.1"
      once per image.
    Wrong against a primary:
    - draft-report.md:367-368 says "the three history hits beyond the
      kit". sweep.log surface 5 shows 3 BLOBS carrying 5 hits (1+1+3;
      19-14 = 5).
    Framed beyond its primary:
    - draft-report.md:153 and draft-commit-msg.txt:26-29. "Also lands on
      one of two sizes about 1.3 MB apart" rests on two offline builds.
      The measured gap is 39035608-37651164 = 1384444 B raw (1.38 MB) and
      1543994 B gzipped, so "about 1.3" understates it and does not say
      raw or gz. P10's check N2 raised the same raw-vs-gz point.
    - draft-report.md:22 and draft-commit-msg.txt:29. "Came out
      P10-sized": 39035608 against P10's 38974172, which is 61 KB off.
      Near, not equal.
    - draft-report.md:150-151. "Differs by a few KB": the offline gap is
      10235 B (about 10 KB); the net gap is 394 B.
    - draft-report.md:44-46 reads as if the pre-swap FAIL happened on both
      tiers; office-preswap.log is the offline tier only.
    - draft-report.md:499-505 (Corrections): the "four vs five" label has
      no primary in the bundle. item10.log shows only the corrected
      five-destination line.
    - draft-report.md:486-487. "Because ... the two tiers swapped sizes"
      is an inference about git's pairing, not a measurement.

    VERDICT: FAIL as drafted (two small blocking fixes; the diff, builds,
    proofs and sweep otherwise verify against primaries).

    Blocking
    B1. draft-report.md:367-368: change "the three history hits beyond the
        kit" to "the five history hits beyond the kit, in three blobs",
        per sweep.log surface 5.
    B2. Pasting this check changes reports/v0381-refresh.md, which sits in
        sweep surfaces 1, 3 and 5 and in the register surface. Re-run
        sweep.py and the register check (with controls) on the final index
        and commit message, so the sweep is still the LAST gate
        (kickoff step 9).

    Non-blocking
    N1. draft-report.md:153 and draft-commit-msg.txt:26-29: say "about
        1.4 MB raw (1.5 MB gzipped)" for the offline pair, and qualify
        "one of two sizes" as seen in two builds.
    N2. draft-report.md:22 and draft-commit-msg.txt:29: "near P10's size
        (39,035,608 vs 38,974,172 B raw)" instead of "P10-sized".
    N3. draft-report.md:150-151: "by up to about 10 KB" instead of "a few
        KB".
    N4. draft-report.md:46: say the pre-swap FAIL was on the offline tier.
    N5. Watches (a)-(c): add a live control to the regexes in
        probe-session-state.mjs, and a logged zero count for the build
        logs.
    N6. Planning report: print the five G1 hashes beside the P10 values;
        add the sha, stat -M, file count and 1/0 after the commit.
    N7. build/steps-p11-net-snap.json carries a private guest address
        (192.168.86.x), byte-identical to the steps-p10 file. This is
        precedent (P10 check), but the kickoff's "no IP" rule should be
        ruled on explicitly.
    N8. artifacts/PROVENANCE.md:43 (unchanged) calls the in-machine check
        "fourth"; the report calls it the sixth. The line is pre-existing,
        but the numbering is inconsistent.
    N9. page-*.log line 1 carries a local user-profile path. Cite those
        logs by basename only and do not quote that line.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
