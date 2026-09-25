# P10: the served snapshots move to temur v0.38.0

## Verdict

Both served snapshots are rebuilt on the released v0.38.0 i686-musl
binary. The kernel and the three guest overlay files are hash-identical
to the P9 record, and the relay is untouched (its tip is still 9c9eb67
and relay/ has no diff): only /usr/bin/temur moved. state-p9-* becomes state-p10-*, and every live reference moves in
the same commit.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are byte-identical
to tools/guest/motd, and none of the three v0.38.0 notices the kickoff
named appears on either tier. The page harness reads back the exact byte
counts of the two NEW assets, which is what shows the p10 pair is served
rather than a cached p9 one.

Three things are recorded rather than smoothed over: the networked
asset came out 1.44 MiB SMALLER than P9's, and a rebuild from identical
inputs came out P9-sized, so the networked build varies by about 1.3 MB
raw and 1.5 MB gzipped from run to run (measured, not explained); one
measured number under the file-cap comment moved, and the comment was
rewritten around it; and the sweep's only nonzero pattern is R4 on binary and
kernel content, under the standing P9 ruling. This commit is not a
decision to publish.

## The build input

    file    temur-v0.38.0-i686-unknown-linux-musl
    sha256  542e56abcf9066e464c5dcef079c4dfba47dc731d11ffd97645af04e48a9c922
    size    8,338,132 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL. The hash is checked FIVE ways before the binary is used:

    computed from the downloaded file   542e56ab...c922
    the published SHA256SUMS line       542e56ab...c922
    the value planning supplied         542e56ab...c922
    sha256sum -c in artifacts/          temur-v0.38.0-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   cmp: IDENTICAL (exit 0)

and a sixth time from inside the machine: the office-read proof asks the
restored snapshot's own temur for its version, on both tiers, and got
`temur 0.38.0`. That check FAILED first, while still pinned to 0.37.0,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.37.0  temur 0.38.0

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 f05b0b179aec2a23ee2e727c88910b1fc13eeeadca327c67f040f93f75c9d185,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim.

v0.37.0 was 8,323,828 bytes, so the binary GREW by 14,304 bytes.

## What did NOT change

    kit/bzImage-p6         680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz     4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd       d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files   1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

All five hash identically to the values in reports/v037-refresh.md, so
G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the page checks and the three probes.

The two step files the generators write, build/steps-p10-net-snap.json
and build/steps-p10-offline-snap.json, are byte-identical to P9's
steps-p9-* files: the renamed generators changed their header and output
path only.

## The landing text, and the product changes watched for

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P9. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
unchanged from the P9 report, and landingcheck reports cleanLanding true
and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. temur keeps
    sessions under ~/.local/state/temur/sessions and neither tier's
    config overrides that; /root/.local does not exist in either
    snapshot, and the only paths named like temur are /etc/temur-motd,
    /usr/bin/temur and, on the offline tier, /root/.config/temur (its
    shipped config). A plain `temur` start on each restored snapshot
    printed no archive notice: the offline tier opened a new session
    ("# new session") and the networked tier printed its no-config
    guidance, as designed.
(b) INIT'S REASONING-MODEL LINE: not seen. Neither the build nor any
    proof runs init against a model, and no new init line appeared in
    any capture.
(c) TRUNCATION WORDING: none appeared. The office proof's captured turn
    is identical to P9's apart from the random command marker.

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p10-net.bin      38,011,612 B   16,108,107 B   15.36 MiB
    state-p10-offline.bin  38,974,172 B   17,338,758 B   16.54 MiB

    (p9, for comparison: 39,318,236 / 17,618,241 B = 16.80 MiB net,
                         38,953,692 / 17,324,904 B = 16.52 MiB offline)

    sha256  state-p10-net.bin.gz      4f3d43759585b4bbb7f939cfaeb190ae0f6f01ca70ba3b2aee0420a7b8fd08f7
    sha256  state-p10-offline.bin.gz  e11d93bb08ef8664f3498ad9db15591a8c113b89f48f42edb3d3586e838c5a71

Both are inside the limit with more than 8 MiB to spare.

