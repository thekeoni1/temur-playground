# P16: the served snapshots move to temur v0.38.6

## Verdict

Both served snapshots are rebuilt on the released v0.38.6 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P15 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p15-* becomes state-p16-*, and every live reference moves
in the same commit. Nothing was released between v0.38.5 and v0.38.6.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd and to the text P15 captured. None
of the notices watched for appears. Counted with a digit lookahead, no
older version string is inside either raw image while the new one is.
The page harness reads back the exact byte counts of the two NEW
assets, which is what shows the p16 pair is served rather than a
cached p15 one.

v0.38.6 carries S6, which makes `temur doctor` strip one leading
`models/` on both sides before comparing model ids. Nothing in the
guests runs doctor against a model listing: the networked tier lands
at `temur init` with no config, the offline tier lands in temur, and
the proofs talk to a guest stub whose listing has no prefix. Doctor
does run once in the networked build's probe step (and the page's
netcheck reaches the same endpoint), with a throwaway config and no
key, and its network check stops at TCP connect plus TLS handshake
(324 bytes up per stream in the relay log); no listing is fetched. So
S6 is dormant inside the machine; nothing here exercises it. The F29 footer
is unchanged and was seen verbatim on both tiers:

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)

Three things are recorded rather than smoothed over. The networked
build landed on the LARGER known networked size, raw equal to P14's to
the byte, so its asset is about 1.5 MB larger gzipped than P15's; the
offline build landed on P15's raw size to the byte. Both are known
sizes and both are reported, not stopped on. The networked PDF read
took 5.5 s against 5.3 s on v0.38.5, and both worse-tier memory floors
fell (by 32 kB and 100 kB), enough to move the rounded figures from
50.1 to 50.0 MB and from 76.3 to 76.2 MB; page/app.js's measurement
comment was rewritten to say so. The sweep's only nonzero pattern is
R4 on binary and kernel content, under the standing P9 ruling. This
commit is not a decision to publish.

## The build input

    file    temur-v0.38.6-i686-unknown-linux-musl
    sha256  6edbeeb3de0f9312c84bf127a3d1564807641513885d969ce37498a0ab9102ff
    size    8,365,108 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-10-19; the i686 asset arrived in 1.10 s at HTTP
