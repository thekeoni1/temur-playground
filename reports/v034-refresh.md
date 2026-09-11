# P7: the snapshots move to temur v0.34.0, and the sandbox reads office files

Built on the laptop from /home/dev/sandbox-v034-refresh-kickoff.md,
verified by sha256 (36b43cdc...) before any work started. Where this
report differs from the kickoff it is a disclosed deviation in the
numbered list at the end.

Keyless throughout. No session saw, typed, stored or read a key. The
temur product tree was not touched. Nothing is pushed: every commit is
local and held for the operator's word.

## Verdict

Both served snapshots are rebuilt on the released temur v0.34.0, both
are under the 25 MiB per-file limit, and the /files hint now says what
the machine does. A visitor can drop a PDF, a Word document or a
spreadsheet into /files and have temur read it as text.

The refresh is a binary swap and nothing else. The kernel, the three
guest overlay files and the relay are all untouched; the only thing that
moved inside the machine is /usr/bin/temur.

## The build input

    file    temur-v0.34.0-i686-unknown-linux-musl
    sha256  b9b7bfd87c7026d3c01d6a1ba9b8cdb85efa461757b51dc58b32d0dc56cbd625
    size    9,512,532 bytes

Downloaded tokenless from the public release URL. The hash was checked
three ways before it went anywhere near the overlay: against the
SHA256SUMS published beside it in the same release, against the value
planning supplied independently before the download, and by
`sha256sum -c` in artifacts/. All three agree. See artifacts/PROVENANCE.md.

v0.33.0 was 6,201,908 bytes, so the binary grew by 3.31 MB, and that
growth is the whole reason the snapshots grew.

## What did NOT change

    kit/bzImage-p6        680f7536ed2a14a45f4720cc4bd4583901d25182033c907ea8798dee01ea8868
    kit/rootfs.cpio.gz    4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
    tools/guest/motd      d72dfa14bcd9c52eb565ab358f40faded74fff831c5253db921cfeff4a95f2a7
    tools/guest/console.sh d3a8f46c94b05f179a18f42d05686d7f16d2258a225de1880e038915c455e4bd
    tools/guest/S30files  1a93289224c4e2361a34bfb37a0e6608b1ac801d17a7e664e74e841fcb9d2993