The offline asset moved as expected for a 14,304-byte-larger binary:
raw +20,480, gzip +13,854. THE NETWORKED ASSET MOVED BY MEGABYTES, raw
-1,306,624 and gzip -1,510,134, which the kickoff names as a question to
report. It was measured with two further builds from identical inputs:

    build                       raw            gzip -9     zero 4 KiB pages
    shipped (proved) build      38,011,612 B   16,108,107  796/9280 = 8.58 percent
    rebuild 1                   39,351,004 B   17,629,191  793/9607 = 8.25 percent
    rebuild 2                   38,027,996 B   16,127,624  792/9284 = 8.53 percent
    offline tier, for scale     38,974,172 B   17,338,758  801/9515 = 8.42 percent

So the networked build lands on one of two sizes about 1.3 MB apart
from run to run, and P9's asset sat on the larger one. The binary is
not the cause. The mechanism is not established. The shipped asset is
the build every proof and page check above ran against; the two
rebuilds were measured and deleted.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p10-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p10-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p10-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p10-offline.bin (38974172 bytes)
    state saved: build/state-p10-net.bin (38011612 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material:

       state-p10-net.bin.gz       0 hits
       state-p10-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked). It holds
the build steps' own commands, including the path of the throwaway
probe's key file, and no key; check 3 covers it. The step files are
byte-identical to P9's, so this is how P9's snapshots were built too.

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open
    PASS  blocked: 192.0.2.9:443 (unmapped)              expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 1.1.1.1:443 (bare public IP)          expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: api.anthropic.com:443 (by name)       expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 192.0.2.1:80 (port not 443)           expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 127.0.0.1:443 (loopback)              expected=closed:HostBlocked got=closed:HostBlocked

RATE AND CONCURRENCY LIMITS FIRE, 9/9: the per-address concurrency cap
trips at 24 with close code 4001, a DIFFERENT address is unaffected, and
the per-minute rate trips at 60 with code 4002. "173 ip fields, all
hashed". The refusal probe adds 16/16.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log's 32 ip fields are
all 8-hex hashes; the dotted quads it does carry are its own bind
address and the destinations the allowlist probe asked for.

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

    PASS  the snapshot's temur is v0.38.0  temur 0.38.0
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers, which is what stops this proving only
that the read tool says yes to everything. The stub fix P9 made (count
chat POSTs, not connections) held: no change to tools/guest-stub-model.sh.

## The file-cap gate, re-measured

GATE PASS on both tiers.

                            v0.37.0 (p9)     v0.38.0 (p10)
    big.pdf   offline           5.0 s            5.0 s
    big.pdf   networked         4.8 s            5.0 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.2 MB          76.2 MB

One number moved, the networked PDF time, so page/app.js's measurement
comment was rewritten to what was measured: v0.38.0 named, "5.0 s on
both tiers", and the v0.37.0 times kept for comparison. Documents
unchanged: big.pdf 16,264,413 B / 15.51 MiB / 1098 pages, big.xlsx
16,317,903 B / 15.56 MiB / 148801 rows. The 16 MiB and 64 MiB caps are
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
                  readyMs 2015
    netcheck      networked, wireBytes 16,108,107, stateBytes 38,011,612,
                  readyMs 1966, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier as in P9; 17 terms, 0 hits in
                  markup and 0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 17,338,758, stateBytes
                  38,974,172, readyMs 962, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p10 pair.

## The stamp names v0.38.0

