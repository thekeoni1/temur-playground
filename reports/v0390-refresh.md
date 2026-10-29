# P17: the served snapshots move to temur v0.39.0

## Verdict

Both served snapshots are rebuilt on the released v0.39.0 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P16 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p16-* becomes state-p17-*, and every live reference moves
in the same commit. Nothing was released between v0.38.6 and v0.39.0
(gh release list, step10-sources.log).
This is the first refresh run on the desktop; P10 to P16 ran on the
laptop.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd, and the page's selftest frames are
equal to P16's committed report. None of the notices watched for
appears. Counted with a digit lookahead, no older version string is
inside either raw image while the new one is. The page harness reads
back the exact byte counts of the two NEW assets, which is what shows
the p17 pair is served rather than a cached p16 one.

v0.39.0 carries T68, a new general-purpose default prompt. The proofs
talk to a guest stub, so nothing was expected to flip, and nothing
did. Two things were watched for movement. The F29 footer did NOT
move: the cap is computed from the window minus the prompt, and a
different number was expected, but on both tiers the footer reads,
verbatim, as at P16:

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)

The guest's 8192-token window is below 20480, so temur runs the
compact prompt profile there (the plain start on the offline tier
prints "[!] prompt profile: compact (context_window 8192 is below
20480 ...)"); that is consistent with an unchanged cap, but this pass
did not measure why. The worse-tier memory floors moved: the PDF floor
fell from 50.0 MB to 49.9 MB and the spreadsheet floor stayed at 76.2
MB, and the PDF read took 6.0 s on both tiers against 5.5 s. The
file-cap gate passed, so the caps do not move; page/app.js's
measurement comment was rewritten to the measured figures.

Three more things are recorded rather than smoothed over. The offline
build landed on a raw size no earlier refresh recorded, 37,679,836 B,
in the smaller offline family and 40,960 B above P13's; the networked
build landed 4,096 B above P16's raw size, in the larger networked
family. Both are well inside the limit and both are reported, not
stopped on. The five page checks were run three times, because the
app.js measurement comment was edited twice after the first round; the
committed page reports are from the third round, against the committed
app.js. The big-file proof's spreadsheet came out 43,988 B larger than
P16's (149,201 rows against 148,801) from the same unchanged generator,
and the comment now says so.
The sweep's only nonzero pattern is R4 on binary and kernel content,
under the standing P9 ruling: all twelve controls fire and every
authored surface is 0. This commit is not a
decision to publish.

## The build input

    file    temur-v0.39.0-i686-unknown-linux-musl
    sha256  b54b4f3bf2cb86961eba14b536a9902e46940988504a885075f0e26fbdf1af03
    size    8,368,620 bytes
    type    ELF 32-bit LSB executable, Intel i386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-10-28; the i686 asset arrived in 2.73 s at HTTP
