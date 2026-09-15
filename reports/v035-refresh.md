# P8: the snapshots move to temur v0.35.0 for the launch

Built on the laptop from /home/dev/relay-2026-09-15-sandbox-v0.35.0-
snapshot-refresh-kickoff.md, verified by sha256
(7d96cc3b3a48b9a61653c5ea7ff4a31096f9b7538eb829d565b6c699e7d55f9a)
before any work started. Where this report differs from the kickoff it
is a disclosed deviation in the numbered list at the end.

Keyless throughout. No session saw, typed, stored or read a key. The
temur product tree was not touched. Nothing is pushed: the commit is
local and held for planning's verification.

## Verdict

Both served snapshots are rebuilt on the released temur v0.35.0, both
are well under the 25 MiB per-file limit, and the page now NAMES the
version and sha it runs instead of implying "latest".

The refresh is a binary swap plus that page copy. The kernel, the three
guest overlay files and the relay are all untouched; the only thing that
moved inside the machine is /usr/bin/temur.

One item of the 9-11 checklist is NOT green and is not mine to fix: the
apex domain redirects 302, not 301. See "The apex redirect" below.

## The build input

    file    temur-v0.35.0-i686-unknown-linux-musl
    sha256  7282830a760cd0ee40ed13f577762969b54c27a15e4887f703e2050d1ba690a0
    size    9,869,908 bytes
    type    ELF 32-bit LSB executable, Intel i386, statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL. The hash is checked FOUR ways:

    computed from the downloaded file   7282830a...90a0
    the published SHA256SUMS line       7282830a...90a0
    the value planning supplied         7282830a...90a0
    sha256sum -c in artifacts/          temur-v0.35.0-i686-unknown-linux-musl: OK

and a fifth time from inside the machine: the office-read proof asks the
restored snapshot's own temur for its version, on both tiers, and got
`temur 0.35.0`. That check is what caught the swap having happened at
all, because it was still pinned to 0.34.0 and FAILED until it was moved.

v0.34.0 was 9,512,532 bytes, so the binary grew by 357,376 bytes.

## What did NOT change

    kit/bzImage-p6        680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz    4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd      d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files  1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

All five hash identically to the values recorded in reports/v034-refresh.md,
so G1 holds by measurement rather than by assertion.

THE MOTD IS STILL LEFT AS IT WAS. The banked reword has no target text,
and the kickoff supplied none while ruling that only the binary and the
two snapshots change. It is overlay-internal, so it still costs a full
rebuild of both snapshots whenever it is done; this refresh was the
cheap opportunity and it passed unused for want of copy. It is flagged
here rather than guessed at, again.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the page checks and three probes, which
exercises its code without changing it.

## Why the filenames had to change

Snapshots version by FILENAME and never by `?v=`: tools/asset-stamp.mjs
excludes them from stamping by design, because a 16 MB asset should not
be re-fetched for a one-line page edit. Changed content MUST therefore
arrive under a changed name, or a returning visitor's cache serves them
the old machine behind a page that describes the new one.

So state-p7-* becomes state-p8-*, and every live reference moves in the
same commit: page/app.js, the .gitignore un-ignore lines (without which
the new files are not committable at all), tools/stage-page.sh, both
gen-steps scripts, and THIRD_PARTY.md, where the two served snapshots
are named as the reason its GPL-2.0 section exists.

The reports under reports/ keep their p7 text. They are the record of
what P7 did and rewriting them would falsify it.

## Sizes, against the 25 MiB Cloudflare Pages limit

                             raw            gzip -9        gzipped
    state-p8-net.bin      40,067,804 B   16,650,109 B   15.88 MiB
    state-p8-offline.bin  39,748,312 B   16,346,930 B   15.59 MiB

    (p7, for comparison:  16.16 MiB net, 15.30 MiB offline)

    sha256  state-p8-net.bin.gz      385debe034ae2db7fe84627dcda0ab054c2e38c86b1986ec480959e773322a34
    sha256  state-p8-offline.bin.gz  f3bb31ebeaa47aeb4517a02def0d5a292305963696c798e88b6aa445ecf65e83

Both are comfortably inside the limit. The networked tier's gzip got
SMALLER while its raw image grew, which is gzip finding more to do with
the new binary's contents, not a sign the wrong file was staged: the
page harness reads back exactly these byte counts (below).

## The pristine assert, red and green, on BOTH tiers

