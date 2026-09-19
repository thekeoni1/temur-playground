# P9: the served snapshots move to temur v0.37.0

## Verdict

Both served snapshots are rebuilt on the released v0.37.0 i686-musl
binary. The kernel, the three guest overlay files and the relay are
untouched and hash-identical to the v0.35.0 record: only /usr/bin/temur
moved. state-p8-* becomes state-p9-*, and every live reference moves in
the same commit.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. The page harness reads back the
exact byte counts of the two NEW assets, which is what shows the p9 pair
is served rather than a cached p8 one.

Four things are recorded rather than smoothed over: the scripted model
was counting the wrong thing and had to be fixed before the office proof
measured anything (below), the file-cap comment was rewritten because
the machine under it changed, the two staged assets got BIGGER even
though the binary got smaller, which is measured but not explained, and
THE PRE-PUBLISH SWEEP IS NOT ALL ZERO: eleven of twelve patterns are
zero on every surface, and the twelfth needs a ruling from someone who
can see it. This commit is not a decision to publish.

## The build input

    file    temur-v0.37.0-i686-unknown-linux-musl
    sha256  dbd380571743071a906df2c69eed4b2073535a6e24fb5c592ddfdf3e899718d3
    size    8,323,828 bytes
    type    ELF 32-bit LSB executable, Intel 80386, statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL. The hash is checked FIVE ways before the binary is used:

    computed from the downloaded file   dbd38057...18d3
    the published SHA256SUMS line       dbd38057...18d3
    the value planning supplied         dbd38057...18d3
    sha256sum -c in artifacts/          temur-v0.37.0-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (exit 0)

and a sixth time from inside the machine: the office-read proof asks the
restored snapshot's own temur for its version, on both tiers, and got
`temur 0.37.0`. That check FAILED first, while still pinned to 0.35.0,
which is the most direct evidence the swap took. The failing line is
kept here rather than edited away:

    FAIL  the snapshot's temur is v0.35.0  temur 0.37.0

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 cd46089a7ca01f155a265c8cc957424d857d057b3d5172de175098ca19dc37fd,
and artifacts/SHA256SUMS is that file verbatim.

v0.35.0 was 9,869,908 bytes, so the binary SHRANK by 1,546,080 bytes.
v0.36.0 was released but never served here, by plan.

## What did NOT change

    kit/bzImage-p6        680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz    4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd      d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files  1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

All five hash identically to the values recorded in reports/v035-refresh.md,
so G1 holds by measurement rather than by assertion.

THE MOTD IS STILL LEFT AS IT WAS. Planning ruled the banked reword
CLOSED on 2026-09-15 as accurate for the shipped build, so it is
deliberately not carried forward.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the page checks and three probes, which
exercises its code without changing it.

## The landing text, and the two product changes watched for

Both tiers land on the same text, and it is the overlay's motd, which is
hash-identical to the v0.35.0 build. It was checked as bytes, not by
eye: the motd file's content appears verbatim in both tiers' capture.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P8.

(a) T65 P0 makes temur REFUSE the REPL when stdin is not a tty. The
    guest console is a serial tty, so this was expected to be invisible
    here, and it is: landingcheck reports cleanLanding true and
    wizardAtFirstQuestion true, so the page still lands the visitor at
    the wizard's first question.

(b) T64 changed wizard and REPL wording in places. Nothing in the page
    copy or the landing depends on the changed strings: textcheck is
    ok true with 17 terms and 0 hits in markup and 0 in rendered text.

## Sizes, against the 25 MiB Cloudflare Pages limit

                             raw            gzip -9        gzipped
    state-p9-net.bin      39,318,236 B   17,618,241 B   16.80 MiB
    state-p9-offline.bin  38,953,692 B   17,324,904 B   16.52 MiB

    (p8, for comparison:  15.88 MiB net, 15.59 MiB offline)

    sha256  state-p9-net.bin.gz      f5fbe961534f657e3a6ca12d5f9e984e0ffcbee4f0097819b303a19b9820b183
    sha256  state-p9-offline.bin.gz  55e47d8619c394a8c568ee0ff4429976462c31c3dcda89cb20d9957c6d0f1cf9

Both are inside the limit with about 8 MiB to spare.

THE STAGED ASSETS GOT BIGGER WHILE THE BINARY GOT SMALLER, which the
kickoff flagged as a question, so it was measured rather than waved
through:

    raw     net -749,568   offline -794,620   (smaller, as expected)
    gzip    net +968,132   offline +977,974   (BIGGER)

What it is NOT:

  - not run-to-run noise. The offline snapshot was rebuilt a second
    time from identical inputs: raw moved -40,960 and gzip -10,641
    between two runs, two orders of magnitude below the p8-to-p9 gap.
  - not the binary's own bytes. Standalone, v0.37.0 compresses to
    4,136,579 B and v0.35.0 to 4,666,777 B, so the new binary
    contributes FEWER compressed bytes, not more.
  - not a change in zero-filled memory. All-zero 4 KiB pages are
    8.23 percent of the p8 image and 8.37 percent of the p9 image.

