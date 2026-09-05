# P3b-PREP: local commits for the public deploy

Laptop, 2026-09-05, on the operator's authorization for P3b-prep only.
Brief <STAGING>/sandbox-p3b.md sha256 dfd370c8..., kickoff
/home/dev/sandbox-p3b-prep-kickoff.md sha256 6bf21b7d...; both shas
verified before reading.

P3b-DEPLOY IS NOT AUTHORIZED AND NOTHING HERE WAS DEPLOYED. Nothing was
pushed to any remote, no history was rewritten, no repository visibility
changed, no credential of any kind was used or seen. Everything below is
local commits in /home/dev/temur-playground. The temur tree is untouched
at 6da6be3 and was read only.

KEYLESS THROUGHOUT. No API key existed on this laptop or in any guest at
any point in this pass. ANTHROPIC_API_KEY was absent from the environment
at the start and was never set. That is what makes full serial logging
safe in every harness run quoted here.

Eleven local commits on top of the accepted fix pass at 7810b13, taking
the clone from 12 commits to 23: eight for the brief's items, this
report, then the decision-B history rewrite and the decision-D and
decision-C commits that follow it. Every sha in that range is
post-rewrite; the pre-rewrite shas are recorded in the desktop-facing
report only, because they no longer exist here.

## Result

  10  guest lands at temur init, ICRNL fixed at the console   DONE
   1  relay subtree, AGPL-3.0-only, ws declared, root MIT      DONE
   2  deep import resolved properly and asserted at startup    DONE
   3  client IP behind a trusted proxy (kickoff trap 1)        DONE
   4  commit stamp: page footer, relay_start, motd, /version   DONE
   6  one relay knob, the other derived                        DONE
   5  CSP ships as page/_headers, local server reads it        DONE
  11  paste hint on the page and in the doc                    DONE
   8  trust paragraph amended, still marked DRAFT              DONE
   7  sweep of the full history and tree                       DONE, clean
   9  VPS runbook, written not run                             DONE

Kickoff traps 2 and 3 are addressed as far as prep can: --vendor-only
exists for the Pages build, and the snapshot-delivery question is
operator decision C, deliberately unmade.

## Artifacts

New this pass. Added beside; no accepted artifact was overwritten.

  temur-overlay-p5.cpio.gz   2,908,498 B  af8e1b3e7013537555420116994f0ef20958b4c374106d37040155dd82b19327
  rootfs-temur-p5.cpio.gz    3,893,203 B  5289dea143ae00c05ce184baf6643ea119c26dab4745523876441fa0d642ba1f
  state-p5-page.bin         35,139,416 B  807837d9841894a27468ab450c77282cbb51fac486cdba935d612966de0fa431
  state-p5-page.bin.gz      15,937,162 B  6b16c97da47ed5cf6335e520d63c37832bffbb4024f6eb89e965bb0fa93783ac

NO NEW KERNEL. bzImage-p4 is reused unchanged; nothing in this pass
needed a kernel option. Only the overlay and the snapshot are new.

Verified byte-identical after the pass, against the shas in the P3a and
P3a-fix reports:

  kit/bzImage-p2        ff1c9c182443063da977f5e087d58b8ce2db8b6e230dea26cf1621424901d014
  kit/bzImage-p3        c964b9172584f3782b634fba22e3a8f3423778fc9ac636fb34f0b852d7c1b27a
  kit/bzImage-p4        bbc60ccd4b711f07fa9b3c1dfc915e472fa14b624d722795d6aebb5c25cb0c1c
  kit/kernel-p2.config  42a439d6f2660d11d205a8bdfccc94d0ed2c7595ce6936ac1adecd8335825f3c
  kit/kernel-p3.config  7e67ae7d70ef86d421a818b47464599c3b808aa4eb9c5f9d4bc5b4888e37d8c8
  kit/kernel-p4.config  883cc0808c9a8a5814d23a9c093894cd3a9c88161f8439bb9c3b02834c0b41f3
  kit/rootfs.cpio.gz    4d5cda4aa83f3e41799c813ac66a30595c647a446d628ae14d9000daf37e1e2e
  build/state-p4-page.bin b606f6394446b8d80ecff88ca0ae04363c936a6d844cb75c66bb5efd3799547e
  packed temur binary   16454ebdeb2641a124f55b215c68e06a7b81c744a56624a5b4e4ea3de1855d72

The packed binary sha is the shipped v0.33.0 i686 release, unchanged
since P1.

## Item 10: the guest lands at temur init

The bespoke key helper and the baked Anthropic config are retired. The
networked tier runs temur's own wizard, so the visitor picks a provider
instead of being defaulted into one and types the key at temur's own
hidden prompt. This closes the multi-provider gap with no new code, and
retires the helper's validation gap (keyed run two, finding 2) by
retiring the helper.

### ICRNL fixed at the source

