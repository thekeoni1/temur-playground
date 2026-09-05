# Sandbox P3a FIX PASS: report

2026-09-05, laptop implementing session, entirely KEYLESS. For desktop
planning. HOLDING after this report.

Clone: /home/dev/temur-playground, branch master.
temur repo: untouched at 6da6be3, clean, NOT fast-forwarded to origin's
1957f8f. No temur code change of any kind.
Nothing deployed, exposed beyond 127.0.0.1, or published.

Controls verified before reading either file, both matched:

  sandbox-p3a-fix.md          4dacfb2cb727132578c4f5a1b3e958ce066d8e20f90038fca30ac47102b2fefe
  sandbox-p3a-fix-kickoff.md  5b6b00cea6cb2bc5f1cb405333051849b1b99ddded0cf8b76c7153122965dd93

Preflight: ANTHROPIC_API_KEY absent, no key-shaped material in the
environment. NO KEY EXISTED anywhere in this pass. The one value typed
into a helper prompt was the literal string NOT-A-REAL-KEY-0123456789,
in a throwaway boot, deleted in the same run, and absent from the
shipped snapshot (proven by grep below).

## Headline

All five items ruled in are done and proven. The one that changed shape
is item 4, and it changed in temur's favour.

  helper      ships in the overlay at /usr/bin/temur-setkey, proven BY
              BARE NAME, which is the command the operator doc gives
  sentinel    carries the step's exit status; proven to fail the run on
              the exact bug shape it missed last time
  kernel      CONFIG_USER_NS=y; doctor now says the key sandbox is
              AVAILABLE where it said unavailable
  Enter/CR    NOT a product finding. The guest console has CR
              translation off FROM FIRST BOOT. temur restores the
              terminal exactly. Fixed in the helper.
  page        says plainly when the relay is gone, and clears itself
              when it comes back
  snapshot    rebuilt keyless on the fixed kernel and overlay, every
              step rc=0, keyless grep clean, proof (d) re-run

## Artifacts, all added beside, none overwritten

  bzImage-p4              3,822,080 B  bbc60ccd4b711f07fa9b3c1dfc915e472fa14b624d722795d6aebb5c25cb0c1c
  kernel-p4.config                     883cc0808c9a8a5814d23a9c093894cd3a9c88161f8439bb9c3b02834c0b41f3
  linux-i686-v86-p4.config             f8d19d89b105354155dbf0a431608324a282e82ef1854cb58ed96702c51403d9
  temur-overlay-p4.cpio.gz  2,908,942 B  e71bf3be5ac4e26c2422ff5beaa97b998f0e0fc0e723d4aa5f0e54a3d36f21fa
  rootfs-temur-p4.cpio.gz   3,893,647 B  387c826c468eb12847600147263a475b7a9d3a9d9efcf166f29eacf4867e5f67
  state-p4-page.bin        35,139,412 B  b606f6394446b8d80ecff88ca0ae04363c936a6d844cb75c66bb5efd3799547e
  state-p4-page.bin.gz     15,931,078 B  (served asset)

Unchanged, verified byte-identical by sha256 after the pass:

  bzImage-p2        ff1c9c182443063da977f5e087d58b8ce2db8b6e230dea26cf1621424901d014
  kernel-p2.config  42a439d6f2660d11d205a8bdfccc94d0ed2c7595ce6936ac1adecd8335825f3c
  bzImage-p3        c964b9172584f3782b634fba22e3a8f3423778fc9ac636fb34f0b852d7c1b27a
  kernel-p3.config  7e67ae7d70ef86d421a818b47464599c3b808aa4eb9c5f9d4bc5b4888e37d8c8
  rootfs.cpio.gz    4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e

The temur binary packed into the new overlay is the shipped v0.33.0 i686
build, sha256 16454ebdeb2641a124f55b215c68e06a7b81c744a56624a5b4e4ea3de1855d72,
the same one P1 packed. Nothing about temur changed in this pass.