The rule this repository learned in P6 is that a share which was written
to and tidied up is NOT clean: v86 serialises the 9p filesystem into the
saved state, so deleted bytes still ship to every visitor. The assert
therefore demands exactly ONE inode, the root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p8-offline.bin   -> exit 3
    PLANT_9P=leaked-note.txt   ... state-p8-net.bin       -> exit 3

    "9p ASSERT FAILED at the snapshot point: the share is NOT empty
     ... entries=1 inodes=2 ... No state file was written."

    neither state file existed afterwards

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p8-offline.bin (39748312 bytes)
    state saved: build/state-p8-net.bin     (40067804 bytes)

P7 proved this red on the offline tier only. Both are proved here, and
the green networked state was hashed before and after the red run to
show the red did not disturb it.

## Item 9: no key in any guest

Three independent checks, each with a control.

1. FROM INSIDE THE GUEST, at the snapshot point: `KEYLESS-SNAPSHOT-OK`
   on both tiers (no /root/.secrets, no config on the networked tier,
   the throwaway doctor probe removed, `PROBE-REMOVED`), and
   `NO-SECRET-ENV-OK` for APP_SECRET_FILE.

2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. That is the deleted-bytes trap closed by measurement,
   not by tidying up. Its red half proves it can fail.

3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material:

       state-p8-net.bin.gz       0 hits
       state-p8-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED, without which the five refusals prove only that everything is
refused:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com)  got=open
    PASS  blocked: 192.0.2.9:443 (unmapped)                   got=closed:HostBlocked
    PASS  blocked: 1.1.1.1:443 (bare public IP)               got=closed:HostBlocked
    PASS  blocked: api.anthropic.com:443 (by name)            got=closed:HostBlocked
    PASS  blocked: 192.0.2.1:80 (port not 443)                got=closed:HostBlocked
    PASS  blocked: 127.0.0.1:443 (loopback)                   got=closed:HostBlocked

RATE AND CONCURRENCY LIMITS FIRE, 9/9: the per-address concurrency cap
trips at 24 with close code 4001, a DIFFERENT address is unaffected
(the control that proves it is per-address and not global), the
per-minute rate trips at 60 with code 4002.

NO KEY MATERIAL AND NO ADDRESSES IN THE LOGS: "173 ip fields, all
hashed". The refusal probe adds 16/16, including that a refusal is
distinguishable from a dead relay and that the refusal log keeps why.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block was dumped from the DOM
of the actually-served page and reads whole: the key is typed at temur's
own hidden prompt inside the machine, this page passes keystrokes there
and nowhere else, files reach the provider on the networked tier, the
relay holds ciphertext and that does not depend on trusting it.

THE PAGE DOES NOT BREAK WITH WebGPU ABSENT, and the first way I tried to
show this was wrong, so it is worth recording. Running the checks in
headless Edge proves nothing by itself: `navigator.gpu` is PRESENT in
that browser (`GPU-IN-NAVIGATOR=true`), and `--disable-features=WebGPU`
does not remove the binding either. The real proof is structural. No
shipped file references WebGPU at all:

    app.js 0   index.html 0   libv86.js 0   xterm.js 0   v86.wasm 0
      (navigator.gpu | webgpu | requestAdapter | GPUDevice)

    LIVE CONTROL, same grep shape for a token that IS there:
      libv86.js getContext  5 hits
    and what the renderer actually asks for: getContext("2d") x3

There is no code path to break.

EXCEL RENDER WORKS: sample.xlsx is read out of the share as text on both
tiers, `== Sheet: sales ==` and its rows, in the office proof below.

## The apex redirect: NOT green, and not changed by this pass

The checklist says the apex domain 301-redirects. Measured against the
live site today:

    http://temur.live       302 -> https://play.temur.live/
    https://temur.live      302 -> https://play.temur.live/
    http://play.temur.live  301 -> https://play.temur.live/
    following through:      https://play.temur.live/  200

The redirect WORKS and lands a visitor in the right place. It is a 302
(temporary), not the 301 the checklist names. That is hosting and DNS
configuration, it is untouched by this refresh, and changing it is not
something this pass should do on its own. Recorded for the operator.

## Office read, re-proved on the new binary

Both tiers, 15/15 PASS. Three documents read, two controls refused:

    /files/sample.pdf   /files/sample.docx   /files/sample.xlsx   -> 3 succeeded
    /files/not-really.pdf   /files/blob.bin                       -> 2 refused