200 with the full byte count on the first fetch. The hash is checked
FIVE ways before the binary is used:

    computed from the downloaded file   b54b4f3b...af03
    the published SHA256SUMS line       b54b4f3b...af03
    the value planning supplied         b54b4f3b...af03
    sha256sum -c                        temur-v0.39.0-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.39.0`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.38.6,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.6  temur 0.39.0

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 d7a22a8f3b9b697d4f61d07adc7f97736d3b5756db595f8285567c80d238aa0b,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim. Its i686 line:

    b54b4f3bf2cb86961eba14b536a9902e46940988504a885075f0e26fbdf1af03  temur-v0.39.0-i686-unknown-linux-musl

v0.38.6 was 8,365,108 bytes, so the binary GREW by 3,512 bytes. The
download arrived mode 644 and was set to 755; the v0.38.6 binary was
removed by name with `git rm`.

## What did NOT change

                           this build (P17)   P16 record
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

All five hash identically to the values in reports/v0386-refresh.md,
so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the proofs, the page checks and the three
probes.

The two step files the generators write, build/steps-p17-net-snap.json
and build/steps-p17-offline-snap.json, are byte-identical to P16's
committed steps-p16-* files: the renamed generators changed their
header and output path only.

`npm ci` from the committed package-lock.json installed v86
0.5.458+gd96be77, the version the lock pins (0.5.458) and the same lock
P16 ran on; wisp-js 0.4.1 and xterm 6.0.0.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other. P16's own captures were kept in its
work directory on the laptop and are not on this machine; the
comparison with P16 is through the page instead, below.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P16. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
equal to P16's committed report, and landingcheck reports cleanLanding
true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. A plain `temur`
    start on each restored snapshot printed no archive notice: the
    offline tier printed its header ("temur 0.39.0 (model=local,
    thinking=false)"), the compact-profile notice and "> bye" at end of
    input; the networked tier printed temur's no-config guidance. The
    files named *temur* outside /proc and /sys are /etc/temur-motd and
    /usr/bin/temur on the networked tier, and those two plus
    /root/.config/temur, the offline tier's shipped config, on the
    offline tier: the overlay's own files and no session or state file.
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
(d) THE VERSION STRINGS INSIDE THE MACHINE, counted in the raw images
    before gzip, plainly and ANCHORED with a digit lookahead
    (`grep -a -o -P '0\.38\.N(?!\d)'`), as P15 introduced. The plain
    "0.38.4" sits three times inside the v0.39.0 binary, every time in
    the rustix-0.38.44 dependency path, as at P15 and P16 (all 3 of 3
    are inside "rustix-0.38.44" in the binary; step10-sources.log).

                                 0.38.1 0.38.2 0.38.3 0.38.4 0.38.5 0.38.6 0.38.44 0.39.0
                                 pl an  pl an  pl an  pl an  pl an  pl an          an (control)
        build/state-p17-net.bin   0  0   0  0   0  0   3  0   0  0   0  0     3       1
        build/state-p17-offline   0  0   0  0   0  0   3  0   0  0   0  0     3       1
        (the v0.39.0 binary       0  0   0  0   0  0   3  0   0  0   0  0     3       1)

    Every anchored count for 0.38.1 through 0.38.6 is 0, the plain
    "0.38.6" and "0.38.5" are 0 ("0.38.66" and "0.38.55" are 0 too), and
    the plain "0.38.4" count equals the "0.38.44" count in each image
    (3 = 3), so no old binary or old file is inside the machine. The
    anchored control, 0.39.0, is 1 in each image and 1 in the binary
    ("0.39.00" is 0): the one copy of /usr/bin/temur accounts for every
    occurrence. The lookahead itself was checked: it counts "x0.38.6y"
    once and "x0.38.66y" not at all.

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p17-net.bin      39,379,676 B   17,636,024 B   16.82 MiB
    state-p17-offline.bin  37,679,836 B   15,837,865 B   15.10 MiB

    (p16, for comparison: 39,375,580 / 17,636,908 B = 16.82 MiB net,
                          38,986,460 / 17,341,580 B = 16.54 MiB offline)

    sha256  state-p17-net.bin.gz      da3f260d3af8d1c2461dd15011f2afc401de6a88d3ba224e8fcd81f7af914106
    sha256  state-p17-offline.bin.gz  11a0695d80fed37f485e8de8712893bcb791ec03355b4f0bf4159db2f65be738

Both are inside the limit with more than 8 MiB to spare. Each staged
.gz, gunzipped, is byte-identical (cmp) to the build/state-p17-*.bin
every proof ran against.

P10 and P11 established that a build lands on one of two sizes about
1.3 to 1.4 MB apart raw from identical inputs (reports/v0381-refresh.md
"Sizes"). This time:

- networked, raw 39,379,676 B: in the LARGER networked family, 4,096 B
  above P16's and P14's 39,375,580 and 28,672 B above P11's
  39,351,004; it is 1,400,828 B larger than P15's 37,978,848 and
  1,359,872 B larger than P13's 38,019,804. Gzipped it is 884 B smaller
  than P16's and 1,523,578 B larger than P15's.
- offline, raw 37,679,836 B: in the SMALLER offline family, at a size
  no earlier refresh recorded: 40,960 B above P13's 37,638,876, 28,672
  B above P11's 37,651,164 and 348,164 B above P14's 37,331,672. It is
  1,306,624 B smaller than P16's and P15's 38,986,460. Gzipped it is
  1,503,715 B smaller than P16's.

The binary grew by 3,512 bytes, which is of the order of the 4,096 B
networked move; the offline tier's family switch is the known
two-size behaviour, not the binary. Neither is a STOP; both are
reported because the kickoff asks where each tier landed. As ruled at
P11, this stays a seed: one build per tier, the one every proof and
page check above ran against, no extra measuring build and no bisect.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p17-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p17-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p17-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p17-offline.bin (37679836 bytes)
    state saved: build/state-p17-net.bin (39379676 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using one joined expression:

       state-p17-net.bin.gz       0 hits
       state-p17-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, read
from a per-tier listing inside each restored snapshot; the same sizes
as P15 and P16). It holds the build steps' own commands and no key;
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
16/16, including the global cap's 4003.

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay logs of
both relay runs, the page server log and all five page reports scan to
0 key-shaped hits, each with a planted control that fired. The first
relay run's log has 34 ip fields, all 8-hex hashes (17 ws_open and 17
ws_close events), and ends with live 0; the second run's (the page
rerun, below) has 16, all hashed, and ends with live 0. Walking JSON
keys as well as values, the dotted quads either log carries are its
own bind address, its documentation-range address map (as keys), and
"asked" fields that all name the one mapped destination 192.0.2.1:443
(four in the first run, one in the second). By their timestamps (the
log does not tag them), stream ids 1 and 2 at 01:54:40Z and 01:54:49Z
are the two networked builds' doctor probes (red and green, 324 bytes
up each); id 3 at 02:00:03Z, 0 bytes either way and closed with the
five refusals, is the allowlist probe's on-list control; and id 9 at
02:03:06Z, 324 bytes up, falls in the first netcheck's window. These
attributions are inferred from timing.
Its plain-text refusal lines number FIVE, one per refused destination
of the allowlist probe (the unmapped address, the bare public IP, the
provider by name, port 80, loopback).

## Item 11: the page

THE KEY TRUST STORY IS STATED. page/index.html is byte-identical to
c8cc992's in this commit, so the trust block is P16's, unchanged: the
key is typed at the wizard's own hidden prompt inside the machine, the
page passes keystrokes there and nowhere else, files reach the
provider on the networked tier, and the relay holds ciphertext.

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

    PASS  the snapshot's temur is v0.39.0  temur 0.39.0
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured, and the F29 footer

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.39.0` on both.

                            v0.38.6 (p16)    v0.39.0 (p17)
    big.pdf   offline           5.5 s            6.0 s
    big.pdf   networked         5.5 s            6.0 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          49.9 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.2 MB          76.2 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,124 kB = 49.9 and 78,040 kB = 76.2, both on the