## Item 4 first, because its verdict is text for the others

THE ENTER DEFECT IS NOT TEMUR'S, AND IT IS OLDER THAN P3a.

The existing runners could never have found it. Both submit every line
with LF (0x0A). A real terminal, and xterm.js in the page, submits Enter
as CR (0x0D). So the harnesses were structurally blind to a defect that
only exists for CR. tools/repro-cr.mjs submits with CR and keeps an LF
control channel so the experiment cannot lock itself out;
tools/cr-boot.mjs asks the same of a fresh boot; tools/cr-control.mjs is
the negative control; tools/cr-mech.mjs walks the flags one at a time.

Two readers, and they do not behave alike. busybox ash's LINE EDITOR
reads the shell's own command lines and accepts CR itself, which is why
ordinary commands always felt fine. The `read` BUILTIN goes through the
kernel line discipline, where CR is a line terminator only if ICRNL
translates it. The key helper uses `read`.

Measured, on a FRESH BOOT, no snapshot and no temur involved:

  stty -g at the first prompt   1400:5:1cb2:a3b:...
  iflag 0x1400 = IXON | IXOFF.  ICRNL (0x100) is OFF.
  shell command line + CR       works
  read builtin + CR             BROKEN
  after `stty icrnl` (0x1500)   read builtin + CR works, clean value

So this has been true since P1. Nothing in P3a caused it.

THE PART THAT IS WORSE THAN THE HANG. With ICRNL off, CR does not end
the `read` line, it is STORED as data. When a real LF finally arrives,
which is what Ctrl-J sends, the variable carries an embedded CR:
measured, `read -r K` returned K = "hello\r". An operator who pressed
Enter, saw nothing, and then pressed Ctrl-J would have written a key
file with a trailing carriage return and seen nothing but authentication
failures. The visible hang was the lucky outcome.

TEMUR IS EXONERATED BY MEASUREMENT. Restoring the P3a snapshot and
comparing stty -g before and after:

  action                          stty -g after
  nothing (baseline)              1400:5:1cb2:a3b:...  unchanged
  temur doctor, then exit         1400:5:1cb2:a3b:...  unchanged
  temur TUI entered and left      1400:5:1cb2:a3b:...  unchanged
    (tui-probe: "tui-probe OK: alternate screen entered and restored")
  interrupted `stty -echo; read`  1400:5:1cb2:a33:...  ECHO LOST

The only action that changed the terminal is the operator's own
interrupted hidden-read line, which loses ECHO (lflag 0xa3b to 0xa33)
and is exactly what made the console look dead. temur's exit path
restores the terminal to a state byte-identical to a fresh boot.

Nothing is reported to desktop about temur here, and the playground
patches nothing on temur's behalf. The fix is in the helper.

## Item 2: the sentinel carries the exit status

Both runners appended the sentinel with a semicolon, so it printed no
matter how the command ended. "Step done" never meant "step worked".
Now $? is captured FIRST, before the blank echo can clobber it, the
sentinel carries it, and the judge fails the run on a nonzero RC. A step
that is supposed to fail sets "expectNonzero": true. The marker is split
in the typed text (STEP_0''_DONE) so the shell's echo of the command
line can never satisfy the judge's regex, even when the line wraps at 80
columns.

Proven against the exact shape it missed, in build/steps-sentinel-proof.json:

  step "a step that works"                                rc=0
  step "a step that is SUPPOSED to fail" (expectNonzero)  rc=1, tolerated
  step "redirect into a missing directory"                rc=1
  === STEP FAILED: "the P3a bug shape: redirect into a missing directory" exited 1
  and the step after it did NOT run.

LIMIT, FLAGGED: steps that use `raw` and `waitMs` (the proof (d) TUI
steps) send arbitrary bytes and have no sentinel at all, so they report
rc=undefined and the gate cannot cover them. They are judged on their
output, as before. Making those carry a status would mean inventing a
way to ask a full-screen TUI for one, which is not worth it; recording
the gap instead.