A read tool that had merely become permissive would pass three of three,
which is why two must fail.

## The file-cap gate, re-measured, and a behaviour change

THE SPREADSHEET NUMBER CHANGED UNDER US. The 16 MiB per-file cap was
measured on v0.34.0 and page/app.js carried those numbers in a comment.
On v0.35.0 the near-cap workbook is no longer unpacked at all:

                     v0.34.0                      v0.35.0
    big.pdf    read 6 s,  low 49.0 MB       read 4.5 s, low 48.6 MB
    big.xlsx   read 29 s, low 22.8 MB       REFUSED in 0.5 s, low 74.8 MB

    "This workbook expands to more than 64 MiB; temur will not unpack it."

The gate PASSES on both tiers (it accepts a clean read OR temur's own
size refusal), and the guest is now much further from the edge: the
tightest margin the gate ever saw, 22.8 MB, is gone because the read
that produced it no longer happens. The PDF is now the expensive case.

The comment in page/app.js has been corrected to the measured v0.35.0
numbers, including the explicit warning that the new headroom belongs to
temur's own expansion guard and is NOT licence to raise 16 MiB: a
document that expands to just under 64 MiB would still be unpacked.

Leaving that comment at the v0.34.0 numbers would have left the page
describing a machine it no longer ships.

## 9p restore, both tiers

    proof-9p-restore.mjs ... state-p8-offline.bin offline     ALL PASS (8/8)
    proof-9p-restore.mjs ... state-p8-net.bin networked       ALL PASS (8/8)

ICRNL on with no page nudge, the mount survives restore, the share ships
empty, an uploaded file's host and guest sha256 agree, the hash survives
drop_caches, the file survives umount/remount, a file written in the
guest reads back byte for byte, and temur is present with the share as
its working directory.

## Both tiers in a real browser

Headless Edge, real time, local relay supplied by PAGE_DEV_RELAY at
serve time. The shipped CSP in page/_headers is unedited and 0-diff.
Each report was deleted before its run.

    landingcheck  cleanLanding true, wizardAtFirstQuestion true,
                  readyMs 1992, stamp reads build b4affeb
    netcheck      networked, wireBytes 16,650,109, stateBytes 40,067,804,
                  readyMs 1896, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true; 17 diagnostic terms, 0 hits in markup and 0 in
                  rendered text; file panel and /files path both present
    selftest      ok true, NO PROVIDER tier, wireBytes 16,346,930,
                  stateBytes 39,748,312, readyMs 1002, offline greeting
                  intact, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p8 pair and not
a cached p7 one.

## The page copy: naming the version

Operator decision (2), applied to the playground page only. A new
paragraph in the trust block:

    The machine in this tab runs temur v0.35.0, the released 32-bit
    binary, put into the image unchanged. Its sha256 is
    7282830a...90a0, and the release it came from publishes the same
    checksum, so you can check one against the other. When a newer temur
    ships, this page goes on naming the version it actually runs.

The sha is the full 64 characters on the page. It was checked
mechanically against the binary in artifacts/ and against the published
SHA256SUMS line: all three are the same string. The release link returns
200. Nothing on the page promised "latest" before, so decision (2) is an
addition here and not a removal.