THE MOTD IS LEFT AS IT WAS, deliberately. Its /files line ("Files you
add from the page arrive here, and what temur writes here you can
download from the page") is still true of v0.34.0 and needs no
office-format change, and no reword text was supplied. It is inside the
overlay, so a later reword costs a full rebuild of both snapshots; it is
cheap to bank and expensive to retrofit, which is why it is flagged here
rather than guessed at.

The relay is untouched and still stands at 9c9eb67. It was RUN locally
for the networked capture and for the page checks, which exercises its
code without changing it. G1 holds.

## Why the filenames had to change

Snapshots version by FILENAME and never by `?v=`: tools/asset-stamp.mjs
excludes them from stamping by design, because a 16 MB asset should not
be re-fetched for a one-line page edit. The consequence is that changed
content MUST arrive under a changed name, or a returning visitor's cache
serves them the old machine behind a page that describes the new one.

So state-p6-* becomes state-p7-*, and every reference moves in the same
commit: page/app.js, the .gitignore un-ignore lines (without which the
new files are not committable at all), tools/stage-page.sh, both
gen-steps scripts, and THIRD_PARTY.md, where the two served snapshots
are named as the reason its GPL-2.0 section exists.

Only one pair is carried. The p6 files are removed from the working tree
in the same commit that adds the p7 pair; git history keeps both, which
is unavoidable and accepted.

## Sizes, against the 25 MiB Cloudflare Pages limit

                             raw            gzip -9        gzipped
    state-p7-net.bin      39,805,664 B   16,946,323 B   16.16 MiB
    state-p7-offline.bin  38,851,288 B   16,046,502 B   15.30 MiB

    (p6, for comparison:  14.17 MiB net, 15.05 MiB offline)

    sha256  state-p7-net.bin.gz      7dca4173a3ea914fb188b965847c17811b2050f03bd4f13f85453fca44b312c3
    sha256  state-p7-offline.bin.gz  c6f86a6cacafa3e1dd93a7e80410c98c755d55ff1577792058e0ddb55a33fdc4

Both are comfortably inside the limit. The networked tier grew more than
the offline one because gzip finds less to do with the larger binary
sitting in its address space.

## The pristine assert, red and green

The rule this repository learned in P6 is that a share which was written
to and tidied up is NOT clean: v86 serialises the 9p filesystem into the
saved state, so deleted bytes still ship to every visitor. The assert
therefore demands exactly ONE inode, the root.

RED, deliberately provoked:

    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs ... state-p7-offline.bin
    -> exit 3
    -> "9p ASSERT FAILED at the snapshot point: the share is NOT empty
        ... entries=1 top=["visitor-notes.txt"] inodes=2 ... No state
        file was written."
    -> build/state-p7-offline.bin did not exist afterwards

GREEN, the run that built the shipped state:

    [harness] 9p empty-at-snapshot assert PASSED: entries=0 used_size=0 inodes=1
    state saved: build/state-p7-offline.bin (38851288 bytes)

A build that only ever passes has not shown it can fail. Both halves are
in build/p7-offline-assert-red.log and build/p7-offline-snap.log.

## 9p restore, both tiers

    node tools/proof-9p-restore.mjs ... state-p7-offline.bin offline     ALL PASS (8/8)
    node tools/proof-9p-restore.mjs ... state-p7-net.bin networked ...   ALL PASS (8/8)

Both tiers: ICRNL on with no page nudge, the mount survives restore with
no remount, the share ships empty, an uploaded file's host and guest
sha256 agree, the hash survives drop_caches, the file is still listed
after umount and remount, a file written in the guest reads back on the
JS side byte for byte, and temur is present with the share as its working
directory.

## Doctor, re-captured on the fresh machine

Run inside the networked capture against a throwaway config under a
redirected XDG_CONFIG_HOME in /tmp, removed in the same step, because the
snapshot ships no config at all:

    PASS: key isolation: 1 key file(s) guarded (tools cannot read them)
    PASS: bash key sandbox: available (unprivileged user namespaces)
    PASS: reachable: https://api.anthropic.com (TCP connect + TLS handshake)
    PROBE-REMOVED
    KEYLESS-SNAPSHOT-OK
    NO-SECRET-ENV-OK

## The office-read proof

This is the point of the refresh, so it is proved where a visitor meets
it: on the restored snapshot, on files delivered the way the page
delivers them, with the binary that ships.

### Getting the extracted text into view

NO TEMUR SURFACE EVER PRINTS TOOL OUTPUT. The one-shot UI, the plain
REPL and the TUI all print a tool's name and title and nothing else, so
"read the PDF and show me the text" has no answer from the console alone.
The extracted text exists in exactly one place, the request body temur
sends its provider.

`--mock` cannot reach it: it replaces the transport and discards the
body. A bench server on the host cannot either, because the relay's
allowlist is four provider hostnames and G1 keeps relay/ untouched.

What the guest CAN reach without going near the relay is its own
loopback. So a scripted model runs inside the guest, served by busybox
inetd (tools/guest-stub-model.sh), and the request bodies it is handed
are written into the share and read back over 9p by the harness. Those
are the guest's own bytes, not the harness's idea of them.

On the OFFLINE tier this needed no configuration at all: that snapshot
already ships a config pointing at http://127.0.0.1:8080/v1, a local
llama.cpp that is not running, so the scripted model simply answers where
the visitor's own config already looks. The networked tier ships no
config, so a throwaway one was written for the run.

### Five cases, and two of them must fail

A read tool that had merely become permissive would pass three cases out
of three, so the set includes two that must be refused.

    /files/sample.pdf      ->  3 succeeded
    /files/sample.docx
    /files/sample.xlsx
    /files/not-really.pdf  ->  2 refused
    /files/blob.bin

The three documents are generated by tools/mkdocs-sample.py, hand-built
so their text is known exactly, and they arrive through
`emulator.create_file`, which is the call the page's own drop handler
makes.

### What came back, verbatim

    <path>/files/sample.pdf</path>
    <type>file</type>
    <content>
    1:
    2:
    3: Temur reads PDF files now.
    4: Ship it on the 32-bit sandbox.

    (End of file - total 4 lines)
    </content>

    <path>/files/sample.docx</path>
    <type>file</type>
    <content>
    1: Word documents become plain text.
    2:

    (End of file - total 2 lines)
    </content>

    <path>/files/sample.xlsx</path>
    <type>file</type>
    <content>
    1: == Sheet: sales ==
    2: region,units
    3: north,42
    4: south,17
    5:

    (End of file - total 5 lines)
    </content>

And the two controls, refused with sentences a model can act on:

    temur could not read this PDF: it is malformed or not a PDF. Ask the
    user for the text.

    Cannot read binary file: /files/blob.bin. Inspect it with bash
    instead (e.g. file, unzip -l, strings).

Both tiers: ALL PASS, 14 checks each. build/proof-office-read-offline.json
and build/proof-office-read-networked.json.

### Three harness defects this proof turned up in itself

Worth recording, because all three would have scored a working run as a
failure or a broken run as a pass:

1. THE CONSOLE IS UTF-8 AND THE LISTENER WAS NOT. Reading serial output
   with `String.fromCharCode` per byte splits temur's U+2713 / U+2717
   tool marks into replacement characters, so a check looking for them
   fails on a run that worked. The bytes are now buffered and decoded as
   UTF-8.

2. THE COMMAND-ECHO TRAP, which this repository already names in
   tools/run-guest.mjs as the SENTINEL RULE and which was walked into
   anyway. The console echoes the command line back, so
   `... && echo copied` followed by a grep for "copied" passes whether or
   not the command ran. It was worse than cosmetic here: the check for
   "does this tier ship a config" matched the echoed command every time,
   so the harness overwrote the offline tier's real config with a
   throwaway and would have reported a proof of the wrong thing. Markers
   are now split in the typed text.

3. A REFUSED READ PRINTS NO PATH. Both controls render as the failure
   mark followed by "read: read", because the one-shot UI falls back to
   the tool's name when the call carries no title, and matching tool
   results by path therefore scored two correct refusals as missing.
   Results are matched by plan order now, with the path still asserted
   wherever one exists.

## The page hint

page/index.html, the #fileshint span. Was:

    Text, code and data work; nothing in here reads PDFs or office files.

Now:

    Text, code and data work, and temur reads PDF, Word and spreadsheet
    files too.

This ships in the SAME deploy as the p7 snapshots and never before one.
The wording is planning's recommendation and the operator may adjust it;
it is a page-only edit and costs no rebuild.

## Both tiers in a real browser

Headless Edge, real time, local relay at ws://127.0.0.1:8089 supplied by
PAGE_DEV_RELAY at serve time. The shipped CSP in page/_headers is
unedited and 0-diff. Each report was deleted before its run, so no stale
verdict could read as a result.

    filecheck     ok: true   upload and download sha256 match both ways,
                             per-file and total caps refuse correctly
    textcheck     ok: true   17 diagnostic terms, 0 hits in markup and 0
                             in rendered text; file panel and /files path
                             both present
    landingcheck  cleanLanding: true, wizardAtFirstQuestion: true,
                  readyMs 1960, stamp reads build 5a315cd
    netcheck      Networked tier, wireBytes 16,946,323, stateBytes
                  39,805,664, readyMs 2077,
                  "PASS: reachable: https://api.anthropic.com
                   (TCP connect + TLS handshake)"
    selftest      ok: true, NO PROVIDER tier, wireBytes 16,046,502,
                  stateBytes 38,851,288, readyMs 3354, offline greeting
                  intact, echo 1 ms

netcheck and selftest report exactly the wire and state sizes of the two
new assets, which is the check that the page is serving the p7 pair and
not a cached p6 one.

## Reproduce

    cd /home/dev/temur-playground
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    npm ci

    # the binary, then verify before it is used
    curl -fsSLO --output-dir artifacts \
      https://github.com/thekeoni1/Temur/releases/download/v0.34.0/temur-v0.34.0-i686-unknown-linux-musl
    (cd artifacts && sha256sum -c SHA256SUMS --ignore-missing)

    # overlay only; the kernel is not rebuilt
    python3 tools/mkcpio.py build/temur-overlay-p6.cpio \
        artifacts/temur-v0.34.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644 \
        etc/init.d/S30files=tools/guest/S30files:755
    gzip -9 -c build/temur-overlay-p6.cpio > build/temur-overlay-p6.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p6.cpio.gz \
        > build/rootfs-temur-p6.cpio.gz

    # offline: the assert red, then green
    node tools/gen-steps-p7-offline-snap.mjs
    PLANT_9P=visitor-notes.txt node tools/run-guest.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/steps-p7-offline-snap.json 128 \
        build/state-p7-offline.bin          # MUST exit 3 and write nothing
    node tools/run-guest.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p7-offline-snap.json 128 build/state-p7-offline.bin

    # networked
    node tools/stamp.mjs && node relay/relay.mjs &
    node tools/gen-steps-p7-net-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p6 build/rootfs-temur-p6.cpio.gz \
        build/steps-p7-net-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p7-net.bin

    # survival, and the office read, both tiers
    node tools/proof-9p-restore.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/state-p7-offline.bin offline
    node tools/proof-9p-restore.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/state-p7-net.bin networked \
        wisp://127.0.0.1:8089/
    node tools/proof-office-read.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/state-p7-offline.bin offline
    node tools/proof-office-read.mjs kit/bzImage-p6 \
        build/rootfs-temur-p6.cpio.gz build/state-p7-net.bin networked \
        wisp://127.0.0.1:8089/

    # stage, then check the 25 MiB limit before anything is committed
    sh tools/stage-page.sh
    ls -l page/assets/state-p7-*.bin.gz

    # both tiers in a real browser, relay up for netcheck and down for selftest
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    sh tools/page-run.sh filecheck    'filecheck=1'
    sh tools/page-run.sh textcheck    'textcheck=1'
    sh tools/page-run.sh landingcheck 'landingcheck=1'
    sh tools/page-run.sh netcheck     'netcheck=1'
    sh tools/page-run.sh selftest     'selftest=1'

`tools/stamp.mjs` rewrites page/index.html's asset refs in place as a
build transform. The committed form keeps them BARE, so the file is
restored after stamping and before committing; tools/serve-page.mjs does
the same rewrite in memory for the local loop.

## Deviations from the kickoff

1. THE OFFLINE TIER'S OWN CONFIG IS USED FOR THE OFFICE PROOF, not a
   throwaway. The kickoff did not specify either way. The shipped config
   already points at the loopback port the scripted model listens on, so
   using it touches nothing and is the more faithful test. The networked
   tier ships no config, so that one gets a throwaway.

2. THE BUILD ARTIFACTS KEEP THEIR p6 NAMES. build/temur-overlay-p6.cpio
   and build/rootfs-temur-p6.cpio.gz are rebuilt in place with the new
   binary, as the kickoff's build sequence spells out. They are not
   served and not committed, so the p6 in the name records the kernel
   generation rather than the binary. The SERVED files, which are the
   ones a cache can get wrong, all moved to p7.

3. THE SNAPSHOT-POINT SENTINELS ARE UNCHANGED. The two gen-steps scripts
   still echo "P6-OFFLINE-SNAPSHOT-POINT" and
   "P3B-INIT-LANDING-SNAPSHOT-POINT" at the settle step. Renaming them
   would change the terminal scrollback captured INSIDE the shipped
   state for no gain, so they stay as the marker of which steps file
   built the machine.

4. tools/gen-steps-p6-9p-proof.mjs KEEPS ITS NAME. It is the raw-boot
   proof of the kernel and overlay, not a snapshot generator, and the
   kernel is still p6.

5. THE OFFICE-READ PROOF IS NEW WORK the kickoff asked for by outcome
   ("confirm in the guest ... showing the extracted text") but not by
   mechanism. The mechanism is described above and is three new files.

## Held

Nothing is pushed. The push publishes the sandbox immediately and takes
the operator's own word in the implementing session naming the head.