## Item 1: temur-setkey is a real file

The P3a snapshot tried to create it with a printf redirect into
/usr/local/bin. That directory does not exist in this rootfs, so nothing
was created, and the failure was invisible for the reason item 2 fixes.
My first response, documenting a full-path workaround, could not have
worked either, and I left it in place pending your ruling rather than
guess a second time.

The helper is now tools/guest/temur-setkey, packed by tools/mkcpio.py at
usr/bin/temur-setkey. The archive creates usr/ and usr/bin/ explicitly,
which is the "mkdir -p regardless" the brief asked for: the recipe no
longer depends on the rootfs having a directory. /usr/bin is already on
the rootfs PATH ("/bin:/sbin:/usr/bin:/usr/sbin"), so no profile edit.

The helper also carries item 4's fix: it saves the terminal state, turns
ICRNL on and echo off for the read, restores on every exit path
including an interrupt trap, and strips a trailing CR anyway.

Proven in the guest BY BARE NAME, which is the failure I made last time:
I verified the artifact by full path and never ran the documented
command.

  # command -v temur-setkey
  /usr/bin/temur-setkey
  -rwxr-xr-x    1 root     root          2410 /usr/bin/temur-setkey

  # temur-setkey </dev/null; RC=$?; ...
  Paste your API key, then press Enter (input is hidden):
  no key entered; nothing written
  helper-rc=1
  ls: /root/.config/temur/key: No such file or directory
  PROOF-OK

And interactively, submitting with CR the way a real terminal does:

  # temur-setkey
  Paste your API key, then press Enter (input is hidden):
  key written to /root/.config/temur/key (25 bytes, -rw-------)
  size=25 ... CR-PROOF-OK

with the typed value never echoed to the serial log, the file contents
byte-exact with no CR (od confirms), mode 0600, and stty -g identical
before and after. The throwaway value was removed in the same run.

## Item 3: CONFIG_USER_NS=y

temur was right to prompt: its T18 sandbox needs
unshare(CLONE_NEWUSER|CLONE_NEWNS) and the kernel had no unprivileged
user namespaces, so it fell back to the T21 per-command approval. USER_NS
has no depends line in init/Kconfig and defaults to n, so the fragment
had to ask for it.

  gained 1 symbol (CONFIG_USER_NS=y), lost 0, changed 0
  bzImage-p3 3,813,888 B  ->  bzImage-p4 3,822,080 B   (+8,192 B)

Acceptance, keyless, SAME rootfs and SAME steps on both kernels so the
two lines can be compared directly:

  p3: WARN: bash key sandbox: unavailable on this kernel (no
      unprivileged user namespaces): an interactive session will ask
      per-command approval before running bash unsandboxed ...
  p4: PASS: bash key sandbox: available (unprivileged user namespaces)

WHY THIS IS REACHABLE WITHOUT A KEY, since it is not obvious: doctor
only probes the sandbox when the key guard is non-empty, and the guard
is built from CONFIGURED key paths, not existing files
(KeyGuard::from_selection, lenient canonicalization). Exporting
APP_SECRET_FILE at a path with no file there still reports "1 key
file(s) guarded", which is exactly the snapshot's own shape.

NOT CLAIMED: the brief's other half, a bash tool call that no longer
prompts, needs a keyed config to trigger the sandbox at all. That is the
operator's at the next keyed run, and the operator doc now asks for it
explicitly.

## Item 5: the page says when the relay is gone

v86 gives no event: its wisp adapter sets wispws.onclose to retry
register_ws every 10 seconds, forever, in silence. I chose design (a),
watching THE ACTUAL SOCKET the guest's traffic uses, by POLLING
readyState rather than hooking onclose, for two reasons: v86 owns that
handler and uses it to reconnect, so chaining onto it risks breaking the
reconnect; and re-reading adapter.wispws each tick follows every new
socket for free. Design (b), a separate monitor websocket, could
disagree with the guest's real link and would spend one of the relay's
per-IP slots, so it stays only as the fallback if a future v86 build
hides the adapter. Which one is live is reported as relayWatch.