The footer stamp reads, from the served page:

    temur v0.38.0 (release, sha256 542e56abcf9066e464c5dcef079c4dfba47dc731d11ffd97645af04e48a9c922)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.0, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code { overflow-wrap: anywhere; }`
is still served.

    CONTROL at 3678135:  old sha 1 hit, new sha 0 hits   (page/app.js)
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
    5  full history (blobs, commit               0         0        19
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content: kit/bzImage
and bzImage-p2, -p3, -p4, the five committed kit/kernel*.config files
(the five "text" hits), and the snapshot assets, as committed .gz files
and decompressed. The
authored surfaces, 1 and 2, are zero for all twelve patterns, and no
authored text file in the tree has a hit. Surface 5 is the history
at 3678135 plus this commit's staged tree and message, so it counts the
committed state. Its one R4 hit more than P9's 18 is the new
state-p10-offline.bin.gz blob.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 33 / 41 / 104 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v038-refresh.md          0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, and the reason is the one P9 declared:
all three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at
3678135 (U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this is
captured output, not prose written here. No prose this pass wrote has a
hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.0-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.0/temur-v0.38.0-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.0/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.0-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p10-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p10-offline-snap.json 128 \
        build/state-p10-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p10-offline-snap.json 128 build/state-p10-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p10-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p10-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p10-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p10-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p10-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p10-offline.bin offline
    # ... and the same three with state-p10-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p10-*.bin.gz

    # both tiers in a real browser, relay up for netcheck, down for selftest
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    sh tools/page-run.sh landingcheck 'landingcheck=1'
    sh tools/page-run.sh netcheck     'netcheck=1'
    sh tools/page-run.sh filecheck    'filecheck=1'
    sh tools/page-run.sh textcheck    'textcheck=1'
    sh tools/page-run.sh selftest     'selftest=1'     # relay stopped first

`tools/stamp.mjs` rewrites page/index.html's asset refs in place as a
build transform. The committed form keeps them BARE, so the file is
restored with stripAssetStamps() before committing; it is byte-identical
to 3678135 in this commit.

## Deviations from the kickoff

1. TWO MORE PROOF LINES MOVED THAN THE KICKOFF LISTED. The kickoff named
   tools/proof-office-read.mjs:1,137 and tools/proof-bigfile-read.mjs:270.
   The assertion itself sits on the next line of each (138 and 271) as
   the regex /temur 0\.37\.0/, which the kickoff's grep for 0\.37\.0
   does not match because the source spells the dots escaped. P9 moved
   the same two lines. Without them the check passes its label and fails
   its test.
2. THE NETWORKED ASSET SIZE was measured with two extra builds rather
   than accepted or rebuilt until it matched P9. The first build, the one
   every proof ran against, is the one committed. See "Sizes".
3. AN EXTRA, OUT-OF-TREE PROBE was run for (a): each restored snapshot
   was listed for temur state and started once with a plain `temur`. It
   is not committed; it adds evidence and changes nothing.
4. THE DOWNLOADED BINARY ARRIVED MODE 644 and was set to 755 to match
   what P9 committed; the rename carries no mode change.
5. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9.
6. The item 9 and item 10 key scans use one expression for key-shaped
   material with a planted control per surface; the expression is not
   reproduced here.

## Corrections

1. The first run of the key scan reported "control fired: NO" on every
   surface while its zero counts were right. The WRONG ASSUMPTION was
   that its key-shaped expressions were disjoint: two of them overlap,
   so one planted string counted twice and the check, which demanded
   exactly one more hit, failed. The expressions were joined into one
   alternation and the scan re-run; the numbers above are from that run.

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below, including its FAIL verdict on the draft.

WHAT WAS DONE ABOUT IT. B1 and B2 are fixed: the abbreviated sha now
ends c922 and the office proof count reads 15. B3 is done: the sweep and
the register check were re-run on this final text and this final commit
message, and the numbers above are from that run. N1 to N3 are fixed in
the verdict and the commit message (the relay is named as untouched at
9c9eb67 rather than hash-identical, the variance is given raw and
gzipped, and the file-cap sentence says the comment was rewritten). N6
is fixed: the register check now also appends its planted line to each
surface and every count rises by one. N4, N5, N7 and N8 stand as
written; N9 is followed in the report to planning. One character
sequence in the answer, an HTML-escaped angle bracket introduced by the
transport, is shown here as the character.

VERBATIM:

    Independent check, P10 (temur-playground snapshot refresh to v0.38.0)

    Scope and environment. I read kickoff.md in full, then staged.diff, staged.stat, draft-report.md, draft-commit-msg.txt and every log, note and script in the check bundle. I checked claims against the temur-playground index and against 3678135 using read-only git commands only. ANTHROPIC_API_KEY is NOT set in this environment. I did not open either held-out pattern file. staged.diff is byte-identical to a fresh `git diff --cached -M` of the index. The staged reports/v038-refresh.md is byte-identical to draft-report.md. HEAD and origin/main are both 36781358f732478e5293b0b0d73790161c334ff3.

    Q1. Does the diff do what the kickoff says, and nothing else?

    I walked the step 3 pin list against staged.diff:
    - .gitignore:23-24: both negation lines are now state-p10-*. DONE.
    - THIRD_PARTY.md:64-65: both served-asset names moved. DONE.
    - artifacts/PROVENANCE.md: DONE. The file name, sha, size 8338132, both download URLs, the sha256sum -c line, the published line, the download date (2026-09-25) and the "See reports/v038-refresh.md" line all moved. The "replaces" paragraph now names v0.37.0 (dbd38057..., 8323828 bytes, reports/v037-refresh.md). The v0.36.0 sentence is kept. Its tail changed from "between those two" to "between v0.35.0 and v0.37.0". That edit is needed so the sentence stays true now that the preceding pair is v0.37.0/v0.38.0, so I read it as within the ask. The "type" line was not touched. It is shorter than file(1)'s output in binary-verify.log:20, but it was not on the list and the omission is pre-existing.
    - artifacts/SHA256SUMS: the index blob is 4 lines, 428 bytes, sha256 f05b0b17...d185, which matches the kickoff. The other three lines match the kickoff prefixes (314c13dc, 3f78fa89, 7529e0a2). DONE.
    - The binary is a rename from v0.37.0 to v0.38.0 with no mode change (100755). The index blob hashes to 542e56ab...a9c922, 8,338,132 bytes. DONE.
    - page/app.js:60-61: TEMUR_VERSION and TEMUR_SHA256 moved together. DONE.
    - page/app.js:64-75: "THE P10 PAIR", SNAP_ONLINE/SNAP_OFFLINE are state-p10-*, and line 72 "p8 pair" became "p9 pair" (inside the listed range). DONE.
    - page/app.js:853-880: rewritten. The 16 MiB and 64 MiB caps did not move. The rewrite is more than a one-number swap: the two-tier time line is collapsed to "5.0 s on both tiers", and the v0.35.0-to-v0.37.0 slower/faster sentence is replaced by a comparison against v0.37.0. Every number in the new text is in bigfile-*.log and the P9 report. Within the kickoff's "rewrite to what was measured".
    - tools/stage-page.sh:13, 67-68, 71-87: DONE.
    - The two gen-steps scripts are git renames. Only line 1 and the output path changed (137 / 70). DONE.
    - tools/proof-office-read.mjs:1,137 and tools/proof-bigfile-read.mjs:270: DONE. Lines 138 and 271 (the escaped-dot regex) also moved. This is disclosed as deviation 1, needed for the assert to test v0.38.0, and matches what 3678135 did for the same lines.
    - page/assets: the p9 pair is gone, the p10 pair is added as renames, and the index sha256s match stage.log. DONE.
    - The build/*.json reports regenerated, per precedent. build/steps-p10-*.json are added as new files, and their blobs are identical to build/steps-p9-*.json at 3678135 (1c07571 / 26e596a). 3678135 did the same thing (added steps-p9, kept steps-p8), so this follows precedent.

    What did not change: kit/, tools/guest/, relay/, page/index.html, page/_headers, package-lock.json and tools/page-run.sh have no diff. A cached git grep for 0.37.0, dbd38057, state-p9 and p9- outside reports/, build/ and page/assets/ leaves only intended historical mentions (PROVENANCE.md:12-16, app.js:72, 872, 874, stage-page.sh:68) plus binary matches in kit/bzImage*.

    Changed without being asked for: nothing beyond the items above.
    Asked for but missing: nothing.

    Q2. Do the logs contain every line the kickoff requires?

    - Step 1: preconditions.log.
      - env 0; anchor shas; porcelain 0; relay 9c9eb67; node v24.20.0; node_modules present; no sample.* files; package-lock sha recorded; package-lock not in the diff.
      - PRESENT.
    - Step 2: binary-verify.log carries all five checks: computed, SHA256SUMS line, kickoff value ("computed == kickoff: YES"), "temur-v0.38.0-i686-unknown-linux-musl: OK" with exit=0, and "cmp: IDENTICAL (exit 0)". It also has the SHA256SUMS cmp, 4 lines / 428 bytes / f05b0b17..., and mode 644. PRESENT. One caveat: the cmp lines are the script's own summaries, not raw cmp output.
    - Unchanged inputs (G1): g1.log has the five hashes. I compared them to reports/v037-refresh.md:58-62 at 3678135 and to the index: all five match. PRESENT.
    - Step 4:
      - Red on both tiers: offline-red.log and net-red.log both show EXIT=3 and "No state file was written", plus "no state file written (correct)".
      - Green on both tiers: offline-green.log and net-green.log, "assert PASSED: entries=0 used_size=0 inodes=1", EXIT=0.
      - Landing text verbatim: landing-offline.txt and landing-net.txt.
      - Byte check against motd: landing-bytes.log (486 bytes, equal, and the two tiers equal). I re-ran the compare against the index motd: identical.
      - (a) and (b): session-state.log and session-state-net.log. (c): the office "turn" strings in the diff.
      - PRESENT, with two weak spots:
        - (a) "archive notice printed: NO" has no positive control, so that zero is vacuous on its own. The load-bearing evidence is the directory listing: /root/.local is absent, and the find output lists /usr/bin/temur, which serves as its control. The session path the report cites (~/.local/state/temur/sessions) is not in the bundle, but it is confirmed by temur's own source (session_store.rs:24-25, config.rs:327-328).
        - (b) cannot be exercised here, and the report says so. It is a statement, not a measurement.
    - Step 5:
      - proof-9p.log: 8 PASS per tier, ALL PASS, EXIT=0.
      - office-offline.log and office-net.log: ALL PASS, with both controls refused with the exact sentences. office-preswap.log carries the pre-swap FAIL "FAIL  the snapshot's temur is v0.37.0  temur 0.38.0" (offline tier only).
      - bigfile-offline.log and bigfile-net.log: GATE PASS.
      - relay-probes.log: 6/6, 9/9, 16/16, each EXIT=0.
      - PRESENT.
    - Step 6: stage.log has both byte counts, both sha256s, both "under 25 MiB: True", and ls -l of state-p10-*. PRESENT.
    - Step 7:
      - page-landingcheck.log carries the exact stamp text. dom-readings.log carries the release URL resolving to .../releases/tag/v0.38.0 with HEAD 200, the sha count (tree new=1/old=0; control at 3678135 new=0/old=1; stampText new 1 old 0), trust <p> count 5 (also in item11.log), and the wrap rule.
      - page-netcheck.log and page-selftest.log read back 16108107/38011612 and 17338758/38974172. relay-stopped.note shows 0 listeners before selftest.
      - PRESENT. Two readings are taken from source rather than the rendered DOM, which is the same method as P9:
        - "exactly once in the DOM" is inferred from the source count plus the single textContent write plus the stampText count. No whole-DOM count was taken.
        - "wrap rule served" is read from page/index.html:79, not from an HTTP fetch.
      - Trap 6 (latency in front of the relay) was not exercised. This is disclosed as deviation 5, and no banner-flash claim is made.
    - Step 8: item9.log, item10.log, item11.log. Every key-scan zero has a per-surface planted control that fired. The in-guest markers have no control, and the report says so. The WebGPU zeros have one control token in one file (getContext in libv86.js), not one per file, as in P9. The apex is 302/302/301/200 and is not reported red. PRESENT.
    - Step 9: sweep.log (case-sensitive) and sweep-nocase.log.
      - 12 patterns loaded by path. Generated controls fire 7/7 and 5/5. The live control over surface 1 rose for every pattern.
      - All five surfaces are covered. The added lines were extracted with `startswith("+") and not startswith("+++ ")` on `git diff --cached -M`.
      - R4 is listed per blob. r4-blob-paths.log maps the blobs to kit/bzImage*, kit/kernel*.config and state-p8/p9/p10-offline.bin.gz.
      - register.log covers the four surfaces with a control.
      - PRESENT. The register control is a standalone planted string scored by the same counter, not a string appended to each surface. That proves the counter can fire, not that every surface read path works. It is weaker than the sweep's control, but not vacuous.
    - "Report to planning" list: that file is not in the bundle and cannot exist yet (no commit sha). Every reading on the list has a primary in the bundle, except the commit sha and the post-commit `git diff --stat -M 3678135..HEAD`, which only exist after the commit.

    No required reading is contradicted by a log.

    Q3. Does every number and quoted string appear in a primary?

    I checked all the numbers in draft-report.md and draft-commit-msg.txt against the logs, the index and reports/v037-refresh.md at 3678135. The arithmetic I re-did:
    - 8,338,132 - 8,323,828 = 14,304.
    - Offline asset: raw +20,480, gzip +13,854.
    - Networked asset: raw -1,306,624, gzip -1,510,134 = 1.44 MiB.
    - 15.36 and 16.54 MiB; more than 8 MiB spare holds (25 - 16.54 = 8.46).
    - Zero-page percentages: 8.58 / 8.25 / 8.53 / 8.42.
    - R4 totals: 15 = 2+2+3+2+5+1; 28 = 14+14; 19 = 18 (P9, v037-refresh.md:404) + 1 (blob 45b5e53 = state-p10-offline).
    - Case-insensitive R4: 33 / 41 / 104.
    - File-cap: 51176 KB = 50.0 MB (networked is the worse tier); 78008 KB = 76.2 MB. The P9 column matches v037-refresh.md:312-318.
    - Harness readyMs 2015, 1966 and 962; echo 2 ms; 17 terms.
    - .ash_history 556 / 1569 bytes; "173 ip fields, all hashed"; 32 HASHED8.
    - Concurrency cap 24 / 4001; rate limit 60 / 4002.
    - Register lines 0/0/0, 2, 3, with 1/1/0 and 1/1/1 at 3678135.
    - Case-sensitive U+2014 counts at 3678135 match register.log:10-12.

    Wrong against a primary:
    1. draft-report.md:36-38 abbreviate the binary sha as "542e56ab...9922". The sha ends "...a9c922", so the last four characters are "c922", not "9922". The typo comes from kickoff.md:125 and was copied into all three lines, including the ones labeled "computed" and "published SHA256SUMS line". binary-verify.log:4,7,11 carry the full value.
    2. draft-report.md:247 says "16 PASS lines each". office-offline.log and office-net.log each carry 15 PASS lines. The committed build/proof-office-read-*.json each have 15 results, all ok, failed 0. The P9 check also recorded 15.

    Framing slightly beyond its primary:
    3. draft-report.md:6-7 and draft-commit-msg.txt:5-7 say the relay is "hash-identical to the P9 record". The P9 record hashes five files, and the relay is not one of them. The relay's evidence is its git tip, 9c9eb67 (preconditions.log:7), plus an empty diff under relay/. It is unchanged, but not by a recorded hash.
    4. draft-commit-msg.txt:24 and draft-report.md:20, 140 say the networked build varies by "about 1.3 MB". That is the raw state (39,351,004 - 38,011,612 = 1,339,392 B). The served .gz varies by 1,521,084 B (about 1.5 MB, 1.45 MiB). The report's table makes this clear; the commit message does not say which one it means.
    5. draft-report.md:21 says the file-cap comment "moved by one number". One measured number moved, but the comment text itself was restructured (see Q1).

    Quoted strings I matched verbatim: the stamp text, the red-assert paragraph (offline-red.log), the in-guest markers, the office PASS lines, "3 succeeded, 2 refused, of 5", the relay probe lines, the WebGPU readings, the apex lines and the netcheck "PASS: reachable" line.

    Disagreements with the report's framing
    - "Two sections are placeholders" (the brief for this check): the draft has one, INDEPENDENT_CHECK_PENDING at line 498.
    - The report and PROVENANCE.md contain dotted-quad addresses: 192.0.2.x, 1.1.1.1 and 127.0.0.1 in the relay section and in Reproduce. build/steps-p10-net-snap.json adds a 192.168.86.x guest address. These are documentation-range, public-resolver, loopback and guest-internal addresses, carried exactly as in P9, and the steps file is byte-identical to the already-public steps-p9 file. The kickoff's "no IP" rule is literal, so I am noting it rather than ruling on it.
    - The page-*.log headers and preconditions.log carry real local user paths (a Windows user profile directory and a home directory). They are not in the diff or the draft. They must not be carried into the planning report.

    VERDICT: FAIL as drafted. The problems are small, all three are cheap to fix, and nothing in the build, the proofs or the sweep is in doubt.

    Blocking (fix before the commit):
    - B1. draft-report.md:36-38: change "542e56ab...9922" to "542e56ab...c922" (or print the full hash).
    - B2. draft-report.md:247: change "16 PASS lines each" to 15.
    - B3. Re-run the sweep and the register check after this text is pasted in. It changes reports/v038-refresh.md, and so surfaces 1, 3 and 5 and the register's report and added-lines surfaces. It also needs a re-run if the commit message changes. The current zeros were measured on the draft with the placeholder.

    Non-blocking:
    - N1. The relay is "hash-identical" to the P9 record (report:6-7, commit message:5-7); its evidence is the git tip and an empty diff, not a recorded hash.
    - N2. "about 1.3 MB" (commit message:24) should say raw; the served .gz varies by about 1.5 MB.
    - N3. "moved by one number" (report:21) understates how much of the comment was rewritten.
    - N4. (a)'s "archive notice printed: NO" has no positive control; (b) cannot be exercised.
    - N5. The DOM-once and wrap-rule readings come from source, as in P9.
    - N6. The register control is a standalone string, not appended to each surface.
    - N7. Dotted-quad addresses are carried from P9 (see above).
    - N8. The PROVENANCE.md type line is shorter than file(1)'s output (pre-existing).
    - N9. Local user paths in the harness logs must stay out of the planning report.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
