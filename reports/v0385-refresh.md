# P15: the served snapshots move to temur v0.38.5

## Verdict

Both served snapshots are rebuilt on the released v0.38.5 i686-musl
binary. The kernel, the base rootfs and the three guest overlay files
are hash-identical to the P14 record, and the relay is untouched (its
tip is still 9c9eb67 and relay/ has no diff): only /usr/bin/temur
moved. state-p14-* becomes state-p15-*, and every live reference moves
in the same commit. Nothing was released between v0.38.4 and v0.38.5.

The pristine assert was proved red and green on BOTH tiers. All proofs
pass on both tiers with their controls. Both landings are
byte-identical to tools/guest/motd and to the text P14 captured. None
of the notices watched for appears. Counted with a digit lookahead, no
older version string is inside either raw image while the new one is.
The page harness reads back the exact byte counts of the two NEW
assets, which is what shows the p15 pair is served rather than a
cached p14 one.

v0.38.5 carries F30, which makes a line the tool registry alters (a
line carrying the session key, shown as [redacted]) count as not
shown. The guests hold no key and the proofs run with none, so the
registry has nothing to redact and F30 is dormant inside the machine;
nothing here exercises it. The F29 footer is unchanged and was seen
verbatim on both tiers:

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)

Three things are recorded rather than smoothed over. The two tiers
swapped sizes against P14: the networked build landed on the SMALLER
known networked size (40,956 B raw below P13's, 32,764 B below P10's),
so its asset is about 1.5 MB smaller gzipped than P14's; the offline
build landed on the LARGER known offline size (12,288 B raw above
P10's), about 1.7 MB larger gzipped than P14's. Both are known sizes
and both are reported, not stopped on. The PDF read on the offline
tier took 5.5 s against 5.0 s on v0.38.4, and both memory floors rose
by tens of kB (40 kB and 72 kB), enough to move the rounded figures
from 50.0 to 50.1 MB and from 76.2 to 76.3 MB; page/app.js's
measurement comment was rewritten to say so. The sweep's only nonzero
pattern is R4 on binary and kernel content, under the standing P9
ruling. This commit is not a decision to publish.

## The build input

    file    temur-v0.38.5-i686-unknown-linux-musl
    sha256  39d3f1572e132f60469ab6fdeef36883236a1a5e125cc410449da9fb35945bd3
    size    8,364,852 bytes
    type    ELF 32-bit LSB executable, Intel 80386, version 1 (GNU/Linux), statically linked, stripped

Downloaded tokenless (`env -i curl`, no `gh`, no token) from the public
release URL on 2026-10-12; the i686 asset arrived in 0.88 s at HTTP
200 with the full byte count on the first fetch. The hash is checked
FIVE ways before the binary is used:

    computed from the downloaded file   39d3f157...45bd3
    the published SHA256SUMS line       39d3f157...45bd3
    the value planning supplied         39d3f157...45bd3
    sha256sum -c in artifacts/          temur-v0.38.5-i686-unknown-linux-musl: OK
    cmp against the cut's staged file   identical (cmp exit 0)

and a sixth time from inside the machine: the office-read and
big-file proofs ask the restored snapshot's own temur for its version,
on both tiers, and got `temur 0.38.5`. That check FAILED first on the
offline tier, run once while the proof was still pinned to 0.38.4,
which is the most direct evidence the swap took:

    FAIL  the snapshot's temur is v0.38.4  temur 0.38.5

The published SHA256SUMS is 4 lines, 428 bytes,
sha256 cce8c3306b4433bc09318073e6dfd7b8d3564d0da7307ccb5575a117b83cc634,
cmp-identical to the cut's staged copy, and artifacts/SHA256SUMS is that
file verbatim. Its i686 line:

    39d3f1572e132f60469ab6fdeef36883236a1a5e125cc410449da9fb35945bd3  temur-v0.38.5-i686-unknown-linux-musl

v0.38.4 was 8,353,332 bytes, so the binary GREW by 11,520 bytes. The
download arrived mode 644 and was set to 755; git records the rename
with no mode change.

## What did NOT change

                           this build (P15)   P14 record
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

All five hash identically to the values in reports/v0384-refresh.md,
so G1 holds by measurement. The motd is left as it was.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture, the proofs, the page checks and the three
probes.

The two step files the generators write, build/steps-p15-net-snap.json
and build/steps-p15-offline-snap.json, are byte-identical to P14's
committed steps-p14-* files: the renamed generators changed their
header and output path only.

## The landing text, and the watches

Both tiers land on the same text, and it is the overlay's motd. It was
checked as bytes: the text between the login line and the first prompt
is 486 bytes on each tier, equal to tools/guest/motd, and the two tiers'
captures are equal to each other and to P14's captures.

    temur in a browser. This is a throwaway Linux computer running inside
    your browser tab. Close the tab and it is gone, key included.

      temur init      set up a provider and enter your API key (input hidden)
      temur           start the agent
      temur doctor    check the config and the network

    You are in /files. Files you add from the page arrive here, and what
    temur writes here you can download from the page.

    Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

NEITHER TIER'S LANDING CHANGED FROM P14. The page's own frames agree:
selftest's frameAfterLaunch, frameAfterTyping and frameAfterExit are
equal to P14's committed report, and landingcheck reports cleanLanding
true and wizardAtFirstQuestion true.

(a) SESSION ARCHIVE NOTICE: not printed on either tier. Beyond the idle
    landing, each restored snapshot was asked directly. A plain `temur`
    start on each restored snapshot printed no archive notice: the
    offline tier opened a new session ("# new session", header naming
    temur 0.38.5) and the networked
    tier printed its no-config guidance, as designed.
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
    before gzip. This watch changed shape at P15. The plain substring
    "0.38.4" sits three times inside the v0.38.5 binary, every time in
    the dependency path `rustix-0.38.44/src/backend/linux_raw/...` that
    the compiler bakes in for panic locations, so each version is
    counted twice: plainly, and ANCHORED with a digit lookahead
    (`grep -a -o -P '0\.38\.N(?!\d)'`).

                                    0.38.1   0.38.2   0.38.3   0.38.4   0.38.44  0.38.5
                                    pl  an   pl  an   pl  an   pl  an            an (control)
        build/state-p15-net.bin      0   0    0   0    0   0    3   0      3      1
        build/state-p15-offline.bin  0   0    0   0    0   0    3   0      3      1
        (the v0.38.5 binary itself   0   0    0   0    0   0    3   0      3      1)

    Every anchored count for 0.38.1 through 0.38.4 is 0, and the plain
    "0.38.4" count equals the "0.38.44" count in each image (3 = 3), so
    no old binary or old file is inside the machine. The anchored
    control, 0.38.5, is 1 in each image and 1 in the binary: the one
    copy of /usr/bin/temur accounts for every occurrence. (P14's "0.38.4
    4 times" was these same three rustix strings plus the product's own
    version.)

## Sizes, against the 25 MiB Cloudflare Pages limit

                              raw            gzip -9        gzipped
    state-p15-net.bin      37,978,848 B   16,112,446 B   15.37 MiB
    state-p15-offline.bin  38,986,460 B   17,346,706 B   16.54 MiB

    (p14, for comparison: 39,375,580 / 17,641,108 B = 16.82 MiB net,
                          37,331,672 / 15,677,271 B = 14.95 MiB offline)

    sha256  state-p15-net.bin.gz      16fbcf1d0881c182becd68f84122c581b88b47546124492fbc12a64b6ff22f49
    sha256  state-p15-offline.bin.gz  29d496fa4ce02e350d15daa7da7cbe50ea042022986a89efe04b3c3e4d9cb9a1

Both are inside the limit with more than 8 MiB to spare. Each staged
.gz, gunzipped, is byte-identical (cmp) to the build/state-p15-*.bin
every proof ran against.

P10 and P11 established that a build lands on one of two sizes about
1.3 to 1.4 MB apart raw from identical inputs (reports/v0381-refresh.md
"Sizes"). This time both tiers landed on a known size, and each on the
other one from P14:

- networked, raw 37,978,848 B: the SMALLER known networked size. It is
  40,956 B smaller than P13's 38,019,804 and 32,764 B smaller than
  P10's 38,011,612; it is 1,396,732 B smaller than P14's 39,375,580
  and 1,372,156 B smaller than P11's 39,351,004. Gzipped it is
  1,528,662 B smaller than P14's and 6,549 B smaller than P13's.
- offline, raw 38,986,460 B: the LARGER known offline size. It is
  12,288 B larger than P10's 38,974,172 (and 49,148 B below the
  39,035,608 of P11's measuring rebuild); it is 1,654,788 B larger
  than P14's 37,331,672, 1,347,584 B larger than P13's 37,638,876 and
  1,335,296 B larger than P11's 37,651,164. Gzipped it is 1,669,435 B
  larger than P14's and 7,948 B larger than P10's.

The binary grew by 11,520 bytes, so it is not the cause of either
move. Both moves are between known sizes, so neither is outside the
known figures; they are reported because the kickoff asks where each
tier landed. As ruled at P11, this stays a seed: one build per tier,
the one every proof and page check above ran against, no extra
measuring build and no bisect.

## The pristine assert, red and green, on BOTH tiers

v86 serialises the 9p filesystem into the saved state, so deleted bytes
still ship to every visitor. The assert demands exactly ONE inode, the
root.

RED, deliberately provoked, on each tier in turn:

    PLANT_9P=visitor-notes.txt ... state-p15-offline.bin  -> EXIT=3
    PLANT_9P=leaked-note.txt   ... state-p15-net.bin      -> EXIT=3

    9p ASSERT FAILED at the snapshot point (build/state-p15-offline.bin):
    the share is NOT empty, so this state would ship its contents to
    every visitor. entries=1 top=["visitor-notes.txt"] inodes=2
    names=["visitor-notes.txt"]. No state file was written.

    no state file written (correct), on both tiers

GREEN, the runs that built the shipped states:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p15-offline.bin (38986460 bytes)
    state saved: build/state-p15-net.bin (37978848 bytes)

## Item 9: no key in any guest

1. FROM INSIDE THE GUEST, at the snapshot point: KEYLESS-SNAPSHOT-OK
   and SHARE-EMPTY-OK on both tiers, and on the networked tier also
   NO-SECRET-ENV-OK and PROBE-REMOVED. These are in-guest assertions
   with no separate control.
2. THE PRISTINE ASSERT above: inodes=1 means no file was ever created
   and deleted. Its red half proves it can fail.
3. A BYTE SCAN OF THE SHIPPED ASSETS, decompressed, for key-shaped
   material, using the one joined expression from P10:

       state-p15-net.bin.gz       0 hits
       state-p15-offline.bin.gz   0 hits
       LIVE CONTROL: the same scan over the same stream with one
       key-shaped string appended                            1 hit each

Observed, not changed: root's shell history is in both snapshots
(/root/.ash_history, 556 bytes offline, 1,569 bytes networked, read
from a per-file listing that labels each line with its tier; the same
sizes as P14). It holds the build steps' own commands and no key;
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
each with a planted control that fired. The relay log's 30 ip fields
are all 8-hex hashes; the dotted quads it does carry are its own bind
address, its documentation-range address map, and the four "asked"
destinations of streams that were opened (the two networked builds'
doctor probes, the allowlist probe's on-list control, and the page
netcheck). Its plain-text refusal lines number FIVE,
counted by refused destination, one per refused destination of the
allowlist probe (the unmapped address, the bare public IP, the
provider by name, port 80, loopback); the by-name case is refused and
logged on the same path as the others. The 30 is a count of
this log as kept: the relay was stopped before selftest with two
page sessions still open, so the log ends without their closes. It
is not compared with P13's or P14's counts, which depend on how many
sessions each run opened.

## Item 11: the page

THE KEY TRUST STORY IS STATED. The trust block still has its five
paragraphs, and the served block is byte-identical to d3dbaeaa's: the
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

    PASS  the snapshot's temur is v0.38.5  temur 0.38.5
    PASS  the two controls FAILED, so the read tool is not merely permissive  3 succeeded, 2 refused, of 5
    PASS  extracted text of /files/sample.pdf contains "Temur reads PDF files now."
    PASS  extracted text of /files/sample.docx contains "Word documents become plain text."
    PASS  extracted text of /files/sample.xlsx contains "== Sheet: sales =="

The two controls, a fake PDF and a binary blob, are refused with the
right sentences on both tiers.

## The file-cap gate, re-measured, and the F29 footer

GATE PASS on both tiers, and the big-file proof's own version assert
reads `temur 0.38.5` on both.

                            v0.38.4 (p14)    v0.38.5 (p15)
    big.pdf   offline           5.0 s            5.5 s
    big.pdf   networked         5.3 s            5.3 s
    big.pdf   lowest MemAvailable, worse tier
                                50.0 MB          50.1 MB
    big.xlsx  both tiers        REFUSED 0.5 s    REFUSED 0.5 s
    big.xlsx  lowest MemAvailable, worse tier
                                76.2 MB          76.3 MB

(The memory figures are the committed JSON's kB divided by 1024, as in
the comment: 51,252 kB = 50.1 and 78,112 kB = 76.3, both on the
networked tier; P14's were 51,212 and 78,040 kB. The PDF times are
5,523 ms offline and 5,262 ms networked.)

The offline PDF time and both floors moved, so page/app.js's
measurement comment was rewritten to what was measured: v0.38.5
named, "5.5 s offline, 5.3 s networked", "50.1 MB", "never left
76.3 MB", and v0.38.4's readings kept for comparison in place of
v0.38.3's (5.0 s offline, 5.3 s networked, 50.0 MB). The 50.1 MB
floor is 1,464 kB above v0.35.0's 49,788 kB, so the comment's "about
1.4 MB roomier than the same read on v0.35.0" still holds. Documents
unchanged: big.pdf 15.51 MiB / 1098 pages, big.xlsx 15.56 MiB /
148,801 rows. The 16 MiB and 64 MiB caps are unchanged.

THE F29 FOOTER, UNCHANGED. The guest config says context_window 8192,
so v0.38.5's `read` stops at the registry's cap for that window. The
tool result the big-file proof read back from temur's request body for
big.pdf is 7,591 bytes on both tiers (7,591 at P14), and it ends, on
both tiers, verbatim:

    54: 

    (Output capped at 7624 bytes for this model's context window. Showing lines 1-54. Use offset=55 to continue.)
    </content>

which is the text P14 recorded. Its first lines are the document's
own, and line 3 is the marker:

    1: 
    2: 
    3: BIG-PDF-PAGE-ONE-MARKER

so the marker check passes. The committed proof prints only the first
900 bytes of a tool result, so the footer was read by an out-of-tree
copy of the proof (deviation 2). The spreadsheet's tool result is
unchanged at 68 bytes, temur's own refusal sentence, with no footer.

F30 IS DORMANT HERE: the guests carry no key and the proofs run with
none, so the registry has nothing to redact and no line is altered
before the model sees it.

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
                  readyMs 2031
    netcheck      networked, wireBytes 16,112,446, stateBytes 37,978,848,
                  readyMs 2094, "PASS: reachable: https://api.anthropic.com
                  (TCP connect + TLS handshake)"
    filecheck     ok true; upload and download sha256 match both ways;
                  per-file refusal at 16.0 MB and total refusal at 64.0 MB
    textcheck     ok true, networked tier; 17 terms, 0 hits in markup and
                  0 in rendered text
    selftest      ok true, offline tier (relay stopped first, 0 listeners
                  on its port), wireBytes 17,346,706, stateBytes
                  38,986,460, readyMs 1002, echo 2 ms

netcheck and selftest report exactly the wire and state sizes of the two
NEW assets, which is the check that the page serves the p15 pair.

## The stamp names v0.38.5

The footer stamp reads, from the served page:

    temur v0.38.5 (release, sha256 39d3f1572e132f60469ab6fdeef36883236a1a5e125cc410449da9fb35945bd3)

with "release" linking to
https://github.com/thekeoni1/Temur/releases/tag/v0.38.5, which returns
200. The sha appears ONCE in the stamp text, is absent from index.html,
appears once in app.js as TEMUR_SHA256, and is written to one element
(app.js `sha.textContent = TEMUR_SHA256`). The trust block still has 5
paragraphs, and the wrap rule `#stamp code` is in the page the local
server served. The app.js the local server served is byte-identical to
page/app.js in this commit.

    CONTROL at d3dbaeaa:  old sha 1 hit, new sha 0 hits   (page/app.js)
    working tree:         old sha 0 hits, new sha 1 hit

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
    5  full history (all refs, blobs, commit     0         0        24
       messages, path names)
         of which text blobs, messages, paths    0         0         5

R4 IS RULED A FALSE POSITIVE on binary content (P9 standing ruling,
2026-09-18: it fires on bzImage, kernel configs, the temur binary and
the snapshot assets). Every R4 hit above is on that content. HITS and
BLOBS, kept apart:

- surface 3, 16 hits in 11 files: kit/bzImage, -p2, -p3, -p4 (2, 2, 3,
  2 hits), the five committed kit/kernel*.config files (1 each; the
  five "text" hits), and the two new p15 .gz assets as committed bytes
  (1 each).
- surface 4, 28 hits: 14 in each decompressed p15 image.
- surface 5, 24 hits in 17 blobs: the same nine kit blobs (14 hits),
  the committed state-p8 (3), state-p9 (1) and state-p10 (1) offline
  .gz blobs, the two p13 .gz blobs (1 each), the p14 net .gz blob now
  still in history (1), and the two new p15 .gz blobs (1 each). Surface 5 is
  the full history over all refs plus this commit's staged tree and
  message, so it counts the committed state.

Against P14 (surface 3 15, surface 5 22): the p14 pair leaves the tree
(-1 on surface 3, since only its networked .gz hit as committed bytes)
and stays in history, and both new .gz hit as committed bytes (+2 on
both surfaces). The authored surfaces, 1 and 2, are zero for all
twelve patterns, and no authored text file in the tree has a hit.

Scanned case-insensitively as a stricter variant, S1..S7 and R1, R2,
R3, R5 stay 0 on every surface; R4 rises to 43 / 41 / 174 on surfaces
3, 4 and 5 and stays 5 on the tracked text files, the same five kernel
configs.

## The register check

Four surfaces, with a live control. The target is pure ASCII, 0 U+2014
and 0 hits for the banned adjective as a whole word.

    surface                      adjective  U+2014  non-ASCII
                                            (lines)   (lines)
    reports/v0385-refresh.md         0         0        0
    artifacts/PROVENANCE.md          0         0        0
    the commit message               0         0        0
    the added lines of the diff      0         2        3

    LIVE CONTROL (planted string)    1         1        1

Each surface was also re-scanned with the planted line appended, and
every one of its three counts rose by one.

THE ADDED LINES ARE NOT CLEAN, for the reason P9 to P14 declared: all
three lines are regenerated build/*.json MACHINE CAPTURES.
build/proof-office-read-offline.json and -networked.json carry temur's
own usage footer inside a captured "turn" string, and
build/page-report-landingcheck.json carries the stamp's middle dot. The
same line in each of those files carried the same characters at
d3dbaeaa (U+2014 lines 1 / 1 / 0, non-ASCII lines 1 / 1 / 1), so this
is captured output, not prose written here. No prose this pass wrote
has a hit.

## Reproduce

    cd <the temur-playground checkout>
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"

    # the binary, tokenless, then verify before it is used
    env -i curl -fsSL -o artifacts/temur-v0.38.5-i686-unknown-linux-musl \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.5/temur-v0.38.5-i686-unknown-linux-musl
    env -i curl -fsSL -o artifacts/SHA256SUMS \
      https://github.com/thekeoni1/Temur/releases/download/v0.38.5/SHA256SUMS
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)
    chmod 755 artifacts/temur-v0.38.5-i686-unknown-linux-musl

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.38.5-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p15-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p15-offline-snap.json 128 \
        build/state-p15-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p15-offline-snap.json 128 build/state-p15-offline.bin

    # networked, relay up; the same PLANT_9P red run first
    node tools/stamp.mjs --allow-dirty && node relay/relay.mjs &
    node tools/gen-steps-p15-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p15-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p15-net.bin

    # the version strings inside each raw image, anchored and plain
    grep -a -o -P '0\.38\.4(?!\d)' build/state-p15-net.bin | wc -l   # 0
    grep -a -o -F '0.38.4' build/state-p15-net.bin | wc -l           # = the 0.38.44 count

    # survival, office read, and the file-cap gate, both tiers
    node tools/proof-9p-restore.mjs  kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p15-offline.bin offline
    python3 tools/mkdocs-sample.py build/office        # NOTE the argument
    node tools/proof-office-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p15-offline.bin offline
    node tools/proof-bigfile-read.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/state-p15-offline.bin offline
    # ... and the same three with state-p15-net.bin networked wisp://127.0.0.1:8089/

    # the relay probes
    node relay/relay-probe.mjs ws://127.0.0.1:8089/
    node relay/relay-privacy-probe.mjs
    node relay/relay-refusal-probe.mjs

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p15-*.bin.gz

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
d3dbaeaa in this commit.

## Deviations from the kickoff

1. AN EXTRA, OUT-OF-TREE PROBE was run for (a), as in P10 to P14: each
   restored snapshot was listed for temur state and started once with a
   plain `temur`. It is not committed. It tests its own two regexes
   against a planted string.
2. A SECOND OUT-OF-TREE PROBE read the F29 footer, as the kickoff
   directs. A copy of tools/proof-bigfile-read.mjs, outside the
   repository, differing in two added lines that print the last 400
   bytes of each tool result and in its JSON output path (the work
   directory, not build/), was run once per tier against the same two
   snapshots after the committed proof had run. It reported GATE PASS
   on both tiers with the same 7,591-byte and 68-byte tool results. The
   committed build/*.json are from the committed proof's run, and the
   committed proof is not changed. Per the ruling on P14's open
   question, its timings stay out of the table and the comment; they
   are disclosed here: big.pdf read in 5.5 s offline and 5.0 s
   networked, lowest MemAvailable 50.1 MB offline and 50.0 MB
   networked; big.xlsx 0.5 s offline and 0.8 s networked, lowest
   MemAvailable 76.3 MB offline and 76.1 MB networked.
3. TRAP 6, deliberate latency in front of the relay, was not exercised.
   No banner-flash claim is made in this report, as in P9 to P14.
4. "Exactly once in the DOM" is read from the source and the rendered
   stamp text, as in P10 to P14; no whole-DOM count was taken. The
   wrap rule was read from the page the local server served.
5. The item 9 and item 10 key scans use one joined expression for
   key-shaped material with a planted control per surface; the
   expression is not reproduced here.
6. The page harness launches Windows Edge, and tools/page-run.sh puts
   that run's throwaway browser profile in the Windows user's temp
   directory, which is on the Windows drive. That is the harness's
   standing design, used at P9 to P14; the profile holds nothing from
   this job but a browser session against localhost. The logs this job
   kept replace the profile path with a placeholder, and the five
   profiles this job's runs created were removed by name afterwards.
   53 older pagerun-* profiles from earlier runs remain in that
   directory; they are not this job's and were left alone.
7. Git pairs the asset renames ACROSS the tiers this time
   (state-p14-offline -> state-p15-net, state-p14-net ->
   state-p15-offline), as at P11, because the two tiers swapped sizes;
   P13 and P14 paired them within each tier. The sha256s above are of
   the named files either way.
8. Every comment line the kickoff listed was moved; no tracked
   reference outside the list named the version or the pair. The lines
   that still name an earlier version after the move are the intended
   history and comparison lines: artifacts/PROVENANCE.md 12, 13, 14 and
16,
   page/app.js 72 (the p14 pair it replaces), 872 and 874, and
   tools/stage-page.sh 68 (the superseded p14 files). Not on the
   pin list and left as it was: artifacts/PROVENANCE.md 44 still calls
   the in-machine version check the "fourth" check, where this report
   counts it as the sixth (P14 left the same line).
9. build/steps-p15-net-snap.json and build/steps-p15-offline-snap.json
   are added as new files, byte-identical to the p14 step files, as
   each earlier refresh added its own; the kickoff names only the
   build/*.json reports.
10. The step 3 "before" grep (step3-pins-before.log) ran after the
   download, so it already shows the v0.38.5 SHA256SUMS lines, and its
   pattern does not match the escaped regex lines in the two proofs
   or PROVENANCE.md 46; those were moved from the kickoff's list. In
   step7-dom-readings.log the unlabeled "0" after "wrap rule served: 1"
   is the same count over /style.css; the 1 is the served index.

## Corrections

1. The first extraction of the file-cap figures from the committed
   proof JSON read a key named "results" as the per-document list. The
   WRONG ASSUMPTION was that the per-read figures live under "results";
   that key holds the named check verdicts, and the per-document
   readings are under "reads". The script failed outright rather than
   printing a wrong number (the traceback was seen in the session and
   not kept in a log), was corrected, and every figure in the
   table above comes from the corrected run (step5-filecap-numbers.log
   in the work directory).

## The independent check

A fresh subagent was given ONLY the kickoff, the staged diff, the draft
of this report, the draft commit message and the gate and scan logs. It
never saw the conversation that produced the work, and the two sweep
pattern files were held out of its reach. Its answer is reproduced
verbatim below. Its line numbers refer to the draft, not to this file.
The transport HTML-escaped two arrows; they are shown here as the
characters.

WHAT WAS DONE ABOUT IT. Blocking 1 is done: the sweep and the register
check were re-run on this final text and the final commit message, and
the numbers above are from that run. Non-blocking 1 to 8 and 10 are
done: the floors sentence in the verdict names the 40 kB and 72 kB
rises; the "same screen as P14's" clause is dropped (a byte comparison
of the two plain-start captures differs in the number of redraw
repeats, so no equality is claimed); item 10 names all four "asked"
destinations and states the 30 ip fields without comparison, saying the
log ends with two sessions open; "still in history"; PROVENANCE.md 13
is added to deviation 8; the correction says its failed run was not
logged; deviation 6 discloses the 53 older profiles; deviation 10
covers the pins-before log and the unlabeled "0". Non-blocking 9 is
disclosed in deviation 8 and left unchanged, as P14 left it: the line
is pre-existing and off the pin list. Non-blocking 11 is deviation 9.

VERBATIM:

    # Independent check: P15 snapshot refresh (staged on d3dbaeaa)

    Env check: `env | grep -c ANTHROPIC_API_KEY` returned 0. The two held-out pattern files were not opened. Nothing was modified, staged, committed or pushed.

    ## Direct verification from the index

    | Item | Read from the index or a file | Result |
    |---|---|---|
    | HEAD, origin/main | `git log -1`, `git rev-parse origin/main` | both d3dbaeaa4c5e...; porcelain shows staged entries only, no unstaged changes |
    | Staged set | `git status --porcelain` | 26 paths; matches staged.stat |
    | artifacts/temur-v0.38.5-i686-unknown-linux-musl | blob sha256 and size | 39d3f157...45bd3, 8,364,852 B, mode 100755; cmp-identical to /home/dev/dist/release/v0.38.5/ copy |
    | artifacts/SHA256SUMS | blob | sha256 cce8c330...c634, 428 B, 4 lines; cmp-identical to the cut's staged copy |
    | page/assets/state-p15-net.bin.gz | blob | 16fbcf1d...2f49, 16,112,446 B; gunzipped cmp == build/state-p15-net.bin (37,978,848 B) |
    | page/assets/state-p15-offline.bin.gz | blob | 29d496fa...b9a1, 17,346,706 B; gunzipped cmp == build/state-p15-offline.bin (38,986,460 B) |
    | Five unchanged inputs | index blobs vs reports/v0384-refresh.md:90-94 at d3dbaeaa | all 5 identical (680f7536, 4d5cda4a, d72dfa14, d3a8f46c, 1a932892) |
    | relay/, kit/, tools/guest/, page/index.html | `git diff --cached d3dbaeaa -- ...` | no diff; relay tip 9c9eb67 |
    | Version strings in raw images (my own run) | `grep -a -o -F` / `-P '0\.38\.N(?!\d)'` | both images and the binary: 0.38.1-0.38.3 plain 0 / anchored 0; 0.38.4 plain 3 / anchored 0; 0.38.44 3; 0.38.5 anchored 1 |
    | Remaining pins | `git grep --cached` for the kickoff pattern plus `p14`, `v0384` and the escaped `0\.38\.` form, excluding reports/, build/, page/assets/ and vendor/ | only intended history lines remain: PROVENANCE.md 12, 13, 14, 16; app.js 72, 872, 874; stage-page.sh 68. Both proof regexes read `0\.38\.5` |
    | Staged report and commit message vs bundle | diff | reports/v0385-refresh.md == draft-report.md; work-dir commit-msg.txt == draft-commit-msg.txt; both have 0 non-ASCII lines |

    ## Q1. Does the diff do what the kickoff says and nothing else?

    Yes. I walked the step 3 pin list item by item:

    - **.gitignore:23-24.** Both negations now name state-p15-*. Done.
    - **THIRD_PARTY.md:64-65.** Both served-asset names are moved. Done.
    - **artifacts/PROVENANCE.md.**
      - Lines 6-8 now carry the file name, sha 39d3f157... and size 8364852.
      - The "replaces" paragraph (11-14) names v0.38.4, sha 113bdfd7..., 8353332 bytes and reports/v0384-refresh.md.
      - Both URLs (24, 29), the `sha256sum -c` line (34) and the published line (38) are moved.
      - The download date is 2026-10-12, which matches the step2-download.log start time.
      - Line 46 now points to v0385-refresh.md.
      - The never-served sentences (v0.38.2, v0.36.0) are kept, and no new one was added. Done as specified.
    - **page/app.js:60-61.** Both constants move together. Done.
    - **page/app.js:64-75.** "THE P15 PAIR" is in. Line 72 now reads "The p14 pair". SNAP_ONLINE and SNAP_OFFLINE name state-p15-*. Done.
    - **page/app.js:848-875.**
      - Line 853 now says v0.38.5.
      - The PDF line reads 5.5 s offline, 5.3 s networked; the floor reads 50.1 MB; the spreadsheet floor reads 76.3 MB.
      - Lines 871-874 keep the "on v0.38.5 ... on v0.38.4" shape, with v0.38.4's 5.0 s / 5.3 s / 50.0 MB as the prior reading.
      - The caps did not move. The figures match the committed JSONs (5523 / 5262 ms; 51252 kB and 78112 kB on the networked tier, the worse tier for both). Done.
      - The comment does not carry v0.38.4's 76.2 MB spreadsheet figure, which the kickoff's precedent list mentions. It is not required by the "keep the shape" rule, so this is not a defect.
    - **tools/stage-page.sh:13, 67-68, 71-87.** The pair, the P15/v0.38.5 sentence, "superseded p14 files" and the regenerate hint all moved. Done.
    - **tools/gen-steps-p14-*.mjs.** Both are renamed to p15 (97% and 96% similarity). Only line 1 and the output path changed (137 net, 70 offline). Done.
    - **tools/proof-office-read.mjs:1, 137, 138 and tools/proof-bigfile-read.mjs:270, 271.** The label and the escaped regex are moved in both files. The pre-swap FAIL is recorded in step5-office-preswap.log. Done.
    - **page/assets/.** The p14 pair is removed and the p15 pair added. Git pairs the renames across tiers (p14-offline -> p15-net, p14-net -> p15-offline). The report says which, in deviation 7. Done.
    - **build/*.json.** The 10 regenerated harness and proof reports are committed, per precedent. build/page-report-textcheck.json is unchanged because it carries no timing or size fields.

    **In the diff but not named in the kickoff:**

    - **build/steps-p15-net-snap.json and build/steps-p15-offline-snap.json (new files).** Each blob is identical to the p14, p13, p11 and p10 steps blobs (1c075711..., 26e596ae...). Earlier phases accumulated these files the same way, so this follows precedent. The kickoff only names "build/*.json reports", so planning should acknowledge it, but it is not a defect.
    - **reports/v0385-refresh.md (new file).** Step 11 asks for it.

    Nothing else is in the diff.

    ## Q2. Do the logs contain every line the kickoff requires?

    Mostly yes. Covered, by step:

    - **Step 1** (step1-preconditions.log): key count 0, HEAD == origin/main == d3dbaeaa, porcelain 0, relay tip 9c9eb67, node, node_modules, sample.* 0, the package-lock sha.
      - There is no "after" package-lock check in the logs. The index shows package-lock.json is not staged and the tree is clean, so it did not change.
    - **Unchanged inputs:** step0-unchanged-inputs.log.
    - **Step 2:** download HTTP 200, bytes and time (step2-download.log). Five-way verification, mode 755 and file(1) output (step2-verify.log).
      - Removing v0.38.4 by explicit name has no log line. The index shows the rename.
    - **Step 3:** pins before and after, plus the pre-swap FAIL.
    - **Step 4:**
      - Red and green on both tiers (both reds exit 3 with "no state file written"; by file mtimes and the relay log, each red ran before its green).
      - The overlay is built through mkcpio.
      - Landing text verbatim: in the green build logs at lines 189-199, and also in landing-*.txt in the work dir, which is not in the bundle.
      - Byte check against motd (486), watches (a)-(c) with a control, (d) per tier with anchored and plain counts and the 0.38.44 count, the session-state probe with its control, and the steps cmp.
    - **Step 5:** 9p both tiers, mkdocs, office both tiers (15 PASS each), bigfile both tiers, the three relay probes, the out-of-tree tail on both tiers with the probe diff, and the file-cap numbers.
    - **Step 6:** stage, ls -l, both sha256s, the under-25-MiB check, gz == build.
    - **Step 7:** all five page reports, DOM readings (stamp, 1/0 counts, the d3dbaeaa control, trust 5, wrap rule, release URL 200), relay stopped (0 listeners).
    - **Step 8:** item 9 (scan plus control, markers, assert, per-tier ash_history), item 10 (seven log surfaces with controls, probes, quads by field, 30 HASHED8, five refusals by destination), item 11 (WebGPU 0 with control, trust 5 identical, Excel, apex).
    - **Step 9:** sweep case-sensitive and case-insensitive, all 12 controls, five surfaces with hits and blobs, R4 blob paths, register with per-surface controls and the d3dbaeaa comparison.
    - **Report-to-planning items that apply before the commit:** all present, except the commit sha, the diff --stat at HEAD and ahead/behind, which belong after the commit.

    **Gaps:**

    1. **The sweep and register logs ran on the draft** (step9-sweep-draft.log, step9-register-draft.log). The draft report still holds CHECK_PLACEHOLDER. Once this check text replaces it, surfaces 1, 2, 3 and 5 and the register over reports/v0385-refresh.md change and have not been scanned. The kickoff makes the sweep the LAST gate.
    2. **step3-pins-before.log was not taken at d3dbaeaa.** It already shows the v0.38.5 artifacts/SHA256SUMS lines, so the grep ran after the download. Its pattern also misses the escaped regex lines (proof-*.mjs:138, :271) and PROVENANCE:46. The diff moved all of them anyway.
    3. **step7-dom-readings.log has an unlabeled "0" line** after "wrap rule served: 1". Its meaning cannot be read from the log.
    4. **bundle relay.log ends mid-session.** The last event is a ws_open with live 2 and no closes after it. The log was copied before those connections closed. Any count taken from it is a count of that copy.

    ## Q3. Does every number and quoted string appear in a primary?

    I checked every figure in the draft report and the draft commit message against the logs, the diff, the index, the kickoff and the reports at d3dbaeaa. All of these match:

    - **Hashes, sizes and timing:** the five hashes, sizes, sha256s, MiB values, 11,520, 0.88 s, the ELF type line, cce8c330, 428 B, 4 lines.
    - **Raw-size arithmetic** (all exact):
      - 40,956 / 32,764 / 1,396,732 / 1,372,156 / 1,528,662 / 6,549 B
      - 12,288 / 49,148 / 1,654,788 / 1,347,584 / 1,335,296 / 1,669,435 / 7,948 B
      - against P13 38,019,804 / 37,638,876 / 16,118,995, P10 38,011,612 / 38,974,172 / 17,338,758, P11 39,351,004 / 37,651,164 and the measuring rebuild 39,035,608, all in v038-, v0381- and v0384-refresh.md.
    - **File-cap figures:** 5,523 / 5,262 ms; 51,252 / 78,112 kB; P14 51,212 / 78,040; 1,464 kB above 49,788 kB (v037-refresh.md:713).
    - **Proof, footer and relay figures:**
      - 7,591 and 68 bytes; the footer text verbatim in step5-f29-tail-*.log, equal to P14 line 354; BIG-PDF-PAGE-ONE-MARKER at line 3.
      - 486 B; 556 / 1,569 (P14:241); 6/6, 9/9, "173 ip fields, all hashed", 24 / 4001 / 4002 / 4003, 16/16; 30 ip fields, P14 32 (P14:265), P13 30.
    - **Page-check figures:** readyMs 2031 / 2094 / 1002, echo 2 ms, 17 terms, 16.0 / 64.0 MB.
    - **Sweep and register counts:** R4 16 / 5 / 28 / 24 / 5, case-insensitive 43 / 41 / 174, P14's 15 / 22 (P14:447, 453), blob attribution 9 kit blobs = 14 hits plus 8 .gz blobs, register 0/0/0 x3 and 0/2/3.
    - **Deviation 2's tail figures** (5523 ms and 51352 kB offline; 5023 ms, 51216 kB, 752 ms and 77976 kB networked): they round to the stated values.

    **Items that are wrong, unsupported, or framed beyond their primary:**

    1. **Draft L37-39 ("both memory floors rose by 0.1 MB (50.0 to 50.1 MB, 76.2 to 76.3 MB)").** This is a rounding artifact. The measured rises are 40 kB (51,212 -> 51,252) and 72 kB (78,040 -> 78,112). The same applies to commit message L43-44 "moves from 50.0 MB to 50.1 MB" and the app.js comment "against 50.0 MB on v0.38.4". Those are faithful to the rounded figures, but the report's "rose by 0.1 MB" states a size of change the primary does not show. Suggest naming the kB deltas once.
    2. **Draft L136 ("otherwise the same screen as P14's").** No log compares the plain-start screen to P14's. step4-session-state-offline.log shows only P15's screen. This is unsupported; drop it or cite a comparison.
    3. **Draft L279-281 ("the dotted quads it does carry are its own bind address, its documentation-range address map, and the destinations the allowlist probe asked for").** relay.log has 4 stream_open "asked" fields. Only id 3 (18:07:39) is the allowlist probe. Ids 1 and 2 are the two networked builds' doctor probes (red and green, 18:04:55 and 18:05:11), and id 9 is the page netcheck. The plain-text refusal lines are the allowlist probe's. Reword to cover the build and page runs.
    4. **Draft L285-286 ("(P14's log had 32 ip fields and P13's 30; this one has P13's count.)").** The count only reflects how many websocket sessions this run opened, plus where the copy stopped (see Q2 gap 4). P14's own verification (v0384-refresh.md:824) put its extra two fields down to the out-of-tree footer run. This pass ran that same probe and it appears in this log (ws 18:11:20-18:11:39). So "P13's count" is a coincidence, not an equivalence. Suggest stating 30 with no comparison, or saying the copy ends with 2 sessions still open.
    5. **Draft L470-471 ("the p14 net .gz blob now in history (1)").** Blob df18da92 was already in history at d3dbaeaa, committed by P14. It leaves the tree; it does not newly enter history. "(still in history)" would be accurate. The arithmetic on L476-478 is right.
    6. **Draft L631, deviation 8 (PROVENANCE.md lines naming an earlier version "12, 14 and 16").** Line 13 also names reports/v0384-refresh.md, which is an intended line the kickoff asked for. The list is incomplete.
    7. **Draft L637-644, corrections ("The script failed outright").** No log records the failed first extraction. Only the corrected run is logged (step5-filecap-numbers.log). This is plausible but has no primary.
    8. **Draft L616-622, deviation 6 ("the five profiles this job's runs created were removed by name").** This is supported by profile-cleanup.log. The same log also says "pagerun-* remaining: 53" from earlier runs, still in the Windows temp directory. They are not this job's, but suggest disclosing the count.
    9. **artifacts/PROVENANCE.md:45 (a pre-existing line, not moved: "A fourth, independent check comes from inside the machine").** The report and commit message call the in-machine check the sixth. The two committed texts now number the same check differently. This is outside the kickoff's pin list.
    10. **Observation, not an error.** The committed offline big.pdf turnMs and the out-of-tree offline tail run are both exactly 5523 ms. Their memory readings differ (51,360 vs 51,352 kB), and the tail JSON in the work dir is a separate file, so they are two distinct runs.
    11. **Observation, follows precedent.** The committed build/page-report-landingcheck.json stampText says "build d3dbaea", from the dirty local stamp. After the commit the live build will be the new sha. P14's JSON carried 30307bc the same way.

    ## Overall verdict

    The diff does what the kickoff asks: every pin on the list moved, nothing outside the list changed except the per-precedent build/ step and report JSONs and the report itself, and every load-bearing number checks out against a primary. The ship-critical facts hold from my own measurements:

    - The binary is the released one.
    - Both assets are what the proofs ran against.
    - No old version is inside either image.
    - The five inputs did not change.
    - relay/ is untouched.

    ### Blocking (before commit)

    1. **Re-run the sweep and register after this text replaces CHECK_PLACEHOLDER.** Cover surfaces 1, 2, 3 and 5 over the final staged diff, the final commit message and reports/v0385-refresh.md, with the controls. The current logs are draft-stage and do not cover the inserted text.

    ### Non-blocking

    1. Draft L37-39: "rose by 0.1 MB" is rounding; the measured rises are 40 kB and 72 kB.
    2. Draft L136: "otherwise the same screen as P14's" has no primary.
    3. Draft L279-281: three of the four "asked" quads are from the build doctor probes and netcheck, not the allowlist probe.
    4. Draft L285-286: the ip-field comparison with P13/P14 is framed beyond its primary, and the relay.log copy ends with 2 sessions open.
    5. Draft L470-471: "now in history" should be "still in history".
    6. Draft L631: deviation 8 omits PROVENANCE.md:13.
    7. Draft L637-644: the correction's failed first run has no log.
    8. Deviation 6: disclose the 53 pre-existing pagerun-* profiles.
    9. PROVENANCE.md:45 says "fourth" while the report says "sixth" for the same in-machine check.
    10. step3-pins-before.log was taken after the SHA256SUMS download and misses the escaped regex lines; step7-dom-readings.log has an unlabeled "0".
    11. The build/steps-p15-*.json additions are per precedent but not named in the kickoff; planning should acknowledge them.

## Held

Nothing is pushed. The push publishes the sandbox immediately. This
commit is local and waits for planning to verify it from primaries,
obtain the operator's word, and name the sha.