Proven in headless Edge against the real page with ?relaycheck=1, a new
mode that reads the BANNER and never the terminal buffer, so unlike the
self-test it has no way to leak a key even if one existed:

  relayWatch     adapter-socket   (the fallback was not needed)
  bannerShown    true at 27,054 ms, as the relay was stopped
  text           "Relay connection lost. Requests from the guest will
                 HANG rather than fail: the connection was accepted
                 inside this page before the relay went away, so nothing
                 tells the guest it is gone. Restart the relay and this
                 notice clears, or reload to run the offline tier."
  reload button  present
  bannerCleared  true at 49,103 ms, on its own, once the relay returned

And with the relay still down, a reload lands in the offline tier and
works end to end: tier offline, TUI ready 3,432 ms, echo 24 ms, typed
text echoed as "> hello from p3a", exit back to the shell.

THE HANG ITSELF IS NOT FIXED AND WAS NOT MINE TO FIX. Ruled out of this
pass: temur's chat transports build ureq with only
http_status_as_error(false) and no timeout, and v86 completes the
guest's TCP handshake in-page before any relay stream exists, so no
reset ever reaches the guest. The banner explains the hang; it does not
prevent it. The operator doc now says so in those words.

## Item 6: the new keyless snapshot

Built with tools/gen-steps-p4-page-snap.mjs. The inline helper bake is
gone; in its place a step RUNS THE DOCUMENTED COMMAND BY BARE NAME on
empty input and asserts the refusal, so a missing helper fails the
snapshot build instead of shipping a guest the operator cannot use.
All nine steps reported rc=0 under the new sentinel rule. Boot to prompt
4,260 ms.

  HELPER-PROOF-OK, helper-rc=1, key file still absent
  PASS: bash key sandbox: available (unprivileged user namespaces)
  PASS: reachable: https://api.anthropic.com (TCP connect + TLS handshake)

KEYLESS PROOF on the decompressed snapshot bytes:

  sk-ant-  0      sk-proj-  0      sk-or-  0
  AIza     0      xai-      0      NOT-A-REAL-KEY  0

The 3 bare "sk-" hits are kernel socket strings ("sk->sk_state=%d",
"&sk->sk_lock.wq", "tw_sock_%s"), as in P3a.

PROOF (d) re-run on bzImage-p4 with the new overlay: alternate screen
entered once and left once, bracketed paste enabled, "hello from p2"
echoed on the input line, DEL bytes cleared it, TEMUR-EXIT-STATUS=0,
back at the shell, stderr empty.

## Numbers, beside P3a's

  page, networked tier (Edge 152 headless)
    wire            15,931,078 B   (P3a: 15,935,215)
    state           35,139,412 B   (P3a: 35,118,932)
    fetch                  133 ms
    restore                 67 ms  (P3a: 109)
    ready                1,551 ms
  page, offline tier
    wire            15,581,537 B   unchanged
    state           34,733,896 B   unchanged
    TUI ready            3,432 ms  (P3a: 3,448)
    echo                    24 ms  (P3a: 31)
  relay, keyless handshake from the browser
    {"event":"stream_open","id":1,"asked":"192.0.2.1:443","dest":"api.anthropic.com:443"}
    {"event":"stream_close","id":1,...,"bytes_up":324,"bytes_down":2782,"ms":1609}

324 up is a ClientHello and 2,782 down a certificate chain, counted and
unreadable by the relay, exactly as in P3a. The offline tier still pays
the full 2,500 ms relay probe before giving up; not in scope.

## Deviations and things flagged

1. ITEM 4 INVERTED. The brief allowed for a product finding in temur's
   exit path. There is none; the cause is a guest console default older
   than P3a. The operator doc still gets the Ctrl-J / stty sane rule,
   because a hand-typed `read` at the shell is still affected, plus a
   warning about the silent CR corruption, which nobody had spotted.