networked tier; the offline tier's were 51,276 and 78,172 kB. P16's
were 51,220 and 78,012 kB. The PDF times are 6,021 ms offline and
6,016 ms networked.)

The PDF times and the PDF floor moved, so page/app.js's measurement
comment was rewritten to what was measured: v0.39.0 named, "6.0 s
offline, 6.0 s networked", "49.9 MB", "never left 76.2 MB" (unchanged),
and v0.38.6's readings kept for comparison in place of v0.38.5's (5.5 s
offline, 5.5 s networked, 50.0 MB). The 49.9 MB floor is 1,336 kB
above v0.35.0's 49,788 kB, so the comment's "about 1.4 MB roomier than
the same read on v0.35.0" became "about 1.3 MB". The PDF is unchanged:
big.pdf 16,264,413 B / 15.51 MiB / 1098 pages. THE SPREADSHEET MOVED:
big.xlsx is 16,361,891 B / 15.60 MiB / 149,201 rows (sheet XML
72,836,828 B, 4.45x), against P16's 16,317,903 B / 15.56 MiB / 148,801
rows (step5-bigfile-*.log line 5; build/proof-bigfile-read-*.json
sizeBytes). tools/mkbig-sample.py is unchanged and seeded; it writes
rows until the deflated file nears its 15.6 MiB target, so the row
count follows the machine's deflate output (zlib 1.3.1 here). That
cause is inferred, not measured. The file is still under the 16 MiB
per-file cap (16,777,216 B), temur refused it in 0.5 s on both tiers
as at P16, and the comment's xlsx line moved to 15.60 MiB, 149,201
rows (deviation 16). The 16 MiB and 64 MiB caps are unchanged; the
gate did not ask for a move.

THE F29 FOOTER, UNCHANGED. The guest config says context_window 8192.
The tool result the big-file proof read back from temur's request body
for big.pdf is 7,591 bytes on both tiers (7,591 at P16), and it ends,
on both tiers, verbatim:

    54: 

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)
    </content>

which is the text P16 recorded. The kickoff expected a different
number, since the cap is computed from the window minus the prompt and
the default prompt changed in T68; it did not move. Its first lines
are the document's own, and line 3 is the marker:

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
serve time. The shipped CSP in page/_headers is unedited. tools/page-run.sh
deletes each report before its run. This was the harness's first run
on this machine. tools/page-run.sh is unedited from c8cc992, so its
traps 1 to 4 are the ones P16 ran; no log line records them one by
one, and every run exited 0. No file appeared in the operator's
Downloads folder: 314 entries before round 1, after round 1, and
before and after round 3, with no name differing from the round-1
listing (step7-downloads-before.log, step7-checks.log,
step7-downloads-3.log). Round 2's before and after counts (314, 314)
were printed but not logged (correction 4). The filecheck download
landed inside each run's own profile, which was then removed.

Third round, against the committed app.js (the committed reports;
step7-*-3.log, step7-rerun3-checks.log):

    landingcheck  networked, cleanLanding true, wizardAtFirstQuestion true,
                  readyMs 1953
    netcheck      networked, wireBytes 17,636,024, stateBytes 39,379,676,
                  readyMs 1952, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake) #", the trailing " #"
                  as the log and the JSON carry it
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 15,837,865, stateBytes
                  37,679,836, readyMs 923, echo 1 ms

The first two rounds, before the comment edits, gave the same results
(round 1 readyMs 1933, 1944 and 929, echo 2 ms; round 2 readyMs 1939,
1932 and 924, echo 1 ms). The selftest frames equal c8cc992's in all
three rounds. netcheck and selftest report
exactly the wire and state sizes of the two NEW assets, which is the
check that the page serves the p17 pair.

## The stamp names v0.39.0

The footer stamp reads, from the served page:

    temur v0.39.0 (release, sha256 b54b4f3bf2cb86961eba14b536a9902e46940988504a885075f0e26fbdf1af03)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.39.0, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The wrap rule `#stamp code`
is in the page the local server served (1 hit). The app.js the local
server served is byte-identical to page/app.js in this commit.

    CONTROL at c8cc992:  old sha 1 hit, new sha 0 hits   (page/app.js)
    working tree:        old sha 0 hits, new sha 1 hit

## The pre-publish sweep

Run LAST. Both pattern files are referenced BY PATH and never opened into
this repository, printed or copied: the sandbox pattern file, copied
from the laptop by the operator on 2026-10-29 (7 active patterns,
S1..S7), and the release leak file (5 active, R1..R5). Their active
counts were read structurally (non-comment, non-blank lines), never by
content. Findings are positional counts only. The sweep and the
register check were run by two scripts written for this pass from
P16's description (deviation 14).

CONTROLS ARE GENERATED, one per pattern, by walking each pattern's parse
tree to a string that matches it. All twelve fire, and appending each
to the added-lines surface raises its pattern's count by one:

    S1..S7 control fires: YES (7/7)
    R1..R5 control fires: YES (5/5)