200 with the full byte count on the first fetch. The hash is checked
FIVE ways before the binary is used:

    computed from the downloaded file   6edbeeb3...02ff
    the published SHA256SUMS line       6edbeeb3...02ff
    the value planning supplied         6edbeeb3...02ff
    sha256sum -c in artifacts/          temur-v0.38.6-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.38.6`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.38.5,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.5  temur 0.38.6

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 37d9e7e47ed588342bc25ec5a9f74a75635ba1bcab0edcb676264a3393872e57,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim. Its i686 line:

    6edbeeb3de0f9312c84bf127a3d1564807641513885d969ce37498a0ab9102ff  temur-v0.38.6-i686-unknown-linux-musl

v0.38.5 was 8,364,852 bytes, so the binary GREW by 256 bytes. The
download arrived mode 644 and was set to 755; git records the rename
with no mode change.

## What did NOT change

                           this build (P16)   P15 record
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

All five hash identically to the values in reports/v0385-refresh.md,
so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the proofs, the page checks and the three
probes.

The two step files the generators write, build/steps-p16-net-snap.json
and build/steps-p16-offline-snap.json, are byte-identical to P15's
committed steps-p15-* files: the renamed generators changed their
header and output path only.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other and to P15's captures.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P15. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
equal to P15's committed report, and landingcheck reports cleanLanding
true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. A plain `temur`
    start on each restored snapshot printed no archive notice: the
    offline tier opened a new session ("# new session", header naming
    temur 0.38.6) and the networked tier printed no archive notice
    either. The files named *temur* outside /proc and /sys are
    /etc/temur-motd and /usr/bin/temur on the networked tier, and
    those two plus /root/.config/temur, the offline tier's shipped
    config, on the offline tier: the overlay's own files and no
    session or state file.
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
    "0.38.4" sits three times inside the v0.38.6 binary, every time in
    the rustix-0.38.44 dependency path, as at P15.

                                    0.38.1  0.38.2  0.38.3  0.38.4  0.38.5  0.38.44  0.38.6
                                    pl an   pl an   pl an   pl an   pl an            an (control)
        build/state-p16-net.bin      0  0    0  0    0  0    3  0    0  0      3      1
        build/state-p16-offline.bin  0  0    0  0    0  0    3  0    0  0      3      1
        (the v0.38.6 binary itself   0  0    0  0    0  0    3  0    0  0      3      1)

    Every anchored count for 0.38.1 through 0.38.5 is 0, the plain
    "0.38.5" is 0 ("0.38.55" is 0 too), and the plain "0.38.4" count
    equals the "0.38.44" count in each image (3 = 3), so no old binary
    or old file is inside the machine. The anchored control, 0.38.6, is
    1 in each image and 1 in the binary: the one copy of /usr/bin/temur
    accounts for every occurrence. These are the figures planning
    measured on the published asset.

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p16-net.bin      39,375,580 B   17,636,908 B   16.82 MiB
    state-p16-offline.bin  38,986,460 B   17,341,580 B   16.54 MiB

    (p15, for comparison: 37,978,848 / 16,112,446 B = 15.37 MiB net,
                          38,986,460 / 17,346,706 B = 16.54 MiB offline)

    sha256  state-p16-net.bin.gz      ce6b238ee5a756b75ea1ad1aeda1e84cbb0fb91d615ef8cdeef431f8138c00f1
    sha256  state-p16-offline.bin.gz  54174a605744ac8705979599e1e57f437855ec16815e4c66afc4f0fb98739d9e

Both are inside the limit with more than 8 MiB to spare. Each staged
.gz, gunzipped, is byte-identical (cmp) to the build/state-p16-*.bin
every proof ran against.

P10 and P11 established that a build lands on one of two sizes about
1.3 to 1.4 MB apart raw from identical inputs (reports/v0381-refresh.md
"Sizes"). This time both tiers landed on a known size:

- networked, raw 39,375,580 B: the LARGER known networked size, equal
  to the byte to P14's 39,375,580 and 24,576 B larger than P11's
  39,351,004; it is 1,396,732 B larger than P15's 37,978,848 and
  1,355,776 B larger than P13's 38,019,804. Gzipped it is 4,200 B
  smaller than P14's, 6,335 B larger than P11's and 1,524,462 B larger
  than P15's.
- offline, raw 38,986,460 B: the LARGER known offline size, equal to
  the byte to P15's. It is 1,654,788 B larger than P14's 37,331,672,
  1,347,584 B larger than P13's 37,638,876 and 1,335,296 B larger than
  P11's 37,651,164. Gzipped it is 5,126 B smaller than P15's.

The binary grew by 256 bytes, so it is not the cause of the networked
move. Both tiers sit on known sizes, so neither is outside the known
figures; they are reported because the kickoff asks where each tier
landed. As ruled at P11, this stays a seed: one build per tier, the one
every proof and page check above ran against, no extra measuring build
and no bisect.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p16-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p16-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p16-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p16-offline.bin (38986460 bytes)
    state saved: build/state-p16-net.bin (39375580 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using the one joined expression from P10:

       state-p16-net.bin.gz       0 hits
       state-p16-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, read
from a per-file listing that labels each line with its tier; the same
sizes as P15). It holds the build steps' own commands and no key;
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

NO KEY MATERIAL AND NO CLIENT ADDRESSES IN THE LOGS: the relay log, the
page server log and all five page reports scan to 0 key-shaped hits,
each with a planted control that fired. The relay log's 32 ip fields
are all 8-hex hashes (16 ws_open and 16 ws_close events; this time the
log ends with live 0, every session closed). The dotted quads it does
carry are its own bind address, its documentation-range address map,
and the four "asked" fields of the streams that were opened, all
naming the one mapped destination 192.0.2.1:443. By their timestamps
(the log does not tag them): ids 1 and 2 at 11:46:57 and 11:47:15Z
are the two networked builds' doctor probes (red and green); id 3 at
11:49:56Z, closed in the same second as the five refusals, is the
allowlist probe's on-list control; and id 9 at 11:54:37Z falls in the
page netcheck's window.
Its plain-text refusal lines number FIVE, counted by refused
destination, one per refused destination of the allowlist probe (the
unmapped address, the bare public IP, the provider by name, port 80,
loopback); the by-name case is refused and logged on the same path as
the others. The 32 is a count of this run's sessions and is not
compared with earlier runs.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs, and the served block is byte-identical to 1a5b413's: the
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

    PASS  the snapshot's temur is v0.38.6  temur 0.38.6
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured, and the F29 footer

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.38.6` on both.

                            v0.38.5 (p15)    v0.38.6 (p16)
    big.pdf   offline           5.5 s            5.5 s
    big.pdf   networked         5.3 s            5.5 s
    big.pdf   lowest MemAvailable, worse tier
                                50.1 MB          50.0 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.3 MB          76.2 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,220 kB = 50.0 and 78,012 kB = 76.2, both on the