2. RAW STEPS ARE OUTSIDE THE RC GATE. Recorded above under item 2.
3. NEW PAGE QUERY MODE. ?relaycheck=1 exists now. It cannot read the
   terminal, but it is listed in the operator doc's "do not run with a
   key present" list anyway, on the principle that the list should not
   need judgement to apply.
4. netcheck now also posts page timings (byte counts and milliseconds).
   No terminal content: it still posts exactly one matched reachability
   line.
5. page/assets/state-p3-page.bin.gz removed, since the networked tier no
   longer serves it. build/state-p3-page.bin is kept as the record of
   what the keyed run ran against.
6. PROVIDER CHOOSER NOT BUILT, as ruled. The operator doc now states the
   fact: the snapshot bakes an Anthropic config, and another provider
   needs config.json written by hand in the guest. Flagged as a P3b
   design item.
7. P3b REMAINS GATED. wisp-js is AGPL-3.0 and that decision is still
   open; nothing here is public or hosted.

## What fought back

MY OWN TOOLING LIED TO ME TWICE, in the same session I was fixing a
harness that lied. The CR probe's end marker matched the shell's ECHO of
the command line, so waitFor returned before the output existed and
every "before" capture read as empty, which showed up as a bogus
"termios changed: YES". And the read probe compared against an exact
value, so it scored the CR-corrupted result as a plain failure and hid
the most interesting finding in the pass. Both are fixed in the
committed tools, and the corrupted-value case is now reported as its own
outcome rather than folded into "broken".

pkill KILLED MY OWN SHELL TWICE. `pkill -f` and `ps | grep` both match
the running command line, which contained the very pattern I was
matching on. Fixed by taking the listener's PID from `ss -ltnp`; the
PID recorded from `$!` was the wrapper, not the node process, which is
why the first attempt silently killed nothing and the test ran against a
relay that was still up.

THE FIRST BROWSER RUN'S REPORT ARRIVED AFTER MY POLL LOOP GAVE UP, so I
briefly had a "no report" that was actually a pass. Read the server log
before believing the absence of a file.

## Reproduce

  export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
  npm ci

  # item 4
  node tools/cr-boot.mjs kit/bzImage-p3 build/rootfs-temur.cpio.gz
  node tools/repro-cr.mjs build/state-p3-page.bin baseline
  node tools/repro-cr.mjs build/state-p3-page.bin tuiprobe

  # item 2
  node tools/run-guest.mjs kit/bzImage-p3 build/rootfs-temur.cpio.gz \
       build/steps-sentinel-proof.json

  # items 1 and 3
  python3 tools/mkcpio.py /tmp/o.cpio \
       artifacts/temur-v0.33.0-i686-unknown-linux-musl \
       usr/bin/temur-setkey=tools/guest/temur-setkey
  gzip -9 -c /tmp/o.cpio > /tmp/o.cpio.gz
  cat kit/rootfs.cpio.gz /tmp/o.cpio.gz > build/rootfs-temur-p4.cpio.gz
  node tools/run-guest.mjs kit/bzImage-p4 build/rootfs-temur-p4.cpio.gz \
       build/steps-helper-proof.json
  node tools/run-guest.mjs kit/bzImage-p4 build/rootfs-temur-p4.cpio.gz \
       build/steps-userns-proof.json

  # item 6 (relay must be running)
  node tools/relay.mjs &
  node tools/gen-steps-p4-page-snap.mjs
  node tools/run-guest-net.mjs kit/bzImage-p4 build/rootfs-temur-p4.cpio.gz \
       build/steps-p4-page-snap.json 128 wisp://127.0.0.1:8089/ \
       build/state-p4-page.bin

  # item 5
  sh tools/stage-page.sh
  node tools/serve-page.mjs 8088
  then open http://localhost:8088/?relaycheck=1 and stop the relay

HOLDING. Nothing further until desktop has reviewed this. P3b stays
gated on that review, the operator's authorization, and the AGPL
decision.