A hit is a line (split on newline) with at least one match, as
grep -c counts. Counts, patterns as written (case-sensitive):

    surface                                   S1..S7  R1,R2,R3,R5   R4
    1  added lines of the diff (-M)              0         0         0
    2  the commit message                        0         0         0
    3  every tracked file                        0         0        14
         of which tracked text files             0         0         5
    4  both new .gz, through gzip                0         0        22
    5  full history (all refs, blobs, commit     0         0        25
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 14 hits in 9 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits) and the five committed kit/kernel*.config files (1 each; the
  five "text" hits). Neither new p17 .gz has a hit as committed bytes.
- surface 4, 22 hits: 11 in each decompressed p17 image.
- surface 5, 25 hits in 18 blobs: the same nine kit blobs (14 hits),
  the committed state-p8 (3), state-p9 (1) and state-p10 (1) offline
  .gz blobs, the two p13 .gz blobs (1 each), the p14 net .gz blob (1),
  the two p15 .gz blobs (1 each), and the p16 offline .gz blob, now
  leaving the tree and still in history (1). Commit messages and path
  names: 0. Surface 5 is the full history over all refs plus this
  commit's staged tree and message, so it counts the committed state.

Against P16 (surface 3 15, surface 5 25): the p16 pair leaves the tree
(-1 on surface 3, since only its offline .gz hit as committed bytes)
and stays in history, and neither new .gz hits as committed bytes (+0
on both surfaces). The authored surfaces, 1 and 2, are zero for all
twelve patterns, and no authored text file in the tree has a hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 37 / 35 / 209 on surfaces
3, 4 and 5 and stays 5 on the tracked text files and on the text
blobs, messages and paths of surface 5, the same five kernel configs.
Every case-insensitive surface 3 hit is in kit/bzImage* (14), the five
kernel configs (5) or the two new .gz as committed bytes (9 each); every
surface 5 blob with a hit is a kit/ file, a page/assets/state-* .gz or
the v0.37.0 temur binary once committed under artifacts/.

Logs: step8-sweep-input.log (the path sentence, stat, structural
counts), step10-sweep-cs-final.log, step10-sweep-nocase-final.log
(the final text). step8-sweep-cs.log and -nocase.log are the first
runs, on the draft; their counts are the same.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective: its stem as a whole word, with an
optional "ly" or "y", case-insensitive (the laptop definition, relayed
by planning). The no-boundary form planning gave first is counted too.

    surface                      adjective  (no-      U+2014  non-ASCII
                                            boundary)  (lines)   (lines)
    reports/v0390-refresh.md         0         0         0        0
    artifacts/PROVENANCE.md          0         0         0        0
    the commit message               0         0         0        0
    the added lines of the diff      0         0         2        3

    LIVE CONTROL (planted string)    1         1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P16 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot, as
at P16. No prose this pass wrote has a hit.

The figures above are from the final text of the report and the commit
message (step10-register-final.log).

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    npm ci

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.39.0-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.39.0/temur-v0.39.0-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.39.0/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.39.0-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.39.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p17-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p17-offline-snap.json 128 \
        build/state-p17-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p17-offline-snap.json 128 build/state-p17-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p17-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p17-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p17-net.bin

    # the version strings inside each raw image, anchored and plain
    grep -a -o -P '0\.38\.6(?!\d)' build/state-p17-net.bin | wc -l   # 0
    grep -a -o -F '0.38.4' build/state-p17-net.bin | wc -l           # = the 0.38.44 count

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p17-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p17-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p17-offline.bin offline
    # ... and the same three with state-p17-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p17-*.bin.gz

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
c8cc992 in this commit.

## Deviations from the kickoff

1. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10 to P16: each
   restored snapshot was listed for temur state and started once with a
   plain `temur`, stdin from /dev/null. It is not committed. It tests
   its own two regexes against a planted string, and a further check
   that the plain start actually ran (see correction 2). A third copy
   of the same probe also listed /root/.ash_history for item 9.