networked tier; P15's were 51,252 and 78,112 kB. The PDF times are
5,504 ms offline and 5,511 ms networked.)

The networked PDF time and both floors moved, so page/app.js's
measurement comment was rewritten to what was measured: v0.38.6
named, "5.5 s offline, 5.5 s networked", "50.0 MB", "never left
76.2 MB", and v0.38.5's readings kept for comparison in place of
v0.38.4's (5.5 s offline, 5.3 s networked, 50.1 MB). The 50.0 MB floor
is 1,432 kB above v0.35.0's 49,788 kB, so the comment's "about 1.4 MB
roomier than the same read on v0.35.0" still holds. Documents
unchanged: big.pdf 15.51 MiB / 1098 pages, big.xlsx 15.56 MiB /
148,801 rows. The 16 MiB and 64 MiB caps are unchanged.

THE F29 FOOTER, UNCHANGED. The guest config says context_window 8192,
so v0.38.6's `read` stops at the registry's cap for that window. The
tool result the big-file proof read back from temur's request body for
big.pdf is 7,591 bytes on both tiers (7,591 at P15), and it ends, on
both tiers, verbatim:

    54: 

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)
    </content>

which is the text P15 recorded. Its first lines are the document's
own, and line 3 is the marker:

    1: 
    2: 
    3: BIG-PDF-PAGE-ONE-MARKER

so the marker check passes. The committed proof prints only the first
900 bytes of a tool result, so the footer was read by an out-of-tree
copy of the proof (deviation 2). The spreadsheet's tool result is
unchanged at 68 bytes, temur's own refusal sentence, with no footer.

S6 IS DORMANT HERE: no guest runs `temur doctor` against a model
listing. The one doctor run, in the networked build's probe step, has
no key and stops at the TCP and TLS handshake, so the changed
comparison is never reached inside the machine.

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
                  readyMs 2027
    netcheck      networked, wireBytes 17,636,908, stateBytes 39,375,580,
                  readyMs 2004, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake) #", the trailing " #"
                  as the log and the JSON carry it
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 17,341,580, stateBytes
                  38,986,460, readyMs 1019, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p16 pair.

## The stamp names v0.38.6