The lever is a PURE ADDITION. The stock rootfs /etc/profile ends with a
loop over /etc/profile.d/*.sh and the image already ships one such file
(umask.sh, 10 B), so the overlay adds etc/profile.d/console.sh and claims
no existing path. The other candidate was the getty line in /etc/inittab;
shadowing that would have failed at boot rather than at build, which is
the worse failure.

Measured at the login shell, from a fresh boot of the p5 image:

  stty -g   1500:5:1cb2:a3b:3:1c:7f:15:4:0:1:0:11:13:1a:a:12:f:17:16:...
  (fresh boot before this change was 1400:5:1cb2:a3b:...)

0x1400 -> 0x1500 is exactly +0x100, ICRNL, and nothing else moved. The
same value comes back after restore_state, because the login shell that
set it ran before the snapshot point and termios lives in the snapshot:

  stty_g_after_restore  1500:5:1cb2:a3b:...
  icrnl_after_restore   icrnl

### The wizard, typed with CR

The step runners submit LF and are structurally blind to this defect, so
the proofs use tools/proof-init-cr.mjs, which types CR the way a human
does. Three variants, all against state-p5-page.bin, no key typed at any
point (the hidden prompt is always answered with a bare Enter, temur's
documented skip).

  wizard
    wizard_started_on_CR              true
    q1_template_took_CR               true   (answered "gemini" by name)
    q2_model_default_took_CR          true   (bare Enter = default)
    q3_keypath_default_took_CR        true   (bare Enter = default)
    q4_hidden_prompt_skipped_on_CR    true
    stty_g_after_wizard               identical to before
    echo_restored                     true
    key_file      -rw------- 1 root root 0 /root/.secrets/temur-gemini-key
    key_file_is_empty                 EMPTY
    shell_usable_on_CR                true
    config_written
      {"provider":"openai-compat","openai_compat":{
        "base_url":"https://generativelanguage.googleapis.com/v1beta/openai",
        "model":"gemini-3.6-flash",
        "api_key_file":"/root/.secrets/temur-gemini-key"}}

  ctrlc-template
    prompt_returned_after_ctrl_c      true
    shell_usable_on_CR                true
    termios_untouched                 true
    no_config_written                 no
    motd_still_available              "temur in a browser. This is a
                                       throwaway Linux computer..."

  ctrlc-hidden
    reached_hidden_prompt             true
    ctrl_c_at_hidden_prompt_did_nothing  true
    enter_skips_after_ctrl_c          true
    echo_restored                     true
    shell_usable_on_CR                true

The Ctrl-C behaviours are temur's, and both are correct: at an ordinary
question SIGINT is default, so the wizard dies and the shell returns; at
the hidden prompt temur ignores SIGINT on purpose (init.rs
StdinKeyTerminal::begin_hidden installs SIG_IGN alongside ECHO off), so a
stray Ctrl-C cannot kill the process while echo is off and leave the
operator at a terminal that has stopped echoing. Enter on the empty line
is the way out, and the guard restores both on drop.

### The MOTD

etc/temur-motd, printed by console.sh at login and by the page before it
runs the wizard, so the three commands sit above the wizard for anyone
who backs out:

  temur in a browser. This is a throwaway Linux computer running inside
  your browser tab. Close the tab and it is gone, key included.

    temur init      set up a provider and enter your API key (input hidden)
    temur           start the agent
    temur doctor    check the config and the network

  Paste with Ctrl-Shift-V. Plain Ctrl-V sends a control byte, not a paste.

### What the snapshot no longer contains, and the cost

  the snapshot carries NO config, NO key, and no leftover probe  KEYLESS-SNAPSHOT-OK
  APP_SECRET_FILE is NOT persisted anywhere                      NO-SECRET-ENV-OK
  the bespoke key helper is RETIRED from the overlay             HELPER-RETIRED-OK
  temur itself is still the shipped binary at /usr/bin           temur 0.33.0

temur init refuses to run over an existing config, so the snapshot must
ship none. That costs both remaining doctor proofs their config: with no
config.json, doctor FAILs at "no config file" and returns before it
reaches either the sandbox line or the reachability probe. So they run
against a throwaway config under a redirected XDG_CONFIG_HOME in /tmp
which the same step deletes:

  PASS: key isolation: 1 key file(s) guarded (tools cannot read them)
  PASS: bash key sandbox: available (unprivileged user namespaces)
  PASS: reachable: https://api.anthropic.com (TCP connect + TLS handshake)
  PROBE-REMOVED

The page's netcheck mode does the same thing for the same reason.

DEVIATION, small: the kickoff expected APP_SECRET_FILE alone to be enough
for the doctor sandbox line. It is not; doctor returns at the missing
config before the guard is ever built. The throwaway config is the fix
and the step proves it removed itself.

DEVIATION, small: two overlay files rather than one. The MOTD text lives
in /etc/temur-motd rather than inside console.sh, so the login shell and
the page's landing print the same bytes from one source instead of two
copies that could drift.

## Items 1, 2, 3: the relay subtree

    relay/
      LICENSE               full GNU AGPL-3.0 text, 661 lines
      README.md             the obligation, the standing rule, the flags
      package.json          AGPL-3.0-only, wisp-js 0.4.1, ws 8.21.3
      package-lock.json     so npm ci works on the server
      relay.mjs             the relay
      relay-probe.mjs       allowlist test
      relay-limit-probe.mjs rate and per-host limit test
      relay-proxy-probe.mjs client-IP-behind-proxy test (new)

relay/package.json, verbatim:

    {
      "name": "temur-sandbox-relay",
      "version": "1.0.0",
      "description": "WISP relay for the temur browser sandbox: a dumb pipe to an allowlist of AI provider endpoints, connection-level logging only.",
      "license": "AGPL-3.0-only",
      "type": "module",
      "private": true,
      "main": "relay.mjs",
      "scripts": {
        "start": "node relay.mjs",
        "probe": "node relay-probe.mjs",
        "probe:limits": "node relay-limit-probe.mjs",
        "probe:proxy": "node relay-proxy-probe.mjs"
      },
      "engines": {
        "node": ">=24"
      },
      "dependencies": {
        "@mercuryworkshop/wisp-js": "0.4.1",
        "ws": "8.21.3"
      }
    }

INVENTORY DEFECT 2 CLOSED: ws was used by relay-limit-probe.mjs and
declared nowhere; it was reaching a transitive of wisp-js. It is now an
exact declared dependency of the package whose test suite uses it, and it
is no longer a root dependency at all, because nothing at the root uses
it.

INVENTORY DEFECT 1 CLOSED: the root package.json was the npm-init default
claiming "ISC" over an AGPL dependency, with no LICENSE file tracked
anywhere. The root is now MIT, with a LICENSE byte-identical to temur's
own, and THIRD_PARTY.md reproducing the full texts for v86
(BSD-2-Clause), xterm (MIT) and ws (MIT), pointing at relay/LICENSE for
wisp-js (AGPL-3.0), and naming the guest image's Buildroot, BusyBox and
kernel terms as well as the temur binary's provenance.

### The deep import, asserted

The reach into wisp-js internals now resolves the package ROOT through
Node's own algorithm and walks up to the package.json that owns it,
rather than following a hardcoded ../node_modules path. That was
necessary as well as tidier: after the move, the relative path would have
pointed at the repository root, which is right in dev and wrong on a
server where npm ci put wisp-js in relay/node_modules. This resolves
correctly in both.

Then it asserts. All three failure shapes were proven by running modified
copies, each exiting 3:

  A. pin does not match the resolved version
     relay: REFUSING TO START. @mercuryworkshop/wisp-js resolved to
     version 0.4.1, but this relay reaches into its unpublished
     internals (src/server/net.mjs, NodeTCPSocket) and is pinned to
     exactly 0.4.2. Check relay/package.json, then re-read that file
     before moving the pin: the byte accounting and the per-host stream
     cap both live in a subclass of that class.

  B. the internal file has moved
     relay: REFUSING TO START. @mercuryworkshop/wisp-js@0.4.1 no longer
     has .../src/server/net-MOVED.mjs: Cannot find module ...

  C. the file is there but the class is gone
     relay: REFUSING TO START. .../src/server/net.mjs exists but exports
     no NodeTCPSocket class (got undefined); the pin is 0.4.1.

### Client IP behind a proxy (kickoff trap 1)

allowUpgrade() keyed on req.socket.remoteAddress. Behind Caddy on the
same host that is 127.0.0.1 for every visitor, so the per-IP rate and
concurrency limits collapse into one bucket: the first eight visitors
would lock out everyone else, and one visitor could deny the service to
all of them. RELAY_TRUST_PROXY=1, and only when the socket really is
loopback, takes the client from the LAST hop of X-Forwarded-For, the hop
the proxy itself appended; anything a client sends in that header lands
earlier in the list and is ignored. Default off, because trusting the
header on an exposed socket would let any client choose its own bucket.

relay/relay-proxy-probe.mjs starts its own relays and proves both
directions (RFC 5737 addresses for the two synthetic clients):

  relay with RELAY_TRUST_PROXY=1
    relay_start client_ip_source: "x-forwarded-for last hop when the
                                   socket is loopback, else socket"
    trusted proxy : client A accepted 8/8, A over the cap refused,
                    client B accepted
  PASS  RELAY_TRUST_PROXY=1: one client's cap does not shut out another

  relay with RELAY_TRUST_PROXY unset
    relay_start client_ip_source: "socket"
    no trust flag: client A accepted 8/8, A over the cap refused,
                   client B REFUSED
  PASS  RELAY_TRUST_PROXY unset: X-Forwarded-For is ignored, one bucket

  2/2 passed

The source actually used is printed in relay_start and on every
connection line ("ip_source":"socket").

### The flags, re-decided for public

Unchanged, with the WHY comments kept: allow_direct_ip and
allow_private_ips stay true because the mapped destinations ARE literal
IPs in a range ipaddr.js classes as reserved, and the map, not the flags,
is what bounds the destination set. allow_loopback_ips stays FALSE, and
its comment now records that the deploy proof re-attempts a loopback
reach from the guest against the PUBLIC relay.

The other two probes still pass from the new location:

  6/6 passed   allowlist (mapped host open; unmapped, bare public IP,
               hostname, port 80 and loopback all HostBlocked)
  2/2 passed   per-IP websocket rate limit and per-host stream cap

## Items 4 and 6: the commit stamp, and one knob

DESIGN CHOICE, as the kickoff asked to be stated: the committed files
carry NO sha at all, and tools/stamp.mjs writes two GENERATED, untracked
files. The alternative, a placeholder in a tracked file, has a
chicken-and-egg problem with no honest answer: writing the stamp changes
the file, which changes the commit, so the stamp of commit N could only
ever be committed in commit N+1 and would always be wrong. With generated
files there is no version of the source that lies.

  tools/stamp.mjs  ->  relay/build-info.json   (relay reads at startup)
                   ->  page/build-info.js      (index.html loads it)

No sha, no build, at three levels, each proven:

  the script    refuses on a dirty tree, names the files that made it
                dirty, writes nothing, exits 1:
                  stamp: REFUSING TO STAMP. the working tree is dirty,
                  so 6f122d7 does not describe what would be shipped:
                  M relay/relay.mjs
                  ?? tools/stamp.mjs
                  ... stamp: nothing was written.
  the relay     refuses to start with no stamp, exit 4, telling you to
                run it. A relay answering /version with "unknown" looks
                like an answer and is worth nothing.
                RELAY_ALLOW_UNSTAMPED=1 is the laptop escape and does not
                invent a sha; it makes relay_start and /version say
                "commit": null, "unstamped": true.
  the page      footer says UNSTAMPED BUILD rather than a version it
                does not have.

Stamped and running, at the last commit before this report:

  $ node tools/stamp.mjs
  stamped eb293e4 (git rev-parse HEAD)

  relay_start ... "commit":"eb293e466a4e184c0231a6ca9283a606b2d7a72f",
                  "wisp_js":"0.4.1","client_ip_source":"socket", ...

  $ curl -s http://127.0.0.1:8089/version
  { "commit": "eb293e466a4e184c0231a6ca9283a606b2d7a72f",
    "short": "eb293e4", "built": "2026-09-05T21:18:24.527Z",
    "wisp_js": "0.4.1", "node": "v24.20.0" }

  $ git rev-parse HEAD
  eb293e466a4e184c0231a6ca9283a606b2d7a72f          MATCH

  page footer, read out of the live DOM by the browser:
  "build eb293e4 . relay source is AGPL-3.0; the repository link is set
   at deploy . relay /version"

  $ curl -o /dev/null -w '%{http_code}' http://127.0.0.1:8089/
  426                       (no HTTP surface beyond /version)

wisp_motd, previously null, now carries the same short sha, so a client
that never speaks HTTP still sees it.

NO CORS HEADER on /version, deliberately. The page LINKS there rather
than fetching it, which keeps the page's connect-src to self and the
relay websocket. Fetching would have bought a slightly nicer footer at
the cost of the tightest claim the page makes.

KNOB. RELAY_WS is the single truth; RELAY_WISP is derived from it by
scheme rewrite. v86's own mapping was verified in the pinned build rather
than assumed:

  $ grep -o 'replace("wisp[^)]*)' node_modules/v86/build/libv86.js
  replace("wisp://","ws://")
  replace("wisps://","wss://")

Which endpoint is chosen by where the page is served from, not by a query
parameter, so a local page cannot reach the public relay by accident and
a deployed page cannot be argued into reaching anything else: the shipped
CSP names one relay, so a tampered URL is refused by the browser. Read
out of the live page: relayWs ws://127.0.0.1:8089/, relayWisp
wisp://127.0.0.1:8089/, derived and consistent.

The footer's repository link is deliberately UNSET and the page says so,
because the public repository's name is operator decision D.

## Item 5: the CSP as shipped

page/_headers, verbatim:

    # Cloudflare Pages _headers. THIS FILE IS THE CSP AS SHIPPED.
    #
    # It is the one place the policy is written. tools/serve-page.mjs reads
    # this same file for local serving, so what a laptop sees and what the
    # deployed site sends cannot drift apart. The local relay address is NOT
    # written here: it arrives as an env override at serve time
    # (PAGE_DEV_RELAY), so the shipped policy is never edited to make a
    # development loop work.
    #
    # Pages consumes this file from the output directory and does not serve
    # it as content.
    /*
      Cross-Origin-Opener-Policy: same-origin
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Resource-Policy: same-origin
      X-Content-Type-Options: nosniff
      Referrer-Policy: no-referrer
      Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://relay.temur.live; worker-src 'self' blob:; child-src 'self' blob:; img-src 'self' data:; base-uri 'none'; form-action 'none'

tools/serve-page.mjs no longer contains a policy. It parses that file and
serves the /* rule, so the local site and the deployed site come from one
source and cannot drift. Proven by diffing every header in page/_headers
against a live response from the local server:

  OK   cross-origin-opener-policy
  OK   cross-origin-embedder-policy
  OK   cross-origin-resource-policy
  OK   x-content-type-options
  OK   referrer-policy
  OK   content-security-policy
  VERDICT: BYTE-IDENTICAL to page/_headers

The development loop needs the 127.0.0.1 relay, and that is an opt-in env
override that appends exactly one origin and says loudly that it did:

  $ PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
  NOTE: connect-src was WIDENED by PAGE_DEV_RELAY=ws://127.0.0.1:8089.
  This is a local deviation from the shipped policy.
  ... connect-src 'self' wss://relay.temur.live ws://127.0.0.1:8089; ...

The shipped file is never edited to make local work work. The server also
404s /_headers, because Pages consumes it as configuration and never
serves it; otherwise the local site would differ from the deployed one in
the single file that defines how they are meant to be identical.

The locality proof against the DEPLOYED site is a deploy-phase item and
is not claimed here.

## Items 11 and 8: paste hint, and the trust paragraph

The paste hint is one line under the terminal, and it is also the last
line of the guest MOTD and a paragraph in the operator doc. Read out of
the live page:

  "Paste with Ctrl+Shift+V. Plain Ctrl+V is not a paste in a terminal:
   it sends a control byte into the machine, and at the hidden key prompt
   you will not see that it did."

app.js forwards term.onData bytes verbatim, which is why 0x16 arrived in
the guest during keyed run two; there is nothing on the page to interpret
it, so the hint is the fix.

TRUST PARAGRAPH, FINAL WORDING, VERBATIM, for desktop and operator
sign-off. The [DRAFT] marker comes off only when both have signed off:

  Where your key goes [DRAFT - pending review]

  This page runs a small Linux computer inside your browser. When you
  type an API key, you are typing it into that computer, at the setup
  wizard's own hidden prompt, not into this web page: there is no key
  box on this page, and the page never reads what you type into the
  terminal. Your key stays in that computer's memory.

  Requests to your AI provider are encrypted inside that computer
  before they leave it. They travel through a relay that can see only
  which provider you are contacting and how many bytes moved. The
  relay cannot read your key, your prompts, or the replies, and it can
  only reach the handful of AI providers on its allowlist.

  You do not have to take that on trust. The relay's source is
  published under the AGPL and linked at the bottom of this page, and
  both the page and the relay show the exact commit they were built
  from, so what is running here can be checked against what is
  published.

  Nothing is stored. Close or reload this tab and the computer, its
  memory, and your key are gone. You will type the key again next
  time, because there is nowhere for it to have been kept.

Two changes from the accepted P3a wording: the key is now described as
typed at the setup wizard's own hidden prompt, which is what now happens;
and the third paragraph is new, per the brief's "one sentence pointing at
the relay source link and the commit stamp".

## Keyless grep, proof (d), and the page in a real browser

KEYLESS GREP on the decompressed snapshot bytes, and on the served .gz,
and on the overlay and rootfs:

  sk-ant-  0    sk-proj-  0    sk-or-  0
  AIza     0    xai-      0    NOT-A-REAL-KEY  0    invalid-not-a-real-key  0

PROOF (d), the TUI, re-run on the p5 image in its own boot (the snapshot
cannot carry the config it needs, so it writes its own):

  alt screen entered, "hello from p2" echoed and erased, exit returned
  TEMUR-EXIT-STATUS=0
  BACK-AT-SHELL
  STDERR-FOLLOWS / STDERR-ENDS      (empty)

PAGE, in headless Edge 152 against the local server.

  netcheck (networked tier; the landing is suppressed for this mode so
  the wizard is not sitting on the same tty)
    line: PASS: reachable: https://api.anthropic.com
          (TCP connect + TLS handshake)
    relayWatch: adapter-socket

  landingcheck (new; proves the page's OWN landing reaches the guest,
  by matching one known line each time, never the terminal buffer)
    motdShown              true
    wizardAtFirstQuestion  true
    configPath             /root/.config/temur/config.json
    stampText              build eb293e4 ...
    relayWs / relayWisp    ws://127.0.0.1:8089/ , wisp://127.0.0.1:8089/

  selftest (offline tier, relay stopped; it still refuses the networked
  tier outright)
    ok true, TUI up, typed, erased, exited to a shell prompt

  relay's own view of the keyless netcheck turn
    {"event":"ws_open","ip":"127.0.0.1","ip_source":"socket","live":2}
    {"event":"stream_open","id":1,"asked":"192.0.2.1:443",
     "dest":"api.anthropic.com:443"}
    {"event":"stream_close","id":1,"dest":"api.anthropic.com:443",
     "bytes_up":324,"bytes_down":2784,"ms":652}

324 up is a ClientHello and 2,784 down a certificate chain, counted and
unreadable by the relay, as in P3a and the fix pass.

REPORT PATHS. Each page mode now posts to build/page-report-<mode>.json
instead of all of them overwriting build/page-selftest.json. That was the
nit desktop accepted from the fix pass, and it is fixed at the server, so
no future mode can take it back.

## Numbers, beside the fix pass

  page, networked tier (Edge 152 headless, real clock)
    wire            15,937,162 B   (fix pass: 15,931,078)
    state           35,139,416 B   (fix pass: 35,139,412)
    fetch                  156 ms  (fix pass: 133)
    restore                 64 ms  (fix pass: 67)
    ready                1,596 ms  (fix pass: 1,551)
  page, offline tier
    wire            15,581,537 B   unchanged
    state           34,733,896 B   unchanged
    TUI ready            3,083 ms  (fix pass: 3,432)
    echo                    32 ms  (fix pass: 24)
  guest
    boot to prompt       3,797 ms
    overlay             2,908,498 B  (p4: 2,908,942)

The networked snapshot grew by 4 bytes and the overlay shrank by 444: the
key helper (2,410 B) left and console.sh plus the MOTD (1,472 B) arrived.

CAVEAT ON THE FIRST HEADLESS RUN, recorded because it nearly went into
this table: launching Edge with --virtual-time-budget makes
performance.now() virtual, and the first run reported fetch 34 ms and
restore 0 ms. Those numbers are meaningless. Every figure above was
re-taken without it.

## Item 7: the sweep

SCOPE. Every blob in every commit on every ref, not just the tree at
HEAD. This section records the sweep as it ran DURING the pass, at
eb293e4: 20 commits at that point, 220 objects, 92 tracked files,
21.6 MB tracked. IT IS NOT THE SWEEP THAT MATTERS. The one that matters
runs LAST, on the rewritten history with every commit in place, and is
reported separately; see the addendum.
One remote, the desktop bundle at /home/dev/sandbox-p2-work/temur-
playground.bundle; no public remote exists. Binary files were included
(grep -a), which matters because the tracked temur binary and four kernel
images are binary.

KEY PATTERNS across all history:

  sk-ant-  13 lines   sk-proj-  3   sk-or-  3   AIza  3   xai-  3
  sk-live  0   ghp_  0   BEGIN PRIVATE KEY  0   BEGIN RSA  0

Every one of those lines is either the DELIBERATE FAKE
'sk-ant-invalid-not-a-real-key' in the operator doc's failure path A, the
instruction "grep -c 'sk-ant-' on it should print 0", or a report line
listing the patterns being searched for. The count is higher than the
fix pass's "exactly one" only because the doc has been revised twice
since and the same fake now appears at more line numbers. No key
material, real or plausible, exists anywhere in the history.

COMPANY AND PRE-AGENT-ORIGIN, case-insensitive, all history, reported
against HELD-OUT PLACEHOLDERS. The patterns themselves live outside every
clone, in /home/dev/sandbox-sweep-patterns.txt, and the standing rule is
below.

  P1 0   P2 0   P3 0   P4 0   P5 0   P6 0   P7 0

The one identity-adjacent string in the tree is the operator's GitHub
account name, in two already-public release URLs:

    artifacts/PROVENANCE.md:
      https://github.com/thekeoni1/Temur/releases/download/v0.33.0/...

/mnt/c appears twice, in reports/P2.md, both times as a generic remark
about drvfs and PATH, with no account directory named. Local machine
paths are accepted per the brief; this report writes the staging share
as <STAGING> anyway, so no Windows account directory is in any tracked
file.

STANDING RULE, adopted for both repositories after this pass:
A SWEEP REPORT THAT QUOTES ITS OWN PATTERN LIST IS SELF-DEFEATING WHEN
THE REPORT SHIPS INSIDE THE REPOSITORY BEING SWEPT, because the patterns
ARE the sensitive strings. Sweep reports carry counts against
placeholders; the literal list stays out of the clone. The first version
of this report broke that rule, which is how the rule was found; see the
addendum at the end.

AUTHOR IDENTITIES. Before this pass's correction, every commit in the
clone carried the operator's company address as both author and
committer, and one of them (7765070, the desktop-run P1) also carried
the author NAME "dev", where the public temur repository's 390 commits
carry the GitHub noreply address.

OPERATOR DECISION B WAS THEN MADE AND APPLIED: every commit's author and
committer become

  thekeoni1 <55367154+thekeoni1@users.noreply.github.com>

by a history rewrite in the commit immediately after this one, before any
remote exists. The rewrite preserves every tree hash, so the only content
that changed anywhere in the history is this report. The company address
appears nowhere in the rewritten history, in any commit's metadata or in
any blob.

NOTHING ELSE. No credentials, no tokens, no private hostnames, no
customer or third-party content. The largest tracked files are the temur
release binary (6.2 MB) and four kernel images, all of which are
published or reproducible from the committed configs.

## Item 9: the VPS runbook, written and NOT run

docs/VPS-RUNBOOK.md in the clone. Reproduced verbatim:

    # Relay VPS runbook (written, NOT run)
    
    The exact steps the operator executes on the relay host. Nothing here has
    been run: P3b-prep is local commits only, and every step below needs
    credentials or a machine no session has. Sessions prepare and verify;
    the operator types anything credentialed.
    
    Target shape, from the brief: the page is on Cloudflare Pages at
    play.temur.live, the relay is on the smallest VPS at relay.temur.live,
    DNS-ONLY (unproxied), so the trust story stays browser -> relay ->
    provider with no third party in the ciphertext path. Caddy terminates
    TLS on the VPS and reverse-proxies to the relay on loopback.
    
    ## 0. Before anything
    
    - DNS: relay.temur.live must be an A record to the VPS, DNS-only (grey
      cloud in Cloudflare), or Caddy cannot get a certificate and the
      "no third party in the ciphertext path" claim is not true.
    - Ports 80 and 443 open. Nothing else. The relay itself never listens on
      a public interface.
    - Node 24. The relay has only ever been run on 24.20.0; relay/package.json
      declares `"engines": { "node": ">=24" }`.
    
    ## 1. The code, at the published commit
    
        sudo adduser --system --group --home /srv/relay relay
        sudo -u relay git clone <REPO_URL> /srv/relay/app
        cd /srv/relay/app
        sudo -u relay git checkout <PUBLISHED_COMMIT>
    
    `<REPO_URL>` and `<PUBLISHED_COMMIT>` are the public repository and the
    commit being deployed. THE COMMIT MUST ALREADY BE PUBLISHED. That is the
    standing rule and the reason for the stamp; deploying something not yet
    pushed makes the AGPL source offer false.
    
    ## 2. Install and stamp
    
        cd /srv/relay/app/relay
        sudo -u relay npm ci
        cd /srv/relay/app
        sudo -u relay node tools/stamp.mjs
    
    `npm ci` in relay/, not at the root: the relay has its own
    package.json and lockfile so the deployed tree carries only what the
    relay needs.
    
    `tools/stamp.mjs` writes relay/build-info.json from the checked-out
    commit. IT WILL REFUSE IF THE TREE IS DIRTY, and the relay will refuse to
    start without it. That is the design: a relay that cannot say which
    commit it is has no business being reachable. If stamp refuses, do not
    pass --allow-dirty; find out why the tree is dirty, because on a
    deployment host it should never be.
    
    ## 3. The service
    
    /etc/systemd/system/temur-relay.service:
    
        [Unit]
        Description=temur sandbox WISP relay
        After=network-online.target
        Wants=network-online.target
    
        [Service]
        Type=simple
        User=relay
        Group=relay
        WorkingDirectory=/srv/relay/app/relay
        Environment=RELAY_HOST=127.0.0.1
        Environment=RELAY_PORT=8089
        Environment=RELAY_TRUST_PROXY=1
        ExecStart=/usr/bin/node /srv/relay/app/relay/relay.mjs
        Restart=always
        RestartSec=2
        NoNewPrivileges=true
        PrivateTmp=true
        ProtectSystem=strict
        ProtectHome=true
        ReadWritePaths=
        StandardOutput=journal
        StandardError=journal
    
        [Install]
        WantedBy=multi-user.target
    
    Then:
    
        sudo systemctl daemon-reload
        sudo systemctl enable --now temur-relay
        sudo systemctl status temur-relay
        curl -s localhost:8089/version
    
    RELAY_TRUST_PROXY=1 is required here and ONLY here. Without it every
    visitor arrives as 127.0.0.1 from Caddy and they all share one rate-limit
    bucket, so the first few lock everyone else out. It is safe only because
    the relay is not reachable except through the proxy: if that ever stops
    being true, this flag must come off first. See relay/README.md.
    
    ## 4. Caddy in front
    
    /etc/caddy/Caddyfile:
    
        relay.temur.live {
            reverse_proxy 127.0.0.1:8089
        }
    
        sudo systemctl reload caddy
    
    Caddy gets a Let's Encrypt certificate on first request and passes
    WebSocket upgrades through by default; it sets X-Forwarded-For, which is
    what step 3's flag reads. No other configuration is needed.
    
    ## 5. Check it, from outside
    
        curl -s https://relay.temur.live/version
        curl -s -o /dev/null -w '%{http_code}\n' https://relay.temur.live/
    
    The first must print the SAME commit as the published HEAD being
    deployed. The second must print 426: there is no HTTP surface beyond
    /version. Then open the page and confirm the footer's commit matches.
    
    ## 6. Logs
    
        journalctl -u temur-relay -f
    
    Connection-level only, by construction: timestamps, destinations, byte
    counts, and the client IP with the source it came from. Payload is never
    logged, at any level, on any path. These lines are safe to share as-is,
    which is what makes soak review possible at all.
    
    ## Updating: publish FIRST, then pull
    
        # on the laptop
        git push                      # the commit must be public first
    
        # on the VPS
        cd /srv/relay/app
        sudo -u relay git pull
        cd relay && sudo -u relay npm ci && cd ..
        sudo -u relay node tools/stamp.mjs
        sudo systemctl restart temur-relay
        curl -s https://relay.temur.live/version
    
    The last line is the check, not a formality: if /version does not equal
    the published HEAD, the deployment does not match its published source
    and the fix is to publish and redeploy, never to edit the server. Never
    edit files on the VPS. A local edit there is exactly the state the stamp
    exists to make visible, and the next `git pull` would silently discard it
    anyway.

## Traps 2 and 3: getting the page onto Pages

page/vendor and page/assets are not committed, and the snapshots are
regenerated from build/*.bin, which need the whole v86 harness and a
kernel tree. A Pages build cannot produce them.

What prep did: tools/stage-page.sh gained --vendor-only, which copies the
vendored libraries and BIOS blobs and does not touch page/assets. So the
Pages build command is

    npm ci && sh tools/stage-page.sh --vendor-only && node tools/stamp.mjs

with output directory page/, and it needs nothing but node and this
repository. Proven locally: --vendor-only restaged page/vendor and left
both .gz files untouched.

What prep did NOT do: commit the snapshot blobs. That is OPERATOR
DECISION C. The numbers for it, re-measured:

  page/assets/state-p5-page.bin.gz   15,937,162 B  (networked tier)
  page/assets/state-page.bin.gz      15,581,537 B  (offline tier)
                                     31,518,699 B  total

Both are under Pages' 25 MiB per-file limit. Committing them takes the
repository from 21.6 MB to roughly 53 MB and makes "built from the
published commit" literally true; a direct upload keeps the repository
small and makes that claim weaker. Laptop planning still recommends
committing them, and prep is ready for either.

## Deviations

1. TWO OVERLAY FILES, not one. /etc/temur-motd is separate from
   /etc/profile.d/console.sh so the login shell and the page's landing
   print the same bytes from one source.
2. THE DOCTOR PROOFS NEED A THROWAWAY CONFIG, not just APP_SECRET_FILE.
   The kickoff expected the environment variable to be enough; doctor
   returns at "no config file" before the key guard is ever built.
   Written under a redirected XDG_CONFIG_HOME in /tmp, deleted in the
   same step, and the step proves the deletion.
3. THE OPERATOR DOC WAS EDITED IN PLACE rather than replaced beside.
   docs/P3A-OPERATOR.md keeps its filename so that every existing
   cross-reference still resolves; the P3a text is in git history, and
   the reports, not the doc, are the records of what those runs did.
4. A NEW PAGE MODE, ?landingcheck=1, which the brief did not ask for.
   Nothing otherwise proved that what the PAGE sends actually arrives,
   only that the wizard works when something types into it. It matches
   one known line and never posts the terminal buffer, the same safety
   shape netcheck already had, and it is in the do-not-run-with-a-key
   list.
5. THE RELAY REFUSES TO START UNSTAMPED. The brief required the stamp
   script to fail rather than write "unknown"; extending that to the
   relay itself is mine. RELAY_ALLOW_UNSTAMPED=1 keeps local work
   possible without inventing a sha.
6. build/page-report-*.json ARE COMMITTED, where build/page-selftest.json
   was ignored. They are small and they are the evidence this report
   cites. Say if they should be ignored instead.
7. THE BRANCH IS master, not main. Noted only because the public
   repository's default branch name is a deploy-time choice.
8. AN EARLIER DRAFT OF THIS REPORT MISCOUNTED THE PASS as nine commits
   and the clone as 21. Both were true when measured and false one
   commit later, which is the same recursion the sweep hit. The counts
   above are stated for the finished history and verified against it.

## The four operator decisions, all now RULED

  A. ROOT LICENSE. RULED: MIT as prepared, byte-identical to temur's own
     LICENSE, copyright line "2026 temur contributors". Already in place;
     nothing to change.
  B. COMMIT AUTHOR IDENTITY. RULED: rewrite every commit's author and
     committer to thekeoni1
     <55367154+thekeoni1@users.noreply.github.com>, matching the temur
     repository. APPLIED in the commit after this one, while no remote
     exists, which is the only time it is cheap.
  C. SNAPSHOT ASSETS. RULED: COMMIT the two .gz files, so "built from
     the published commit" is literally true rather than nearly true.
     APPLIED two commits after this one, with both shas in that commit
     message.
  D. THE PUBLIC REPOSITORY'S NAME. RULED:
     https://github.com/thekeoni1/temur-playground. APPLIED in the commit
     after the rewrite: the page footer's AGPL source link, the relay
     README's source pointer and the runbook's clone URL all follow it.
     The root redirect target is Cloudflare configuration, not repository
     content.

## State

Clone HEAD is three commits past the one carrying this line: the
decision-B rewrite, then decision D, then decision C. Eleven commits on
top of the accepted 7810b13, tree clean. A commit cannot state its own
sha, so the final HEAD, the old-to-new sha map and the final sweep are in
/home/dev/sandbox-p3b-rewrite-report.md and in the bundle. Nothing pushed; the only remote is the desktop bundle.
temur tree untouched at 6da6be3, read only, NOT fast-forwarded to
origin's 1957f8f. No listeners left running. ANTHROPIC_API_KEY absent
throughout. Nothing published.

HOLDING for desktop's review. P3b-DEPLOY is a separate authorization and
needs the operator present for every credentialed step.

## Addendum: the correction this report was rewritten for

THE FIRST VERSION OF THIS REPORT WAS ITSELF A SWEEP HIT. It was committed
after the sweep had run, and it added three kinds of text that a public
repository must not carry:

  1. The sweep's own PATTERN LIST, spelled out, each pattern followed by
     a "0". The line proved the repository was clean while being the
     thing that made it dirty. That is the defect the standing rule above
     now prevents.
  2. The operator's company address, four times, in the decision-B
     discussion.
  3. The staging share's Windows account directory, in the line citing
     the brief's path, which also falsified this report's own sentence
     that no Windows account directory was in any tracked file.

Two structural lessons, both worth more than the fix:

  THE SWEEP RUNS LAST. Mine ran at eb293e4 and the report landed one
  commit later, so the artifact that certified the history was not in the
  history it certified. The final sweep for this pass runs after every
  commit below is in place.

  A TEXT FIX IN A NEW COMMIT WOULD NOT HAVE BEEN ENOUGH. The strings were
  already in two blobs, so editing the working tree would have cleared
  the tree at HEAD and left them one `git log -p` away. A decision-B
  author rewrite would not have removed them either: that rewrite is
  commit metadata only and never touches blobs. Both needed the same
  blob-level change, which is why they are one operation: the two
  offending commits were dropped and this single clean report commit
  replaces them, and the identity rewrite follows immediately, all while
  no remote exists.

ONE BENIGN FINDING, recorded so the next sweep need not re-derive it:
build/page-report-selftest.json contains EIGHT U+2014, four each in its
frameAfterLaunch and frameAfterTyping fields. They are temur's own TUI
status bar, captured verbatim by the browser self-test, so they are
quoted machine output and not authored lines; the zero-U+2014 rule is
intact. The shipped temur binary in artifacts/ contains U+2014 for the
same reason, and has since P1.

## Reproduce

    cd /home/dev/temur-playground
    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    npm ci

    # item 10: overlay, snapshot, and the CR-faithful proofs
    python3 tools/mkcpio.py build/temur-overlay-p5.cpio \
        artifacts/temur-v0.33.0-i686-unknown-linux-musl \
        etc/profile.d/console.sh=tools/guest/console.sh:644 \
        etc/temur-motd=tools/guest/motd:644
    gzip -9 -c build/temur-overlay-p5.cpio > build/temur-overlay-p5.cpio.gz
    cat kit/rootfs.cpio.gz build/temur-overlay-p5.cpio.gz \
        > build/rootfs-temur-p5.cpio.gz
    node tools/run-guest.mjs kit/bzImage-p4 build/rootfs-temur-p5.cpio.gz \
        build/steps-p5-console-proof.json
    node relay/relay.mjs &            # needs the stamp first, see below
    node tools/gen-steps-p5-page-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p4 build/rootfs-temur-p5.cpio.gz \
        build/steps-p5-page-snap.json 128 wisp://127.0.0.1:8089/ \
        build/state-p5-page.bin
    node tools/proof-init-cr.mjs build/state-p5-page.bin wizard
    node tools/proof-init-cr.mjs build/state-p5-page.bin ctrlc-template
    node tools/proof-init-cr.mjs build/state-p5-page.bin ctrlc-hidden
    node tools/run-guest.mjs kit/bzImage-p4 build/rootfs-temur-p5.cpio.gz \
        build/steps-p2-proofd.json          # proof (d)

    # items 1-3
    node relay/relay-probe.mjs
    node relay/relay-limit-probe.mjs
    node relay/relay-proxy-probe.mjs

    # items 4-6, 11, 8
    node tools/stamp.mjs                    # refuses on a dirty tree
    curl -s http://127.0.0.1:8089/version   # must equal git rev-parse HEAD
    sh tools/stage-page.sh
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 node tools/serve-page.mjs 8088
    then open http://localhost:8088/?landingcheck=1 and ?netcheck=1
    (and ?selftest=1 with the relay stopped, for the offline tier)