2. A SECOND OUT-OF-TREE PROBE read the F29 footer, as the kickoff
   directs. A copy of tools/proof-bigfile-read.mjs, outside the
   repository, differing in two added lines that print the last 400
   bytes of each tool result and in its JSON output path (the work
   directory, not build/), was run once per tier against the same two
   snapshots after the committed proof had run. It was copied from the
   committed proof after the version pin moved, so its own version
   assert also read `temur 0.39.0`. It reported GATE PASS on both tiers
   with the same 7,591-byte and 68-byte tool results. The committed
   build/*.json are from the committed proof's run, and the committed
   proof is not changed by it. Per the ruling on P14's open question,
   its timings stay out of the table and the comment; they are
   disclosed here: big.pdf read in 6.0 s on both tiers, lowest
   MemAvailable 51,288 kB offline and 51,152 kB networked; big.xlsx
   0.5 s on both tiers, lowest MemAvailable 78,216 kB offline and
   78,064 kB networked.
3. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P16.
4. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 to P16; no whole-DOM count was taken. The
   wrap rule was read from the index the local server served.
5. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here. It was written fresh on this
   machine, since P10's lives with the laptop's work files.
6. The page harness launches Windows Edge, and tools/page-run.sh puts
   each run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design. The logs this job kept replace the profile path
   with a placeholder, and the fifteen profiles this job's three rounds
   created were removed by name afterwards, from the directory the
   harness itself asks Windows for. No older pagerun-* profile was
   present.
7. THE PAGE CHECKS RAN THREE TIMES. The first round ran before
   page/app.js's measurement comment was rewritten; the comment edit
   changes the bytes the page serves (and the stamped asset refs), so
   the stamp was redone from a bare index, the relay restarted, and
   all five checks re-run. The independent check then found the
   comment's xlsx line stale (deviation 16); after that edit the local
   commit (0357abb, never pushed) was soft-reset to c8cc992 so the
   stamp would name the parent as at P14 to P16, and all five checks
   ran a third time (step10-uncommit.log, step7-*-3.log). The
   committed page reports are from the third round. All three rounds
   passed.
8. Every pin the kickoff listed was moved; no tracked reference outside
   the list named the version or the pair. The lines that still name
   an earlier version after the move are the intended history and
   comparison lines (artifacts/PROVENANCE.md, page/app.js and
   tools/stage-page.sh; listed in step3-pins-after.log). Not on the pin
   list and left as it was: artifacts/PROVENANCE.md still calls the
   in-machine version check the "fourth" check, where this report
   counts it as the sixth, and its "type" line still says "Intel
   80386", where this machine's file(1) prints "Intel i386" for the
   same binary.
9. build/steps-p17-net-snap.json and build/steps-p17-offline-snap.json
   are added as new files, byte-identical to the p16 step files, as
   each earlier refresh added its own.
10. The pin greps before and after the move used ONE pattern, kept in
   a file beside the logs, so the two lists are comparable line for
   line. build/page-report-textcheck.json is unchanged by the rerun;
   it carries no timing or size fields.
11. The binary was downloaded into the work directory and copied into
   artifacts/ after the five-way check, rather than downloaded into
   artifacts/ directly as Reproduce shows. The bytes are the same
   (cmp, and the in-tree sha256sum -c).
12. The first process check of step 0 used `pgrep -f '[t]emur'`,
   which matched the planning and implementing tmux session names and
   the preflight's own shell. An exact-name recheck (pgrep -x) was
   appended to the same log and was clean. Accepted by planning; the
   relay's own check thereafter was `pgrep -af '[r]elay/relay.mjs'`.
13. THE SANDBOX PATTERN FILE was not on this machine at step 8. The
   sweep was stopped and planning ruled (T68-21): the sandbox pattern
   file, copied from the laptop by the operator on 2026-10-29, is the
   one used below, referenced by path and never opened.
14. P16'S SWEEP AND REGISTER SCRIPTS were untracked laptop scratch and
   are not on this machine. Two were written for this pass from P16's
   description of the sweep and the register check (five surfaces,
   case-sensitive and case-insensitive passes, R4 hits and blobs kept
   apart, controls from parse trees; four surfaces, three columns, a
   planted control). They are kept untracked beside the logs. Their
   surface 3 and surface 5 R4 figures on the files and blobs P16 also
   scanned equal P16's, file by file.
15. THE SANDBOX FILE'S PATH reached this session in planning's ruling
   (T68-22), not typed by the operator here as T68-21 first said. The
   sentence was logged verbatim with its source, then `stat` only.
16. THE BIG-FILE SPREADSHEET is not P16's document: 16,361,891 B and
   149,201 rows against 16,317,903 B and 148,801, from the same
   unchanged generator (see the file-cap section). The draft and the
   first commit still gave P16's figures in page/app.js and here; the
   independent check caught it. Both now give the measured figures.
17. step1.log's first line is its section header, not "noclobber on".
   Every other log starts with it.
18. step7-selftest-2.log (round 2) has no ANTHROPIC_API_KEY count line;
   the logs on either side of it read 0, and its round-3 replacement,
   step7-selftest-3.log, carries the line (0).
19. THE LANDING was compared byte for byte with tools/guest/motd (486 B,
   both tiers) and through the selftest frames against c8cc992's
   committed report, not with P16's raw landing captures, which are on
   the laptop.
20. The diff touches the same 26 files as P16's, each under its p17 or
   v0.39.0 name; no file differs from that list.
21. THE ADDED LINES ARE NOT ALL ASCII: three regenerated build/*.json
   machine captures carry non-ASCII (two with U+2014), as at P9 to
   P16 (see the register check). This report follows that precedent
   rather than meeting "every added line ASCII" literally; planning
   to confirm it still stands.

## Corrections

1. The first extraction of the landing text anchored the login line at
   the start of a line. The WRONG ASSUMPTION was that the serial
   capture's login line starts with its text; it starts with a carriage
   return, so nothing matched and both extracted files were 0 bytes
   (kept as landing-*.txt beside the logs). It was re-run unanchored
   and both captures are 486 bytes and equal to the motd
   (landing-*-2.txt, step4-landing.log).
2. The first run of the plain-start probe wrapped temur in `timeout`.
   The WRONG ASSUMPTION was that the guest's BusyBox has `timeout`; it
   does not, so the shell printed "timeout: not found", temur never
   ran, and the "no archive notice" check passed vacuously. The probe
   was rewritten without `timeout` and gained a check that the plain
   start actually ran; the figures in (a) are from that run
   (step4-session-state-*-2.log). The first run's logs are kept.
3. The app.js measurement comment was edited after the first round of
   page checks. The WRONG ASSUMPTION was that a comment edit could not
   change what the page checks saw; it changes the served bytes and
   the stamped refs. All five checks were re-run (deviation 7).
4. Round 2's Downloads counts were printed to the terminal, not to a
   log. The WRONG ASSUMPTION was that a check seen on screen is a
   primary; it is not. The round-2 counts are recorded after the fact
   in step7-downloads-3.log, and round 3 logs its counts before and
   after.
5. The big-file documents were reported as unchanged from P16. The
   WRONG ASSUMPTION was that a seeded generator gives the same file on
   any machine; the spreadsheet's row count depends on the deflate
   output, and the proof logs already showed the new size. The
   comment and this report were corrected (deviation 16).

## The independent check

A fresh subagent was given ONLY the kickoff, P16's report, the diff of
the first local commit (0357abb), the draft of this report, the commit
message and the gate and scan logs. It never saw the conversation that
produced the work, and the two sweep pattern files were held out of its
reach. Its answer is reproduced verbatim below, indented. Its line
numbers refer to the draft, not to this file.

WHAT WAS DONE ABOUT IT. Blocking 1 is done: page/app.js's xlsx line
says 15.60 MiB, 149,201 rows; the file-cap section names the move and
its inferred cause; deviation 16 and correction 5 record it. Because
that edit changes the served bytes, the unpushed commit was soft-reset
to c8cc992 and all five page checks ran a third time; the committed
page reports are from that round (deviation 7). Blocking 2 is done:
round 3 logs the Downloads count and names before and after
(step7-downloads-3.log, 314 / 314, 0 names differing), its profile
removals log the files inside each profile (0), and round 2's
terminal-only counts are recorded there and in correction 4.
Non-blocking 1, 2, 5, 6 and 7 are deviations 17, 18, 19, 20 and 21.
Non-blocking 3 and 8: the sweep and the register check were re-run on
this final text and the final commit message (step10-sweep-cs-final.log,
step10-sweep-nocase-final.log, step10-register-final.log), and the
sections above cite them. Non-blocking 4: the rustix and release
claims now cite step10-sources.log (3 of 3 "0.38.4" hits are inside
"rustix-0.38.44"; gh release list shows nothing between v0.38.6 and
v0.39.0), and the traps sentence now says only that tools/page-run.sh
is unedited from c8cc992. Q3 item 6: the operator-copy wording is
planning's ruled text; deviations 13 and 15 say where the path came
from. Non-blocking 9 needs no change.

    ## Independent check of P17 (commit 0357abb, unpushed)

    Inputs read: the spec (/home/dev/p17-impl.md), P16's report, p17-commit.diff, the draft report (reports/v0390-refresh.md, sha256 prefix 3db3df475be80f5e, the same in the commit and the working tree), commit-msg.txt, and every log in the archive and its dl/, oot/, scan/ and check/ folders. I used read-only git in the playground checkout. I did not open the private pattern files and did not run the scan scripts. I did read the sources of sweep.py, register.py and patfile_shape.py.

    ### Q1. Does the diff do what the spec says and nothing else?

    **Mostly yes, with one defect inside the scope of the change.**

    - **File list.** The diff stat has 26 files. They map one to one onto P16's 26 files (`git show --stat c8cc992`), each under its p17 or v0.39.0 name. No file is added or missing compared with that list.
    - **relay/ is untouched.** `git diff c8cc992 0357abb -- relay page/index.html page/_headers` is empty. step3-unchanged.log shows relay tip 9c9eb67 and "relay/ diff lines vs c8cc992: 0".
    - **page/index.html is bare.** step8-index.log: "cmp vs c8cc992 blob: identical".
    - **Every listed pin moved:**
      - page/app.js lines 60-61 and 74-75;
      - .gitignore 23-24;
      - THIRD_PARTY.md 64-65;
      - PROVENANCE.md and SHA256SUMS (the committed SHA256SUMS equals dl/SHA256SUMS);
      - the asset rename (blob sha256 b54b4f3b...af03, mode 100755);
      - stage-page.sh;
      - the two renamed generators;
      - the version asserts in proof-office-read.mjs:137-138 and proof-bigfile-read.mjs:270-271;
      - the regenerated build/ JSONs;
      - the two new step files, which I confirmed byte-identical to c8cc992's steps-p16-* with cmp.
    - **Committed bytes match the logs.** The committed .gz blobs are 17,636,024 B (sha da3f260d...) and 15,837,865 B (sha 11a0695d...), as step6-stage.log records.
    - **DEFECT: the app.js measurement comment did not fully move to what was measured.** page/app.js:861 in the commit still says `big.xlsx 15.56 MiB, 148,801 rows`. This pass measured a different document:
      - step5-bigfile-offline.log:5 and step5-bigfile-net.log:5 say "big.xlsx 16361891 B 15.60 MiB 149201 rows".
      - The committed build/proof-bigfile-read-*.json "sizeBytes" moved from 16317903 to 16361891 (the diff hunks at "big.xlsx").
      - tools/mkbig-sample.py is unchanged (not in the diff) and uses a seeded PRNG, so the change most likely comes from this machine's zlib/zipfile output. That is a guess on my part; no log says why.
      - The spec (step 5) says the comment "moves only to what was measured". Line 861 was not moved and is now wrong.

    ### Q2. Do the logs contain every line the spec requires?

    **Nearly all; there are three gaps.** Present and correct:

    - **Step 0.** preflight.log has the key count 0, node v24.20.0, Edge present, powershell.exe present, gh main = c8cc992, the disk check (stdin /dev/null, timeout 120), the process check plus the exact-name recheck, no listeners, and the clone dir absent.
    - **Step 1.** clone.log and step1.log: HEAD c8cc992, npm ci rc=0, installed v86 0.5.458+gd96be77, and P16's lock 0.5.458.
    - **Step 2.** step2-download.log has all five checks (computed, SHA256SUMS line, planning's value, sha256sum -c OK, cmp_exit=0), plus the SHA256SUMS size and sha. The deliberate red appears in step5-office-preswap.log ("FAIL the snapshot's temur is v0.38.6 temur 0.39.0", EXIT=1).
    - **Step 3.** step3-unchanged.log: five hashes "same" and relay 9c9eb67.
    - **Step 4.**
      - Red runs exit 3 with no state written: step4-offline-red.log and step4-net-red.log.
      - Green runs: step4-offline-green.log and step4-net-green.log, each with "assert PASSED: entries=0 used_size=0 inodes=1".
      - Version table: step4-versions.log, with an anchored 0.38.6 count of 0, 0.39.0 at 1/1, and the lookahead control.
    - **Step 5.**
      - 9p restore: 8 PASS lines per tier.
      - Office proof: 15 PASS lines per tier.
      - Big-file gate: GATE PASS on both tiers.
      - The F29 footer verbatim on both tiers: step5-tail-*.log line 46.
      - Floors: step5-filecap-numbers.log.
      - Relay probes: 6/6, 9/9 and 16/16.
      - Landing: step4-landing.log, 486 B, equal to the motd, with a control.
    - **Step 6.** step6-stage.log: both sizes inside 26214400, the shas, the gunzip cmp, and the comparison with P16.
    - **Step 7.** Both rounds of the five page-runs; step7-downloads-before.log; step7-checks.log; profile-cleanup.log; step7-rerun-checks.log.
    - **Step 8.**
      - step8-items.log, step8-index.log and step8-sweep-input.log.
      - Sweep: step8-sweep-cs-final.log and step8-sweep-nocase-final.log, controls 7/7 and 5/5.
      - Register: step8-register-final.log.
    - **Step 9.** step9-commit.log: parent c8cc992, 26 files.

    Gaps:

    - **(a) No Downloads count after the second page-check round.** The only "after" count is step7-checks.log (19:04:19): "entries 314 (before 314); new names: [0]". That was taken after round 1. Round 2 ran 19:05:16 to 19:06:10 (step7-*-2.log), and step7-rerun-checks.log has no Downloads count. The rerun profile removals also do not record "downloads inside" as profile-cleanup.log does. The spec treats a Downloads file as a STOP, and the committed reports come from round 2.
    - **(b) step1.log's first line is not "noclobber on".** It starts "=== step 1 checks + npm ci". Every other log complies.
    - **(c) step7-selftest-2.log has no "ANTHROPIC_API_KEY count" line.** Its round-1 twin, step7-selftest.log, has one. This is the run behind the committed build/page-report-selftest.json. Many non-run logs (stage, sweep-input-adjacent and similar) also lack the line, but those are not runs.

    ### Q3. Does every number and quoted string in the report and commit message appear in a primary?

    I checked every figure against the logs and the diff. Confirmed:

    - **Binary and checksums.** 8,368,620 B; 3,512 B growth; 2.73 s; 428 bytes; 4 lines; d7a22a8f...; the file(1) type string; mode 644 changed to 755.
    - **Unchanged files.** All five hashes.
    - **npm.** v86 0.5.458+gd96be77, wisp-js 0.4.1, xterm 6.0.0.
    - **Landing.** 486 B.
    - **Version table.** All counts.
    - **Sizes and size comparisons.**
      - Raw and gzip sizes, MiB figures and shas.
      - The comparisons: 4,096; 28,672; 1,400,828; 1,359,872; -884; 1,523,578; 40,960; 28,672; 348,164; 1,306,624; 1,503,715.
      - Commit message "about 1.5 MB" is correct for 1,503,715 B.
    - **The red and green assert quotes.**
    - **ash_history.** 556 and 1,569.
    - **Relay.**
      - 34 and 16 ip fields; 17 opens and 17 closes; 8 and 8 in the second run.
      - Four and one "asked" fields.
      - Stream ids 1, 2, 3 and 9 with their times and byte counts, and five refusal lines.
      - 173 ip fields, cap at 24, codes 4001, 4002 and 4003, and 16/16.
    - **Page-level checks.** The WebGPU zeros, getContext "4 lines, 5 occurrences", "2d" x3, and the redirect chain.
    - **Office and big-file numbers.**
      - 15 PASS lines; 7,591 and 68 bytes; the footer string; the marker at line 3; the first 900 bytes (proof-bigfile-read.mjs:416).
      - Timings 6,021 and 6,016 ms.
      - Floors 51,124, 78,040, 51,276 and 78,172 kB; P16's 51,220 and 78,012; 1,336 kB over 49,788.
      - Deviation 2's 51,288, 51,152, 78,216 and 78,064 kB (oot JSONs).
    - **Page checks.** readyMs 1939, 1932 and 924, echo 1, first round 1933, 1944, 929 and echo 2, 17 terms, 16.0 and 64.0 MB.
    - **Stamp and controls.** The stamp text, release URL 200, and the old/new sha controls.
    - **Sweep.** The sweep tables: 14 hits in 9 files, 22, 25 hits in 18 blobs (I re-summed them), and case-insensitive 37/35/209 (14+5+9+9 and 18+17). P16's 15 and 25 match its report at lines 478 and 483.
    - **Register.** The table: 0/0/0/0 on authored surfaces, 2 and 3 on added lines.
    - **Report hash.** Report sha 3db3df47... equals the committed blob.

    Not found, or disagreeing:

    1. **DISAGREES.** Report lines 383-384: "Documents unchanged: big.pdf 15.51 MiB / 1098 pages, big.xlsx 15.56 MiB / 148,801 rows." The logs and committed JSON say big.xlsx is 16,361,891 B, 15.60 MiB, 149,201 rows; P16's was 16,317,903 B. The big.pdf half is correct: 16,264,413 B, 15.51 MiB, 1098 pages, unchanged.
    2. **UNSUPPORTED.** Report line 424-425: the Downloads "entry count was the same before and after both rounds". No primary covers round 2 (see Q2 a).
    3. **NOT IN A P17 PRIMARY.** Line 177, "every time in the rustix-0.38.44 dependency path". step4-versions.log shows only that the 0.38.4 and 0.38.44 counts are equal (3 = 3). The path wording is carried over from P15/P16.
    4. **NOT IN A PRIMARY I WAS GIVEN.** Line 10, "Nothing was released between v0.38.6 and v0.39.0."
    5. **NOT IN A PRIMARY.** Line 423, "its traps 1 to 4 stood". No log line records the traps.
    6. **PARTLY SUPPORTED.**
       - Line 470 and deviation 13, "copied from the laptop by the operator on 2026-10-29". step8-sweep-input.log records receipt on 2026-10-29 and a transfer copy. It does not say who copied it.
       - Deviation 13's "planning ruled (T68-21)". The logs name only T68-22 for the path (step8-sweep-input.log), and register-draft log cites T68-21 for the adjective definition. Deviation 15 already discloses this mismatch.
    7. **WRONG LOG NAMES.** Line 529-530 cites step8-sweep-cs.log and step8-sweep-nocase.log. Those are the pre-final runs (874 added lines, made before the report text was final). The figures in the report match the -final logs (973 added lines, report sha 3db3df47). The numbers are the same in both runs, so only the citation is wrong.

    The commit message: every number and quoted string in it appears in a primary. Its text equals the commit body; the only cmp difference is git's trailing newline.

    ### Findings

    #### BLOCKING

    1. **page/app.js:861 and report lines 383-384 misstate the big.xlsx document.** This pass measured 15.60 MiB, 149,201 rows (16,361,891 B). The comment and the report still say 15.56 MiB, 148,801 rows, and the report calls the documents "unchanged". Fix:
       - correct app.js line 861 to the measured figures (allowed under spec step 5);
       - correct the report sentence and name the move;
       - add it to the deviations, with its likely cause (same seeded script, different deflate output on this machine), marked as not measured.
       - The cap is still not exceeded (16,361,891 < 16,777,216), and the gate passed.
       - This edit changes app.js again. Under correction 3's own lesson, decide (or ask planning) whether the page checks must run a third time. A comment-only change alters the served bytes.
    2. **No Downloads check exists for the second page-check round, which is the round whose reports are committed.** Either log a Downloads count and name list now against step7-downloads-before.log, or narrow the report's "both rounds" claim to round 1 and record the gap as a deviation. Either way, the spec's STOP condition needs a primary for round 2.

    #### NON-BLOCKING

    1. step1.log does not start with "noclobber on" (spec rule 1). Disclose it as a deviation.
    2. step7-selftest-2.log has no ANTHROPIC_API_KEY count line, although the adjacent step7-selftest-2 run produced a committed report. Disclose it, or state that the key count was 0 from the surrounding logs (step7-textcheck-2.log at 19:06:03 reads 0).
    3. The report's "Logs:" line in the sweep section should cite step8-sweep-cs-final.log and step8-sweep-nocase-final.log.
    4. Unsupported phrases to soften or source: the "rustix-0.38.44 dependency path" (line 177), "Nothing was released between v0.38.6 and v0.39.0" (line 10), and "traps 1 to 4 stood" (line 423). Either cite a primary or mark each as carried from P16 or not re-measured.
    5. Spec step 5 asks for the landing to be byte-identical to P16's captures. That comparison was replaced by the page-frame comparison because P16's captures are on the laptop. The report says so in its landing section (lines 130-132), but it is not in "Deviations from the kickoff". Add it there.
    6. The spec asks the report to list any file that differs from P16's 26-file list. None differs, but the report never says so. Add one sentence.
    7. Added lines carry 3 non-ASCII lines (2 with U+2014). All are regenerated machine-capture JSON (build/page-report-landingcheck.json and build/proof-office-read-*.json), as at P9 to P16. The spec rules "every added line ASCII" and "non-ASCII 0 over added text lines". The report declares this by precedent instead of meeting the rule; planning should confirm the precedent still stands.
    8. Once this answer is pasted in place of CHECK_PLACEHOLDER, and after the fixes above, the report and commit message change. Re-run the sweep and the register check on the final text, as P16 did, and amend the commit while it is unpushed. The current -final logs are for report sha 3db3df47 with the placeholder in it.
    9. Method note on scan/sweep.py:
       - The controls are generated from each pattern's parse tree, skipping lookarounds and taking the first branch, and are verified only by firing.
       - The "raises by one" check runs on surface 1 only, which matches what the report says.
       - The text/binary split is a NUL test over the first 8,000 bytes.
       - I see no flaw that would hide a hit on an authored surface.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