The footer stamp reads, from the served page:

    temur v0.38.6 (release, sha256 6edbeeb3de0f9312c84bf127a3d1564807641513885d969ce37498a0ab9102ff)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.6, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code` is in the page the local
server served. The app.js the local server served is byte-identical to
page/app.js in this commit.

    CONTROL at 1a5b413:  old sha 1 hit, new sha 0 hits   (page/app.js)
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
    5  full history (all refs, blobs, commit     0         0        25
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 15 hits in 10 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits), the five committed kit/kernel*.config files (1 each; the
  five "text" hits), and the new p16 offline .gz as committed bytes
  (1). The new p16 networked .gz has no hit as committed bytes.
- surface 4, 28 hits: 14 in each decompressed p16 image.
- surface 5, 25 hits in 18 blobs: the same nine kit blobs (14 hits),
  the committed state-p8 (3), state-p9 (1) and state-p10 (1) offline
  .gz blobs, the two p13 .gz blobs (1 each), the p14 net .gz blob (1),
  the two p15 .gz blobs now leaving the tree and still in history (1
  each), and the new p16 offline .gz blob (1). Surface 5 is the full
  history over all refs plus this commit's staged tree and message, so
  it counts the committed state.

Against P15 (surface 3 16, surface 5 24): the p15 pair leaves the tree
(-2 on surface 3, since both its .gz hit as committed bytes) and stays
in history, and of the new pair only the offline .gz hits as committed
bytes (+1 on both surfaces). The authored surfaces, 1 and 2, are zero
for all twelve patterns, and no authored text file in the tree has a
hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 37 / 42 / 192 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0386-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P15 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at
1a5b413 (U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this
is captured output, not prose written here. No prose this pass wrote
has a hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.6-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.6/temur-v0.38.6-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.6/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.6-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.6-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p16-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p16-offline-snap.json 128 \
        build/state-p16-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p16-offline-snap.json 128 build/state-p16-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p16-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p16-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p16-net.bin

    # the version strings inside each raw image, anchored and plain
    grep -a -o -P '0\.38\.5(?!\d)' build/state-p16-net.bin | wc -l   # 0
    grep -a -o -F '0.38.4' build/state-p16-net.bin | wc -l           # = the 0.38.44 count

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p16-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p16-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p16-offline.bin offline
    # ... and the same three with state-p16-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p16-*.bin.gz

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
1a5b413 in this commit.

## Deviations from the kickoff

1. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10 to P15: each
   restored snapshot was listed for temur state and started once with a
   plain `temur`. It is not committed. It tests its own two regexes
   against a planted string.
2. A SECOND OUT-OF-TREE PROBE read the F29 footer, as the kickoff
   directs. A copy of tools/proof-bigfile-read.mjs, outside the
   repository, differing in two added lines that print the last 400
   bytes of each tool result and in its JSON output path (the work
   directory, not build/), was run once per tier against the same two
   snapshots after the committed proof had run. It was copied from the
   committed proof after the version pin moved, so its own version
   assert also read `temur 0.38.6`. It reported GATE PASS on both tiers
   with the same 7,591-byte and 68-byte tool results. The committed
   build/*.json are from the committed proof's run, and the committed
   proof is not changed by it. Per the ruling on P14's open question,
   its timings stay out of the table and the comment; they are
   disclosed here: big.pdf read in 6.3 s offline and 7.0 s networked,
   lowest MemAvailable 51,280 kB offline and 51,256 kB networked;
   big.xlsx 0.5 s on both tiers, lowest MemAvailable 78,172 kB offline
   and 78,132 kB networked.
3. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P15.
4. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 to P15; no whole-DOM count was taken. The
   wrap rule was read from the index the local server served (1 hit,
   where the rule lives; the "0" beside it in step7-dom-readings.log is
   a count over /style.css, which the local server answers with 404,
   since no such file is tracked).
5. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here.
6. The page harness launches Windows Edge, and tools/page-run.sh puts
   that run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design, used at P9 to P15; the profile holds nothing from
   this job but a browser session against localhost. The logs this job
   kept replace the profile path with a placeholder, and the five
   profiles this job's runs created were removed by name afterwards
   (see correction 2). 53 older pagerun-* profiles from earlier runs
   remain in that directory; they are not this job's and were left
   alone.
7. Git pairs the asset renames WITHIN each tier this time
   (state-p15-net -> state-p16-net, state-p15-offline ->
   state-p16-offline), as at P13 and P14; P15 and P11 paired them
   across the tiers. The sha256s above are of the named files either
   way.
8. Every pin the kickoff listed was moved; no tracked reference outside
   the list named the version or the pair. The lines that still name
   an earlier version after the move are the intended history and
   comparison lines: artifacts/PROVENANCE.md 12, 13, 14 and 16,
   page/app.js 72 (the p15 pair it replaces), 872 and 874, and
   tools/stage-page.sh 68 (the superseded p15 files). Not on the pin
   list and left as it was: artifacts/PROVENANCE.md 44 still calls the
   in-machine version check the "fourth" check, where this report
   counts it as the sixth (P14 and P15 left the same line).
9. build/steps-p16-net-snap.json and build/steps-p16-offline-snap.json
   are added as new files, byte-identical to the p15 step files, as
   each earlier refresh added its own; the kickoff names them (P15
   deviation 9).
10. The step 3 "before" grep (step3-pins-before.log) ran before the
   download (in the same command as the step 1 checks, whose log
   carries the time) and adds the escaped-regex form to the kickoff's
   pattern, so it shows the proofs' regex lines as well. It does not
   show PROVENANCE.md 46 ("See reports/v0385-refresh.md" matches
   neither form); that line was moved from the kickoff's list. The
   "after" grep (step3-pins-after.log) used a wider pattern than the
   "before" one (it adds "p15" and "v0385"), which is why
   PROVENANCE.md 13 and the kit/bzImage binary match appear only in
   it.
   build/page-report-textcheck.json is unchanged by the rerun; it
   carries no timing or size fields.

## Corrections

1. The first extraction of the file-cap figures read each per-document
   entry under "reads" for a top-level key named "minAvailableKb". The
   WRONG ASSUMPTION was that the memory floor sits at the top level of
   a read; it is nested under "memPeakDuringRead". The script failed
   outright with a KeyError rather than printing a wrong number (the
   traceback was seen in the session and not kept in a log), was
   corrected, and every figure in the table above comes from the
   corrected run (step5-filecap-numbers.log in the work directory).
   P15's correction 1 ("reads", not "results") was applied and held.
2. The first cleanup of the browser profiles looked in the wrong
   Windows temp directory. The WRONG ASSUMPTION was that the first
   match of a glob over the Windows user directories is the harness's
   temp directory; it was another account's, so every profile read
   "absent" and nothing was removed (profile-cleanup-wrongdir.log). The
   cleanup was re-run against the path the harness itself asks Windows
   for (GetTempPath, as tools/page-run.sh does) and removed all five
   (profile-cleanup.log).
3. The first relay-log field count missed the address map, because the
   walk tested JSON values for dotted quads but not keys, and the
   address map carries its addresses as keys. The WRONG ASSUMPTION was
   that every dotted quad in the log sits in a value. The count was
   re-run with keys included (step8-relaylog.log), which is the one
   the item 10 text above uses; step8-items.log keeps the first count.

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below. Its line numbers refer to the draft, not to this file.

WHAT WAS DONE ABOUT IT. Blocking 1 and 2 are done: item (a) now names
the files the session-state probe listed on each tier, and deviation
10 is corrected and says the two pin greps used different patterns.
Blocking 3 is done: the sweep and the register check were re-run on
this final text and the final commit message (step9-sweep-final.log,
step9-sweep-nocase-final.log, step9-register-final.log), and the
numbers above are from that run. Non-blocking 1, 2, 3 and 5 are done:
the S6 sentences say doctor runs once, keyless, and stops at the
handshake; the relay stream attributions are labelled as inferred
from timestamps, and the four "asked" fields are named as one
destination; deviation 4 says the style.css 0 is a count over a 404;
the netcheck quote keeps its trailing " #". Non-blocking 4 and 6 are
left as disclosed: the cmp targets are the cut's staged files named
in the kickoff, the report deletion and real time are the harness's
own design (tools/page-run.sh), the v0.38.5 binary's removal shows as
the rename, and correction 1's traceback was not kept. Q2 gap 4: the
pins-before grep ran in the same command as the step 1 checks, whose
log carries the time 07:45:36, before the 07:45:48 download start.

VERBATIM:

    # Independent check, P16 staged diff (temur-playground vs 1a5b413)

    Environment: `env | grep -c ANTHROPIC_API_KEY` = 0. I opened neither pattern file and nothing under the release config directory. I worked read-only.

    Measurements I made myself:
    - **Bundle identity.** staged.diff is byte-identical to `git diff --cached -M 1a5b413`, and the staged reports/v0386-refresh.md is byte-identical to draft-report.md. HEAD is 1a5b413bd934..., and the relay/ tip at the base is 9c9eb67.
    - **Index blobs:**
      - state-p16-net.bin.gz: sha256 ce6b238e...00f1, 17,636,908 B
      - state-p16-offline.bin.gz: sha256 54174a60...9d9e, 17,341,580 B
      - temur-v0.38.6-i686-unknown-linux-musl: sha256 6edbeeb3...02ff, 8,365,108 B, mode 100755 on both sides of the rename
      - SHA256SUMS: sha256 37d9e7e4...2e57, 428 B
      - Working-tree .gz files cmp-equal to the index blobs.
    - **gunzip | cmp.** Both .gz files are identical to build/state-p16-{net,offline}.bin, which are 39,375,580 B and 38,986,460 B.
    - **cmp against the cut's staged files.** The binary and SHA256SUMS are both identical to /home/dev/dist/release/v0.38.6/.
    - **Five unchanged inputs.** kit/bzImage-p6, kit/rootfs.cpio.gz, motd, console.sh and S30files all re-hash to the five values at reports/v0385-refresh.md:91-95.
    - **Version strings.** Counts are the same in both raw images and in the binary:
      - 0.38.1 / 0.38.2 / 0.38.3: plain 0, anchored 0
      - 0.38.4: plain 3, anchored 0; "0.38.44" is 3
      - 0.38.5: plain 0, anchored 0; "0.38.55" is 0
      - 0.38.6: anchored 1 (the control)
    - **Steps files.** build/steps-p16-{net,offline}-snap.json are byte-identical to steps-p15-* at 1a5b413.
    - **Unchanged paths.** page/index.html, relay/, kit/, tools/guest/ and build/page-report-textcheck.json have no diff against 1a5b413.
    - **Landings.** logs/landing-{net,offline}.txt both cmp-equal to tools/guest/motd.
    - **Remaining pins.** I ran the kickoff's grep on the index, excluding reports/, build/, page/assets/ and vendor/. Hits left: PROVENANCE.md 12, 14, 16; app.js 72, 872, 874; stage-page.sh 68; plus the binary itself. All of them are intended history or comparison lines.
    - **ASCII.** draft-report.md and draft-commit-msg.txt have 0 non-ASCII lines (control: a planted U+2014 gives 1).

    ## Q1. Does the diff do what the kickoff says and nothing else?

    Yes. I walked the step 3 pin list item by item:

    - **.gitignore:23-24:** both negation lines now read state-p16-*. OK.
    - **THIRD_PARTY.md:64-65:** both served-asset names moved. OK.
    - **artifacts/PROVENANCE.md:**
      - 6-8: file, sha and size 8365108. OK.
      - 11-14: "replaces" now names v0.38.5, 39d3f157... and 8364852, citing reports/v0385-refresh.md. OK.
      - 14-17: the never-served sentences are kept, and no new one was added. OK.
      - 21: download date 2026-10-19. OK.
      - 24, 29: both URLs. OK.
      - 34: the sha256sum -c line. OK.
      - 38: the published line. OK.
      - 46: now points at v0386-refresh.md. OK.
      - 44 still says "fourth"; it was not on the list, is disclosed in deviation 8, and matches the P14/P15 precedent.
    - **page/app.js:60-61:** TEMUR_VERSION "v0.38.6" and TEMUR_SHA256 6edbeeb3...02ff moved together. OK.
    - **page/app.js:64-75:** "THE P16 PAIR"; line 72 now reads "The p15 pair"; SNAP_ONLINE and SNAP_OFFLINE now point at state-p16-*. OK.
    - **page/app.js:843-885:** four comment lines changed.
      - 853 now says v0.38.6.
      - 858 says "5.5 s offline, 5.5 s networked".
      - 860 says 50.0 MB; 862 says 76.2 MB.
      - 871-874 keep the shape "on v0.38.6, against 50.1 MB on v0.38.5 ... against 5.5 s offline and 5.3 s networked on v0.38.5".
      - The caps did not move. The figures match the committed JSON (see Q3).
    - **tools/stage-page.sh:13, 67-68, 71-87:** the staged pair, the P16/v0.38.6 sentence, "superseded p15 files" and the regenerate hint all moved. OK.
    - **tools/gen-steps-p15-* renamed to gen-steps-p16-*:** each changes only line 1 and the output path (137 / 70). Similarity 97% and 96%. OK.
    - **tools/proof-office-read.mjs:1, 137, 138 and tools/proof-bigfile-read.mjs:270, 271:** the label and the escaped regex both moved to 0\.38\.6. The pre-swap FAIL is recorded in step5-office-preswap.log. OK.
    - **page/assets:** the p15 pair is removed and the p16 pair added. Git pairs the renames within each tier (net to net, offline to offline), as deviation 7 says. OK.
    - **Other files:**
      - build/*.json: eight proof and page reports regenerated; textcheck is unchanged. Two new steps-p16 files added. All are named in the kickoff.
      - artifacts/SHA256SUMS: the v0.38.6 file verbatim (step 2).
      - Binary rename: no mode change (step 2).
      - reports/v0386-refresh.md: the step 11 report.

    Nothing is in the diff that the kickoff does not name. The rename to the v0.38.6 binary shows only as a 100755-to-100755 rename, which is consistent with the v0.38.5 file having been removed by name.

    ## Q2. Do the logs contain every line the kickoff requires?

    Nearly all of them:
    - step1: env 0, HEAD == origin/main == 1a5b413, porcelain 0, relay 9c9eb67, node, node_modules, sample.* 0.
    - step0: the five hashes.
    - step2: HTTP 200, bytes, time 1.099144 s; the five checks; mode 755; file type.
    - step3: pins before and after.
    - step4: red EXIT=3 with "no state file written" and green PASSED/saved on both tiers; landing bytes 486 and equality to motd and to P15; watches (a) to (c) with controls; session-state probes with controls; (d) per tier plus the binary; steps cmp.
    - step5: 9p on both tiers; mkdocs; the pre-swap FAIL; office on both tiers; big-file on both tiers; the out-of-tree tail on both tiers, with its 2-line diff; filecap numbers; the three probes.
    - step6: stage, ls -l, sha256s, 25 MiB check, size compare against P15/P14/P13/P11, gz vs build.
    - step7: the five page runs, DOM readings with the 1a5b413 control, relay stopped (0 listeners), profile list and cleanup.
    - step8: items 9 to 11 with controls, the per-tier .ash_history listing, five refusals labelled by destination, apex 302.
    - step9: sweep (case-sensitive and case-insensitive) with 12 of 12 controls firing, R4 blob paths, register with per-surface controls.

    Gaps, none of them blocking:
    1. step2-verify.log prints `cmp_exit=0` and `cmp_sums_exit=0` without naming the cmp target path. I confirmed the comparison myself.
    2. No log line shows that each page-report JSON was deleted before its run, or that real time was used rather than --virtual-time-budget. tools/page-run.sh:40 (`rm -f "$REPORT"`) and its header comment support the report's statement, but that is source, not a run log.
    3. No log line records removing artifacts/temur-v0.38.5-... by explicit name. Only the diff (the rename) shows the outcome.
    4. step3-pins-before.log has no timestamp, so deviation 10's "ran before the download" cannot be checked.
    5. **The sweep and register runs are over the DRAFT report, which still has CHECK_PLACEHOLDER in it.** Pasting this answer in changes reports/v0386-refresh.md and the added lines. Both scans must be re-run on the final staged content before the commit, and the report should cite those logs.

    ## Q3. Does every number and quoted string appear in a primary?

    The arithmetic all checks:

    | Comparison | Result |
    |---|---|
    | Net raw vs P15, P11, P13 | +1,396,732 / +24,576 / +1,355,776 |
    | Net gz vs P14, P11, P15 | -4,200 / +6,335 / +1,524,462 |
    | Offline raw vs P14, P13, P11 | +1,654,788 / +1,347,584 / +1,335,296 |
    | Offline gz vs P15 | -5,126 |
    | MiB, net / offline | 16.82 / 16.54; more than 8 MiB spare (8.18) |
    | Floors in kB / 1024 | 51,220 = 50.0; 78,012 = 76.2; P15's 51,252 = 50.1 and 78,112 = 76.3 |
    | Floor deltas | 32 kB and 100 kB |
    | Floor vs v0.35.0 (49,788 kB) | 51,220 - 49,788 = 1,432 kB, about 1.4 MB |
    | PDF times | 5,504 ms = 5.5 s; 5,511 ms = 5.5 s |
    | Out-of-tree timings | 6,273 = 6.3 s; 7,014 = 7.0 s; 51,280 / 51,256 / 78,172 / 78,132 kB |
    | Sweep, surface 3 | 2+2+3+2+5+1 = 15 in 10 files |
    | Sweep, surface 5 | 14+3+1+1+2+1+2+1 = 25 in 18 blobs |
    | Sweep, vs P15 | 16 - 2 + 1 = 15 and 24 + 1 = 25 |

    The prior-run figures (P11, P13 and P14 sizes; 49,788; 51,252 / 78,112; 7,591; 486; 556 / 1,569) all appear in reports/v0385-refresh.md at 1a5b413.

    These items are wrong, unsupported, or framed beyond their primary:

    1. **Draft L138-139 is wrong.** It says "The only file named *temur* outside /proc and /sys is /usr/bin/temur, on both tiers." step4-session-state-net.log lists /etc/temur-motd and /usr/bin/temur. step4-session-state-offline.log lists /etc/temur-motd, /root/.config/temur and /usr/bin/temur. Both are expected (the overlay's motd and the offline tier's shipped config), but the sentence as written is false.
    2. **Draft L650-652 (deviation 10) is partly wrong.** It says the before-grep "shows the proofs' regex lines and PROVENANCE.md 46 as well". step3-pins-before.log does show the regex lines (proof-bigfile-read.mjs:271, proof-office-read.mjs:138). It has no PROVENANCE.md:46 line: at 1a5b413 that line read "See reports/v0385-refresh.md", which the pattern does not match. Separately, PROVENANCE.md:13 appears in the after-log and not the before-log, so the two greps used different patterns. That is not disclosed.
    3. **Draft L617-618 (deviation 4) is framed beyond its primary.** "the served style.css has 0": serve.log shows `404 /style.css`, and no page/style.css is tracked. The 0 is a count over a 404, not over a served stylesheet. It inherits P15's wording.
    4. **Draft L21-26 (the S6 sentence) and L383-385 leave out a fact in the logs.** The networked build does run `temur doctor` inside the guest. step4-net-green.log STEP_1 uses a throwaway Anthropic config through the relay, and the report itself calls relay streams 1 and 2 "doctor probes" (L280). It reaches only "reachable ... (TCP connect + TLS handshake)" with no key; bytes_up is 324 per stream. The dormant conclusion holds, because no listing is fetched. But "nothing in the guests runs doctor against a model listing" rests on doctor stopping at the handshake, and the report should say that rather than imply doctor never runs.
    5. **Draft L279-281 is inferred, not logged.** The relay log does not tag "ids 1 and 2 ... red and green", "id 3 the allowlist probe's on-list control" or "id 9 the page netcheck". They follow from timestamps (11:46:57, 11:47:15, 11:49:56 just before the refusals, 11:54:37 inside the netcheck window). They are plausible but should be labelled as inferred from timing. Also, "four 'asked' destinations" are four asked fields that all name one destination, 192.0.2.1:443.
    6. **Draft L403-404 trims the quote.** The quoted netcheck line drops the trailing " #" that appears in the log and the JSON. This is cosmetic.
    7. **Draft L663-664 (correction 1) cites no primary.** The KeyError traceback "was seen in the session and not kept in a log". This is disclosed, so it is acceptable.
    8. **Commit message, "The regenerated proof and page reports in build/":** build/page-report-textcheck.json was re-run but not changed, so it is not in the diff. Deviation 10 covers this in the report; the commit message does not need to change.

    Everything else in the draft report and commit message traces to a primary, including every sha, byte count, quoted PASS/FAIL line, footer text, stamp text, apex lines and register counts.

    ## Overall verdict

    The diff does what the kickoff asks and nothing more; I re-measured every hash, size and version count and they agree. The logs cover the required lines with minor gaps. The draft has two false statements and a few framing issues, all text-only fixes.

    **Blocking** (fix before the commit; text only, no rebuild):
    - B1. Draft L138-139: the "only file named *temur*" sentence is false against the session-state logs. Correct it to the three or two paths actually listed.
    - B2. Draft L650-652: deviation 10 says the before-log shows PROVENANCE.md 46; it does not. Correct it, and say the before and after greps used different patterns.
    - B3. After pasting this answer and making B1 and B2, re-run the pre-publish sweep (both pattern files, all surfaces, with controls) and the register check on the final staged report, added lines and commit message. Cite those logs instead of the -draft ones.

    **Non-blocking:**
    - N1. The S6 dormant sentence should say that doctor does run at build time (and in netcheck) but stops at the TCP/TLS handshake with no key and no listing (L21-26, L383-385).
    - N2. Relay stream-id attributions are inferred from timestamps; label them as such (L279-281).
    - N3. "served style.css has 0" is a 404, not a served file (L617-618).
    - N4. step2-verify.log does not name the cmp target. There are no run-log lines for deleting reports before each page run or for using real time (tools/page-run.sh:40 supports both). No log line shows removing the v0.38.5 binary by name.
    - N5. The netcheck quote drops the trailing " #" (L403-404).
    - N6. Correction 1's traceback has no kept primary (disclosed).

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