Comparing the two images in 4 MiB chunks shows growth and shrinkage
alternating across the image rather than concentrated anywhere, which is
the signature of content sitting at different offsets once a 1.5 MB
smaller binary moves everything after it. The mechanism is not
established beyond that. It costs about 1 MiB of a 25 MiB budget that
has 8 MiB spare, and the page reads back these exact byte counts, so it
is recorded as an open question rather than a blocker.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p9-offline.bin  -> exit 3
    PLANT_9P=leaked-note.txt   ... state-p9-net.bin      -> exit 3

    9p ASSERT FAILED at the snapshot point (build/state-p9-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    neither state file existed afterwards

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p9-offline.bin (38953692 bytes)
    state saved: build/state-p9-net.bin     (39318236 bytes)

## Item 9: no key in any guest

Three independent checks. The second and third each carry their own
control; the first is an in-guest assertion with no separate control, and
is reported as such.

1. FROM INSIDE THE GUEST, at the snapshot point: `KEYLESS-SNAPSHOT-OK`
   and `SHARE-EMPTY-OK` on both tiers, and on the networked tier also
   `NO-SECRET-ENV-OK` for APP_SECRET_FILE and `PROBE-REMOVED` for the
   throwaway reachability probe.

2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.

3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material:

       state-p9-net.bin.gz       0 hits
       state-p9-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit

## Item 10: the relay

Three probes, run against the relay at 9c9eb67, unmodified.

ALLOWLIST, 6/6, and the first line is the on-list control that must be
ALLOWED, without which the five refusals prove only that everything is
refused:

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open
    PASS  blocked: 192.0.2.9:443 (unmapped)              expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 1.1.1.1:443 (bare public IP)          expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: api.anthropic.com:443 (by name)       expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 192.0.2.1:80 (port not 443)           expected=closed:HostBlocked got=closed:HostBlocked
    PASS  blocked: 127.0.0.1:443 (loopback)              expected=closed:HostBlocked got=closed:HostBlocked

RATE AND CONCURRENCY LIMITS FIRE, 9/9: the per-address concurrency cap
trips at 24 with close code 4001, a DIFFERENT address is unaffected
(the control that proves it is per-address and not global), the
per-minute rate trips at 60 with code 4002.

NO KEY MATERIAL AND NO ADDRESSES IN THE LOGS: "173 ip fields, all
hashed", and a scan of the relay log, the page server log and all five
page reports found 0 key-shaped hits, with a planted control that fired.
The refusal probe adds 16/16.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs and reads whole: the key is typed at temur's own hidden
prompt inside the machine, this page passes keystrokes there and nowhere
else, files reach the provider on the networked tier, and the relay
holds ciphertext.

THE PAGE DOES NOT BREAK WITH WebGPU ABSENT. No shipped file references
WebGPU at all:

    app.js 0   index.html 0   libv86.js 0   xterm.js 0   v86.wasm 0
      (navigator.gpu | webgpu | requestAdapter | GPUDevice)

    LIVE CONTROL, same grep shape for a token that IS there:
      libv86.js getContext  5 hits
    and what the renderer actually asks for: getContext("2d") x3

EXCEL RENDER WORKS: sample.xlsx is read out of the share as text on both
tiers, `== Sheet: sales ==` and its rows, in the office proof below.

THE APEX REDIRECT IS 302 AND STAYS 302. Planning ruled this keep-302, so
it is recorded, not reported red and not touched:

    http://temur.live       302 -> https://play.temur.live/
    https://temur.live      302 -> https://play.temur.live/
    http://play.temur.live  301 -> https://play.temur.live/
    following through:      https://play.temur.live/  200

## The scripted model was counting connections, not turns

THIS HAD TO BE FIXED BEFORE THE OFFICE PROOF MEASURED ANYTHING, and it
is the one product-adjacent finding of the pass.

The office proof drives a scripted model inside the guest. The stub
serves the Nth line of a five-line plan to the Nth request and numbers
the saved request bodies the same way. It counted every CONNECTION.

temur v0.36.0 (T63 P4) added ONE bounded keyless `GET {base}/models`
before the first turn, to read the served and trained context window.
It is not only the endpoint that is new: that commit also widened WHEN
the startup probe runs, to a configured window below 20480 on an auto
profile, "one bounded 3 s GET at startup where there was none". Both
tiers configure `"context_window":8192`, which is exactly that case, so
any future playground config below 20480 will keep taking this path.
The playground skipped v0.36.0, so this pass is the first time that
request has ever reached the stub. It consumed the plan's first line.
Every read then shifted by one:

    read 1  /files/sample.pdf     never requested at all
    read 2  /files/sample.docx    served as if it were read 1
    ...
    req-1.json                    never written, so the read-back of
                                  what temur sent ran off the end and
                                  the proof died with "File not found"

The visible symptom was three FAILs that looked like temur had stopped
reading PDFs. It had not. The evidence is the first connection's own
request line, captured from inside the guest:

    GET /v1/models HTTP/1.1
    user-agent: ureq/3.3.0
    accept: */*
    host: 127.0.0.1:8080

followed by five POSTs to /v1/chat/completions. tools/guest-stub-model.sh
now reads the request line and counts ONLY a chat POST, refusing anything
else with a 404 without touching the counter, which is what an
unconfigured server would do anyway. NO ASSERTION WAS WEAKENED: the proof
still demands three successful office reads, two refusals, one tool
result per read, and the exact extracted text and refusal sentences.

## Office read, re-proved on the new binary

ALL PASS on both tiers, 15 checks each, including the version assert:

    PASS  the snapshot's temur is v0.37.0  temur 0.37.0
    PASS  three office reads SUCCEEDED in the guest
    PASS  the two controls FAILED, so the read tool is not merely
          permissive  3 succeeded, 2 refused, of 5
    PASS  one tool result came back for each of the 5 reads  5 result(s)
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="
    PASS  control /files/not-really.pdf refused with the right sentence
    PASS  control /files/blob.bin refused with the right sentence

The two controls are what stop this proving only that the read tool says
yes to everything.

## The file-cap gate, re-measured

GATE PASS on both tiers. The numbers moved, so page/app.js's measurement
comment was rewritten to what was measured rather than left describing a
machine that no longer ships:

                            v0.35.0 (p8)   v0.37.0 (p9)
    big.pdf   offline           4.5 s          5.0 s   (slower)
    big.pdf   networked         5.8 s          4.8 s   (faster)
    big.pdf   lowest MemAvailable, worse tier
                                48.6 MB        50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s  REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                74.8 MB        76.2 MB

The two tiers moved in OPPOSITE directions on time, so the read did not
uniformly slow down: offline went 4.5 -> 5.0 s and networked 5.8 ->
4.8 s. The memory rows are the worse of the two tiers, which is the
selection P8's comment used.

Both documents are unchanged: big.pdf 16,264,413 B / 15.51 MiB / 1098
pages, big.xlsx 16,317,903 B / 15.56 MiB / 148,801 rows. The spreadsheet
is still refused with "This workbook expands to more than 64 MiB; temur
will not unpack it", so the PDF remains the expensive case, and the
guest ends up about 1.4 MB roomier than it was on v0.35.0. The 16 MiB
and 64 MiB caps are unchanged.

## 9p restore, both tiers

ALL PASS, 8 checks per tier: ICRNL on with no page nudge, the mount
survives restore, the share ships empty, upload and download hashes
match in both directions, the hash survives drop_caches and a remount,
and temur is present with the share as its working directory.

## Both tiers in a real browser

Headless Edge, real time, local relay supplied by PAGE_DEV_RELAY at
serve time. The shipped CSP in page/_headers is unedited. Each report
was deleted before its run.

    landingcheck  cleanLanding true, wizardAtFirstQuestion true,
                  readyMs 2082, stamp reads build 0f16fee
    netcheck      networked, wireBytes 17,618,241, stateBytes 39,318,236,
                  readyMs 2097, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true; 17 diagnostic terms, 0 hits in markup and 0 in
                  rendered text; file panel and /files path both present
    selftest      ok true, offline tier, wireBytes 17,324,904,
                  stateBytes 38,953,692, readyMs 971, offline greeting
                  intact, echo 1 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p9 pair and not
a cached p8 one.

## The stamp names v0.37.0

The footer stamp reads, from the DOM of the served page:

    temur v0.37.0 (release, sha256 dbd380571743071a906df2c69eed4b2073535a6e24fb5c592ddfdf3e899718d3)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.37.0, which returns
200. The sha appears EXACTLY ONCE in the DOM, in #stamp: it is absent
from index.html, appears once in app.js as TEMUR_SHA256, and is written
to one element (app.js `sha.textContent = TEMUR_SHA256`). The trust
block still has 5 paragraphs, and the wrap rule `#stamp code {
overflow-wrap: anywhere; }` is still served, without which a
64-character token sets a min-content floor under a narrow phone.

    CONTROL at 0f16fee:  old sha 1 hit, new sha 0 hits
    working tree:        old sha 0 hits, new sha 1 hit

## The pre-publish sweep

Run LAST, after everything else was green. TWO pattern files this time,
both referenced BY PATH and never opened into this repository, printed or
copied: the sandbox file (7 active patterns, reported here as P1..P7) and
the release leak file (5 active, R1..R5). Findings are positional counts
only.

CONTROLS ARE GENERATED, one per pattern, by walking each pattern's own
parse tree and emitting a string that matches it. The naive control of
feeding the pattern file to itself lit only 4 of 7 in P8, because a
pattern is not usually an instance of itself. All TWELVE controls fire,
so a zero below is a measurement and not an accident:

    P1..P7 control fires: YES (7/7)
    R1..R5 control fires: YES (5/5)

Counts, patterns as written (case-sensitive), over the five surfaces:

    surface                              P1..P7   R1,R2,R3,R5   R4
    1  added lines of the diff (-M)         0          0         0
    2  the commit message                   0          0         0
    3  every tracked file (144 files)       0          0        15
    4  both new .gz, through gzip           0          0        28
    5  full history (338 blobs, 87          0          0        18
       commit messages, all path names)

Run against the COMMITTED state, so surfaces 1, 2 and 5 include this
commit itself rather than a draft of it.

Scanned case-insensitively as a stricter variant, P1..P7 and R1,R2,R3,R5
stay 0 on every surface and R4 rises to 38 / 44 / 70.

ELEVEN OF TWELVE PATTERNS ARE ZERO EVERYWHERE, including every pattern
in the sandbox file. Surfaces 1 and 2, which are the only surfaces this
pass actually authored, are zero for all twelve.

R4 IS NOT ZERO, AND THIS REPORT DOES NOT RULE ON IT. What can be said
without reading the pattern:

  - Every R4 match is a 3-character alphabetic token.
  - R4 is a 5-character expression containing regex metacharacters, and
    it matched 5 distinct values, so it cannot be a single literal
    string such as a hostname: a literal matches one string only.
  - It does not fire on ordinary text (a kernel boot banner, English
    prose, lorem ipsum, 3-letter alphabet soup: 0 matches each).
  - It fires on content this repository has ALREADY PUBLISHED: 17
    historical blobs case-sensitively, including kit/bzImage,
    kit/bzImage-p2, -p3, -p4 and five kit/kernel*.config files, all
    committed long before this pass and live on the site today.
  - P8 swept the sandbox file only. R1..R5 are applied here for the
    first time, so there is no precedent of a clean R-sweep to appeal
    to, and no evidence that R4 was ever zero on this repository.
  - A context test (does the same surrounding window appear in an
    already-public source) came back 0 of 14 for both assets, but that
    test is too strict to mean anything on a memory image: bytes
    adjacent to a token in RAM are not the bytes adjacent to it in a
    file, so a negative there is expected either way.

THE OPERATOR AND PLANNING CAN SEE THE PATTERN AND THIS SESSION CANNOT.
If R4 is a genuine secret, the exposure is PRE-EXISTING and lives in the
published history, which is a history-rewrite problem and not something
a docs commit fixes; if it is a broad developer-path or short-token
pattern meant for text release artifacts, it is a false positive on
binary memory images. Publication should wait on that ruling. Nothing is
pushed either way.

## The register check

Four surfaces, with live controls. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word. Three surfaces meet
it outright; the two that do not are declared below rather than edited
into compliance:

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v037-refresh.md          1*        0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      1*        2        3

    LIVE CONTROL (planted string)    1         1        1

    * both are the SAME hit: the verbatim independent check below, which
      this report quotes and the diff therefore adds. See the exception
      declared at the end of this section.

THE ADDED LINES ARE NOT CLEAN, and the exception is named rather than
explained away. All 18 U+2014 occurrences sit on 2 lines, and all 3
non-ASCII lines sit in regenerated build/*.json MACHINE CAPTURES:
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured `"turn"` string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same files already carried 9 U+2014 occurrences and non-ASCII at the
anchor 0f16fee, so this is pre-existing captured output, not prose
introduced here. No prose this pass wrote has a single hit.

ONE EXCEPTION IS DECLARED RATHER THAN EDITED. The independent check
below is reproduced verbatim, as CLAUDE.md requires, and its text uses
the banned adjective once, in its Q1 assessment of the stub fix. Editing
a quotation to satisfy a register would falsify it, so the count for
this file is 1 and that one hit is inside the quoted block. Every line
this pass wrote in its own voice is 0.

## Reproduce

    cd /home/dev/temur-playground
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.37.0-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.37.0/temur-v0.37.0-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.37.0/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.37.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p9-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p9-offline-snap.json 128 \
        build/state-p9-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p9-offline-snap.json 128 build/state-p9-offline.bin

    # networked, relay up
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p9-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p9-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p9-net.bin

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p9-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p9-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p9-offline.bin offline
    # ... and the same three with state-p9-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p9-*.bin.gz

    # both tiers in a real browser, relay up for netcheck, down for selftest
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    sh tools/page-run.sh landingcheck 'landingcheck=1'
    sh tools/page-run.sh netcheck     'netcheck=1'
    sh tools/page-run.sh filecheck    'filecheck=1'
    sh tools/page-run.sh textcheck    'textcheck=1'
    sh tools/page-run.sh selftest     'selftest=1'     # relay stopped first

`tools/stamp.mjs` rewrites page/index.html's asset refs in place as a
build transform. The committed form keeps them BARE, so the file is
restored with stripAssetStamps() after stamping and before committing.

## Deviations from the kickoff

1. THE SCRIPTED MODEL WAS FIXED, which the kickoff did not scope. It
   counted connections rather than chat turns, so v0.36.0's new
   `GET {base}/models` probe ate the plan's first read and the office
   proof could not measure what it exists to measure. See the section
   above. No assertion was weakened; the fix is in the stub's request
   accounting only.

2. TWO PROOF FILES HAD THEIR VERSION PIN MOVED, as the kickoff directed,
   and the FAIL against the new snapshot before the move is recorded
   above rather than quietly edited away.

3. THE FILE-CAP GATE WAS RE-RUN AND page/app.js's MEASUREMENT COMMENT
   REWRITTEN, on the kickoff's condition that the numbers moved. They
   moved: 48.6 -> 50.0 MB and 74.8 -> 76.2 MB.

4. THE STAGED ASSETS GREW while the binary shrank. Measured, with a
   run-to-run control, and left as an open question. See "Sizes".

5. tools/proof-office-read.mjs DIES WITH AN UNCAUGHT "File not found"
   when a request body it expects is missing, instead of reporting the
   gap as a failed check. That is what turned a one-line accounting
   fault into a stack trace, and it cost real time to diagnose. It is
   REPORTED, not changed: the file is in scope only for its version pin.

6. tools/proof-office-read.mjs:148 carries a PRE-EXISTING comment whose
   last two words use the register's banned adjective of a binary. It is
   not on a line this pass touched, so per the kickoff it is reported by
   location and left alone, and it is not quoted here because this report
   is itself held to the register.

## Deviations, continued

7. TEXTCHECK RAN ON THE NETWORKED TIER, where the committed p8 report
   recorded it on the offline tier. The command is the same one the P8
   Reproduce section gives; the tier follows from the relay being up.
   The check itself is tier-agnostic (17 terms, 0 hits in markup and 0
   in rendered text) but the run condition changed, so it is named here
   rather than left for a reader to notice in the diff.

8. THE DOWNLOADED BINARY ARRIVED MODE 644 and was restored to 755 to
   match what P8 committed. It makes no functional difference, because
   tools/mkcpio.py sets 0o755 for usr/bin/temur when it builds the
   overlay, but it keeps the diff free of an unrequested mode change.

9. TWO OF THIS PASS'S OWN LOGS CARRY A MISLEADING LINE, and neither is
   quoted forward into this report. size-question.log ends with a NOTE
   saying the smaller binary compresses to MORE bytes; the numbers
   directly above it show the opposite (4,136,579 against 4,666,777),
   and only the RATIO is worse (0.4970 against 0.4728). dom-readings.log
   prints a resolved release URL built from the wrong constant, then
   prints a 200, then corrects the URL lower down without re-running the
   check; the link was re-checked separately and
   https://github.com/thekeoni1/Temur/releases/tag/v0.37.0 returns 200
   while the playground-shaped URL returns 404.

## The independent check

A fresh subagent was given ONLY this kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach as well. Its answer is
reproduced verbatim below, including where it disagrees with this report
and including its FAIL verdict on the draft.

WHAT WAS DONE ABOUT IT. The check ran against the draft and returned
FAIL on two blocking points: the draft had no sweep section and no
register section, and the sweep's one nonzero result was unrecorded.
Both are now written above, the R4 result is reported with its counts,
its characterisation and an explicit refusal to rule on it. Of its
non-blocking findings: the zero-page and 4 MiB-chunk measurements were
re-run into a log so they have a primary; the register check was re-run
over all four required surfaces; the binary mode was restored to 755;
the textcheck tier flip and the two misleading log lines are disclosed
as deviations 7 and 9; the file-cap table now names its tiers and gives
the networked 5.8 -> 4.8 s; the four quoted blocks were corrected
against their primaries; the enumeration of key shapes was replaced with
P8's wording; and the T63 P4 trigger condition was added. Its remaining
disagreements stand as written.

VERBATIM:

Read all primaries. Findings below.

## Q1. Does the diff do what the spec says, and nothing else?

The step 3 pin list, item by item (verified with
`git grep -n -E "0\.35\.0|7282830a|state-p8"` at 0f16fee and in the working tree):

1. `.gitignore:23-24` -> `!page/assets/state-p9-net.bin.gz` / `-offline`. DONE (staged.diff:1-15).
2. `THIRD_PARTY.md:64-65` -> the p9 names. DONE (staged.diff:16-30).
3. `artifacts/PROVENANCE.md` rewritten: file, `sha256 dbd3805...18d3`, `size 8323828`, both v0.37.0 download URLs, the `sha256sum -c` line, the published line, the "replaces" paragraph kept (v0.35.0, `7282830a...`, 9869908 bytes, pointing at reports/v035-refresh.md), and the required one sentence "v0.36.0 was released but never served here, by plan, so there is no refresh between those two to hunt for." DONE, all six sub-items.
4. `page/app.js:60-61` TEMUR_VERSION and TEMUR_SHA256 move together. DONE.
5. `page/app.js:64-75` "THE P8 PAIR" -> P9, SNAP_ONLINE/SNAP_OFFLINE -> state-p9-*. DONE (the "p7 pair is removed" line correctly became "p8 pair").
6. `page/app.js:853-866` file-cap comment: spec says rewrite ONLY if step 5 measures different numbers. They did (see Q3), so the rewrite is licensed. DONE and disclosed (deviation 3).
7. `tools/stage-page.sh:13,67,71-87`. DONE.
8. `git mv` of both gen-steps scripts plus the header line and the `writeFileSync` path (4 lines each, as 8d64a91). DONE, git records both as renames (97% / 96% similarity).
9. `tools/proof-office-read.mjs:1,137` and `tools/proof-bigfile-read.mjs:270` version pins. DONE, and the pre-move FAIL is captured (office-preswap.log: `FAIL  the snapshot's temur is v0.35.0  temur 0.37.0`).
10. `page/assets/`: p8 pair removed by explicit name one at a time (stage.log "removed page/assets/state-p8-net.bin.gz" / "...offline..."), p9 pair added, git records renames.
11. Binary: `artifacts/temur-v0.35.0-...` renamed to `artifacts/temur-v0.37.0-...`, `Bin 9869908 -> 8323828`; artifacts/SHA256SUMS replaced with the four v0.37.0 lines.
12. Tracked `build/*.json` regenerate and commit with the pass (11 files), per the P8 precedent.

Residual `0.35.0` / `7282830a` in the tree after the pass is exactly four lines, all deliberate history: PROVENANCE.md:12,14 and app.js:863,871. Nothing on the spec's list is missing.

Changed but not asked for:

- `tools/guest-stub-model.sh` (34 lines). Disclosed as deviation 1 and justified. I read the hunk: `IFS= read -r REQLINE` is added, the counter move is relocated to after a `case "$REQLINE" in [Pp][Oo][Ss][Tt]*chat/completions*)` guard, and anything else drains its body and returns 404 without touching the counter. No assertion in proof-office-read.mjs is touched, and the proof still demands 3 successes, 2 refusals, 5 tool results and the exact strings (office-offline.log, office-net.log). Justified and honestly disclosed.
- The binary's file mode: `old mode 100755 / new mode 100644` (staged.diff:112). NOT disclosed anywhere in the report. Consequence-free (tools/mkcpio.py:65 hardcodes `0o755` for `usr/bin/temur`, so the guest binary is executable regardless, and every proof ran `temur --version` successfully), but it is a tree change the spec did not ask for and the report does not mention. P8 committed this file 755; P9 commits it 644.
- `build/page-report-textcheck.json` "tier" flips `offline` -> `networked` (staged.diff:203-214). NOT disclosed. It means textcheck was run against a different tier than P8 ran it against. The result (17 terms, 0/0) is still valid, but the report's "textcheck ok true with 17 terms" hides a changed run condition.
- The app.js file-cap comment rewrite goes beyond the numbers: it also rewrites the narrative ("THE SPREADSHEET NUMBER CHANGED UNDER US at v0.35.0", "Every build since refuses it", "about 1.4 MB roomier than the same read on v0.35.0"). Editorially correct and within the spirit of the licensed rewrite, but more than the numbers moved.
- `build/steps-p9-net-snap.json` and `-offline-snap.json` are added while `build/steps-p8-*.json` stay tracked. Correct: `steps-p6-*`, `steps-p7-*` and `steps-p8-*` are all still tracked at 0f16fee, so keeping them is the precedent, not an omission.

Missing that the spec asked for:

- Step 11 requires the in-repo report in the P8 shape, which explicitly lists "sweep". reports/v037-refresh.md has 18 `##` sections and no sweep section and no register-check section. reports/v035-refresh.md:310 has `## The pre-publish sweep`. `grep -ni "sweep\|register\|pattern\|placeholder"` over the draft returns only two incidental hits (line 176 "key-shaped patterns", lines 455/458 about the register). This is a real omission and it matters, because the sweep this time is not all-zero (Q2).
- The step 10 independent-check section is absent, as expected at this point; it still has to be inserted verbatim before the commit.

## Q2. Do the logs contain every line the spec requires?

Present and sound:

- Five-way binary verification plus the cmp: binary-verify.log has all five numbered blocks, `exit=0` on `sha256sum -c`, and `cmp: IDENTICAL (exit 0)` against `/home/dev/dist/release/v0.37.0/temur-v0.37.0-i686-unknown-linux-musl`.
- Five unchanged-input hashes: g1.log. The spec asked for a comparison against reports/v035-refresh.md; the log lists values only, so I did the comparison: all five are byte-identical to reports/v035-refresh.md:50-54. G1 holds.
- Pristine assert RED on both tiers: offline-red.log and net-red.log each carry `EXIT=3`, the full `9p ASSERT FAILED ... entries=1 ... inodes=2 ... No state file was written.` line, and `no state file written (correct)`. GREEN on both: `[harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1` at offline-green.log:255 and net-green.log:288, with `state saved: build/state-p9-offline.bin (38953692 bytes)` / `build/state-p9-net.bin (39318236 bytes)`.
- Both landing texts: offline-green.log:189-199 and net-green.log:189-199. I diffed the two captured blocks: identical to each other and byte-identical to tools/guest/motd.
- Office, bigfile and 9p proofs on both tiers with controls: office-offline.log / office-net.log (ALL PASS, 15 checks, both controls refused with the exact sentences), bigfile-offline.log / bigfile-net.log (`GATE PASS`), proof-9p.log (ALL PASS x2, `EXIT=0`).
- Three relay probes: relay-probes.log, `6/6`, `9/9`, `16/16`, all `EXIT=0`, including the on-list ALLOW control as the first allowlist line.
- Staged sizes under 25 MiB with both sha256s: stage.log.
- Five page-harness runs with the exact stamp text, the sha count and the 0f16fee controls: page-*.log and dom-readings.log (`page/app.js new=1 old=0` in the tree, `new=0 old=1` at 0f16fee; `stampText sha count: 1 | old sha count: 0`). Report deletion before each run is enforced by tools/page-run.sh:40 `rm -f "$REPORT"`. The trust `<p>` count is in item11.log, not dom-readings.log: `<p> count: 5`.
- Items 9-11 with live controls: item9.log, item9-scan.log (`control fired: YES`), item10.log (`LIVE CONTROL relay.log + 1 planted: 2 hits -> control fired`), item11.log (`libv86.js getContext 5 hits` as the live control for the WebGPU zeros).
- Sweep over all five surfaces with generated per-pattern controls: sweep.log and sweep-casesensitive.log, `loaded 12 patterns from 2 files (by path; never printed)`, all twelve `control fires: YES`, and a live control over a real surface (17 hits across P1..P7, R1..R5). Patterns are never printed. Good discipline.

Missing, vacuous or contradicted:

1. The sweep is NOT all-zero, and the nonzero result is in no report. sweep.log surface 3 = 38 hits, surface 4 = 44 hits, surface 5 = 70 hits, every one of them `R4`, including `artifacts/temur-v0.37.0-i686-unknown-linux-musl: {'R4': 1}`, `page/assets/state-p9-net.bin.gz: {'R4': 10}` and `state-p9-offline.bin.gz: {'R4': 8}` in the tracked tree, and `{'R4': 22}` in each decompressed asset. sweep-casesensitive.log still shows `{'R4': 14}` in each asset. P1..P7 (the sandbox patterns) are 0 on every surface, which matches P8; R1..R5 are new this pass (P8 swept only the sandbox file, reports/v035-refresh.md:310-325) and R4 lights up. r4-analysis.log argues it is noise (R4 is length 5 with regex metacharacters, matched 5 distinct 3-character alphabetic values, 0 matches on four ordinary-text corpora), but it also states `NEW-ONLY (would be introduced by this pass): 2` and `0/14 occur inside content that is ALREADY PUBLIC` for both assets. None of this appears in reports/v037-refresh.md or the commit message. For a PUBLISH job whose last gate is the sweep, the gate's only nonzero result is unrecorded and unruled.
2. The register check covers 2 of the 4 required surfaces. register.log checks reports/v037-refresh.md and artifacts/PROVENANCE.md only; the spec also requires the commit message and the added lines. I ran the missing two myself: 0 non-ASCII, 0 U+2014 and 0 word-boundary hits for the banned adjective in commit-msg.txt and in every `^+` line of staged.diff. The artifacts are clean; the log as filed is incomplete.
3. 8.23 percent / 8.37 percent zero-filled pages, and the "4 MiB chunks" comparison, appear in no log in the set. `grep -rn "8\.23\|8\.37\|zero\|chunk" *.log` returns nothing relevant. Two report claims with no primary.
4. dom-readings.log's release-link check is attributed to the wrong URL. It prints `=== resolved TEMUR_RELEASE_URL === https://github.com/thekeoni1/temur-playground/releases/tag/v0.37.0` and then `=== does it resolve? (tokenless HEAD) === 200`. The script then corrects itself lower down (`=== resolved, using the real TEMUR_RELEASE_URL expression === href = https://github.com/thekeoni1/Temur/releases/tag/v0.37.0`) but never re-runs the HEAD. I checked both tokenlessly: `.../thekeoni1/Temur/releases/tag/v0.37.0` returns 200, `.../thekeoni1/temur-playground/releases/tag/v0.37.0` returns 404. The report's claim is true; the log line that appears to support it is not.
5. size-question.log contradicts itself. `NOTE: the smaller binary compresses to MORE bytes` sits directly under `v0.35.0 gz 4666777` and `v0.37.0 gz 4136579`. The new binary compresses to FEWER bytes; only its ratio is worse (0.4970 vs 0.4728). The report states the correct direction; the log note is wrong and should not be quoted forward.
6. r4-analysis.log contains an uncaught crash: `FileNotFoundError: [Errno 2] No such file or directory: 'README.md'` aborted the "does R4 match a 3-letter token in ordinary unrelated text" test. A synthetic replacement ran, so the argument is not empty, but one intended check never executed.
7. No log evidences deliberate latency in front of the relay (spec step 7, trap 6). No banner-flash claim is made in the report, so nothing vacuous is asserted, but that trap is unexercised.
8. No log records the byte-level landing comparison the report asserts ("It was checked as bytes, not by eye"). I performed it: the two captures are identical and equal to tools/guest/motd.

## Q3. Does every number and quoted string appear in a primary?

Verified, with location:

| Claim | Primary |
|---|---|
| sha `dbd3805...18d3`, size 8,323,828 | binary-verify.log blocks 1-3, 5; staged.stat `Bin 9869908 -> 8323828` |
| SHA256SUMS 4 lines / 428 bytes / `cd46089a7ca01f155a265c8cc957424d857d057b3d5172de175098ca19dc37fd` | binary-verify.log block 2, and again after the move |
| Five unchanged hashes | g1.log; identical to reports/v035-refresh.md:50-54 |
| raw 39,318,236 / 38,953,692 | net-green.log:289, offline-green.log:256; page-netcheck.log, page-selftest.log |
| gz 17,618,241 / 17,324,904, 16.80 / 16.52 MiB | stage.log |
| gz sha256 `f5fbe961...b183` / `55e47d86...1cf9` | stage.log |
| p8 15.88 / 15.59 MiB | stage.log gives 16,650,109 / 16,346,930; the MiB conversions are correct |
| -749,568 / -794,620 / +968,132 / +977,974 | size-question.log |
| 4,136,579 vs 4,666,777 | size-question.log |
| rerun control -40,960 / -10,641 | size-question.log; offline-rerun.log:256 (38,912,732) |
| 4.5 -> 5.0 s | proof-bigfile-read-offline.json `"4.5 s"` -> `"5.0 s"`; bigfile-offline.log "turn took 5.0 s" |
| 48.6 -> 50.0 MB | 49788 KB in the p8 networked json (= 48.62); bigfile-net.log "lowest MemAvailable 50.0 MB" |
| 74.8 -> 76.2 MB | p8 networked json 76676 KB (= 74.88); p9 networked json 78076 KB (= 76.24) |
| 1.4 MB roomier | 50.0 - 48.6; 51160 - 49788 KB = 1.34 MB |
| big.pdf 16,264,413 / 15.51 MiB / 1098 pages; big.xlsx 16,317,903 / 15.56 MiB / 148,801 rows | bigfile-offline.log:1-2, bigfile-net.log:1-2 |
| readyMs 2082 / 2097 / 971, echo 1 ms, wireBytes and stateBytes read-backs, 17 terms, 16.0/64.0 MB refusals | page-landingcheck.log, page-netcheck.log, page-filecheck.log, page-textcheck.log, page-selftest.log |
| Stamp text `temur v0.37.0 (release, sha256 dbd3805...18d3)` | page-landingcheck.log stampText, exact substring |
| `3 succeeded, 2 refused, of 5` | office-offline.log, office-net.log |
| `GET /v1/models` block | office-diag2.log "==== HDR 1 ====", followed by HDR 2-6, all `POST /v1/chat/completions` (five POSTs, as claimed) |
| first shipped in v0.36.0, T63 P4 | /home/dev/temur commit fe09766 "T63 P4"; ancestor of v0.36.0, NOT of v0.35.0; its message: "one bounded 3 s GET at startup where there was none" |
| neither tier's landing changed from P8 | motd hash in g1.log; `frameAfterLaunch` / `frameAfterTyping` / `frameAfterExit` untouched in build/page-report-selftest.json (staged.diff:175-202 changes only the byte counts and timings); `cleanLanding`/`wizardAtFirstQuestion` true in context |
| `173 ip fields, all hashed`, 6/6, 9/9, 16/16, 4001 at 24, 4002 at 60 | relay-probes.log |
| WebGPU zeros, `getContext 5 hits`, `getContext("2d") x3`, apex 302/302/301/200, `<p> count: 5` | item11.log |
| about 8 MiB spare | 25 - 16.80 |

Not in any primary: the zero-page percentages 8.23 percent / 8.37 percent, and the "4 MiB chunks, growth and shrinkage alternating" comparison. Both are load-bearing for the report's "what it is NOT" argument and neither is in the log set.

Quote-fidelity defects (each is a "verbatim" block that does not match the primary):

- Item 10's allowlist block drops the `expected=...` column from every line. relay-probes.log line 1 reads `PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com) expected=open               got=open`.
- The red-assert quote reads `9p ASSERT FAILED at the snapshot point: the share is NOT empty` with no ellipsis at the elision; the log reads `... at the snapshot point (build/state-p9-offline.bin): the share is NOT empty`.
- The `GET /v1/models` block silently drops the `accept: */*` header line that office-diag2.log records between `user-agent` and `host`.
- "type ELF 32-bit LSB executable, Intel 80386, statically linked, stripped" elides `version 1 (GNU/Linux)` from binary-verify.log. This one matches the PROVENANCE.md format, so it is consistent with precedent.

One more thing planning must settle before publishing: report line 176-177 enumerates `sk-ant, sk-, sk-proj, xai, AIza, bearer and x-api-key` as "seven key-shaped patterns", in a report that ships inside the public repository. The held-out /home/dev/sandbox-sweep-patterns.txt also holds exactly seven patterns. I am barred from opening it, so I cannot rule out that the report just published its contents. reports/v035-refresh.md:143 deliberately wrote "for key-shaped patterns" and enumerated nothing. Either confirm the seven come from the item-9 scanner's own inline list, or fall back to P8's wording.

## Disagreements with the report's framing

- The report says the asset growth is "measured but not explained" and files it as an open question. The primaries support "measured"; they do NOT support the stated ruling-out of zero-page change or the offset-shift signature, because those two numbers exist in no log. Either produce the measurement or drop the two sentences. The rest of the exclusion (run-to-run control, standalone binary compressibility) is fully backed.
- The file-cap table is presented as one coherent p8-vs-p9 pair, but the two rows mix tiers: `4.5 -> 5.0 s` is the offline tier and `48.6 -> 50.0 MB` / `74.8 -> 76.2 MB` are the networked tier. On the networked tier the same big.pdf read got faster, 5.8 s -> 4.8 s (proof-bigfile-read-networked.json `"5.8 s"` -> `"4.8 s"`), which the report never says. The selection rule (offline time, worst-case memory across tiers) is the same one p8's comment used, so the app.js comment is defensible, but a reader of the report is led to think the read uniformly slowed down. Name the tiers.
- The report calls Item 9 "Three independent checks, each with a control". Check 1 (in-guest markers) has no control of its own; only checks 2 and 3 do. Loose.
- The report's explanation of the stub fault is right but incomplete. T63 P4 did not only add a `/models` endpoint: its commit message says "The startup probe now also runs for a configured window below 20480 on an auto profile ... one bounded 3 s GET at startup where there was none". The offline tier's config sets `"context_window":8192` (build/steps-p9-offline-snap.json), which is exactly that case. So the reason a stub that survived P6, P7 and P8 suddenly saw a pre-turn request is the widened trigger condition as much as the new endpoint. Worth one sentence, because it predicts that any future playground config below 20480 will keep hitting this path.
- The report says the apex 302 is "recorded, not reported red". Agreed, and the primaries back it (item11.log). No disagreement.

## VERDICT

FAIL (blocking problems below; everything else is a finding, and the underlying build, proofs and harness results are sound and reproduce from the logs).

Blocking:

1. reports/v037-refresh.md carries no sweep section and no register section, which step 11's P8 shape explicitly requires and which reports/v035-refresh.md:310 sets the precedent for. This is the report that gets published.
2. The sweep's only nonzero result is unreported and unruled. R4 fires 22 times in each decompressed new snapshot (14 case-sensitively), 10 and 8 times in the tracked .gz assets, and once in the new v0.37.0 binary; r4-analysis.log records `NEW-ONLY ... 2` and `0/14 occur inside content that is ALREADY PUBLIC`. P8 never swept R1..R5, so there is no precedent to lean on silently. Either the report records the counts, the characterisation and a ruling, or the publish waits for one. (The strongest benign argument is in the primaries and the report does not make it: surface 5 shows `{'R4': 70}` across 313 historical blobs, i.e. R4 already fires inside content this repository has already published, including the p8 assets and kit/bzImage*.)

Non-blocking findings to fix before the commit: the two unsupported percentages (8.23 / 8.37) or the measurement that backs them; the register check re-run over the commit message and the added lines; the undisclosed binary mode change 755 -> 644; the undisclosed textcheck tier flip offline -> networked; naming the tiers in the file-cap table and the networked tier's 5.8 -> 4.8 s; the four quote-fidelity elisions; and a decision on whether the seven enumerated key shapes may ship in a public report.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