One CSS rule goes with it: a 64-character sha is a single token, and
#trust had no code styling, so it needed the same `overflow-wrap:
anywhere` the faq spans use or it would set a min-content floor under
the page on a narrow phone.

This does NOT touch temur's own README:20, which is a v0.36.0-cut item.

## The pre-publish sweep

Ran LAST, against the held-out pattern list at
/home/dev/sandbox-sweep-patterns.txt, which stays outside every clone.
Counts are reported against positional placeholders; the patterns are
not quoted here, because this report ships inside the repository being
swept.

    staged diff vs b4affeb            P1..P7 all 0
    every tracked file's contents     P1..P7 all 0
    state-p8-net.bin decompressed     P1..P7 all 0
    state-p8-offline.bin decompressed P1..P7 all 0
    every blob in ALL history (589 objects, 83 commits)  P1..P7 all 0
    the two dangling commits' trees   P1..P7 all 0
    all commit messages and identities P1..P7 all 0

THE CONTROL NEEDED FIXING, AND THAT MATTERS. Feeding the pattern file
itself to the scanner lit only P1, P2, P3 and P7: the other three are
regexes that do not match their own source text, so their zeros were
still vacuous. A generated string matching each pattern was produced
instead, and through the same scanner and the same code paths:

    generated samples alone                     P1..P7 all 1
    tracked files WITH the samples appended     P1..P7 all 1
    the snapshot gzip stream WITH them appended P1..P7 all 1

So every one of the zeros above is a zero the scanner could have broken.

KEY MATERIAL, separately: 14 hits in the tracked tree, all pre-existing
and all benign, individually classified: the deliberate fake
`sk-ant-invalid-not-a-real-key` in docs/P3A-OPERATOR.md's failure path,
the instruction to grep for it, and twelve prior sweep count lines in
reports/. THIS CHANGE ADDS NONE: the added lines of this diff score 0,
and 1 with a planted control. Operator paths (/home/dev, /mnt/c,
C:\Users) in the added lines: 0, control 1.

CLONE COMPLETENESS, which the sweep depends on: not shallow, 83 commits
on all refs, exactly one root commit (101f1245), main and origin/main
both at b4affeb, 589 objects, fsck clean apart from two dangling commits
left by the P3b history rewrite, which were swept anyway and which a
push does not send.

Author and committer across all 83 commits is one identity, the GitHub
noreply address, as P3b decision B requires.

## Reproduce

    cd /home/dev/temur-playground
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.35.0-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.35.0/temur-v0.35.0-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.35.0/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.35.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p8-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p8-offline-snap.json 128 \
        build/state-p8-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p8-offline-snap.json 128 build/state-p8-offline.bin

    # networked, relay up
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p8-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p8-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p8-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p8-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p8-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p8-offline.bin offline
    # ... and the same three with state-p8-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p8-*.bin.gz

    # both tiers in a real browser, relay up for netcheck, down for selftest
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    sh tools/page-run.sh landingcheck 'landingcheck=1'
    sh tools/page-run.sh netcheck     'netcheck=1'
    sh tools/page-run.sh filecheck    'filecheck=1'
    sh tools/page-run.sh textcheck    'textcheck=1'
    sh tools/page-run.sh selftest     'selftest=1'     # relay stopped first

`tools/stamp.mjs` rewrites page/index.html's asset refs in place as a
build transform. The committed form keeps them BARE, so the file is
restored with stripAssetStamps() after stamping and before committing;
tools/serve-page.mjs does the same rewrite in memory for the local loop.

## Deviations from the kickoff

1. TWO PROOF FILES HAD THEIR VERSION PIN MOVED, which the kickoff did not
   mention. tools/proof-office-read.mjs and tools/proof-bigfile-read.mjs
   each assert the snapshot's temur version, and both were pinned to
   0.34.0, so both FAILED against the new snapshot. That failure is the
   most direct evidence the swap worked, and it is recorded above rather
   than quietly edited away.

2. THE FILE-CAP GATE WAS RE-RUN AND page/app.js's MEASUREMENT COMMENT
   REWRITTEN. The kickoff scoped the pass to the binary and the two
   snapshots. But the cap comment states measured behaviour of the
   shipped machine, the machine changed, and v0.35.0 turned out to
   REFUSE the near-cap workbook the old numbers were taken from. Leaving
   it would have shipped a false description. Measured, not assumed.

3. THE RED PRISTINE ASSERT WAS RUN ON BOTH TIERS, where P7 ran it on the
   offline tier only and the kickoff asked for a control per check.

4. THE SWEEP CONTROL IS GENERATED, not the pattern file fed back to
   itself. The simpler control silently failed to exercise three of the
   seven patterns; see the sweep section.

5. THE APEX REDIRECT IS 302, NOT 301, so checklist item 11 is not fully
   green. It is live hosting configuration, untouched here, and not
   something this pass should change unilaterally.

6. tools/mkdocs-sample.py DEFAULTS ITS OUTPUT DIRECTORY TO `.`, so
   running it with no argument wrote sample.pdf/.docx/.xlsx into the
   repository root. They were never committed (removed before the
   commit, and build/office/ is the gitignored home for them), but the
   Reproduce section above passes the directory explicitly. A generator
   that litters the repo root when called the obvious way is worth
   fixing separately.

7. THE MOTD REWORD IS STILL NOT DONE, for want of target text. See
   "What did NOT change".

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries and
name the sha.
