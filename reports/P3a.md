# Sandbox v1, P3a: BYO-key networking, entirely local

2026-09-05, laptop. LOCAL ONLY. Nothing is deployed, exposed beyond
127.0.0.1, or published. The temur repo was not touched: it stayed at
6da6be3, clean, throughout, and no temur code was changed.

The implementing session never saw, typed, stored, logged or read an API
key. The keyed steps are the operator's and are written up in
docs/P3A-OPERATOR.md; at the time of writing they have not been run, so
this report marks them OUTSTANDING rather than claiming them.

## Result

Everything except the keyed steps is done and proven.

The headline is the KEYLESS end-to-end proof: from inside a real browser,
temur in the guest completes a full TLS handshake with the real
api.anthropic.com, through the relay, using its own baked roots, before
any key exists anywhere:

    PASS: reachable: https://api.anthropic.com (TCP connect + TLS handshake)

and the relay's own log for that moment, which is the whole trust story in
one line:

    {"event":"stream_open","id":1,"asked":"192.0.2.1:443","dest":"api.anthropic.com:443"}
    {"event":"stream_close","id":1,"dest":"api.anthropic.com:443","bytes_up":324,"bytes_down":2783,"ms":2426}

324 bytes up is a ClientHello, 2783 down is a certificate chain. The relay
counted them and could read none of them.

## THE DESIGN CHANGED. Read this first.

The kickoff's networking plan cannot work as written, for a reason that is
in v86's source rather than in anything we did. Both facts below were
found by reading the pinned build, not inferred from behaviour.

1. v86's WISP adapter NEVER SENDS HOSTNAMES. Its CONNECT frame is built as

       send_wisp_frame({type:"CONNECT", stream_id:..., 
                        hostname: b.ipv4.dest.join("."), port: a.sport, ...})

   The "hostname" field is the destination IPv4 address off the packet
   header, always, in both dns_method modes. So "prove the relay sees
   hostnames in its connection log" is not achievable with this adapter,
   and a hostname allowlist has nothing to match on.

2. dns_method "static" answers EVERY A QUERY WITH ONE CONSTANT:

       case 1: d.push({name: m.name, type: m.type, class: m.class,
                       ttl: 600, data: [192,168,87,1]})

   Every hostname collapses to 192.168.87.1, which is neither
   distinguishable nor reachable. Observed first as a live failure: the
   guest resolved api.anthropic.com to 192.168.87.1, the relay was asked
   for 192.168.87.1:443, refused it correctly, and temur reported "TLS
   handshake failed: unexpected end of file".

The kickoff's remaining option, dns_method "doh", is worse for this phase:
it resolves real addresses by doing DNS-over-HTTPS from the PAGE to
cloudflare-dns.com (the endpoint constant is in the build), which is
off-box egress P3a forbids, and it still gives the relay bare IPs.

So the guest is given NO DNS AT ALL, and /etc/hosts pins each allowed API
hostname to one address in 192.0.2.0/24 (RFC 5737 TEST-NET-1: reserved for
documentation, never globally routable, so it cannot collide with a real
destination). The relay holds the reverse map and dials the real hostname.

    192.0.2.1 -> api.anthropic.com
    192.0.2.2 -> api.openai.com
    192.0.2.3 -> generativelanguage.googleapis.com
    192.0.2.4 -> api.x.ai

THE SPEC ALREADY ALLOWED THIS: "/etc/hosts pins the API hostnames to the
gateway-side mapping". The KICKOFF forbade it, on the grounds that "the
adapter's DNS answer is what lets it forward the hostname to the relay" -
and that mechanism does not exist. The spec is authoritative and the spec's
own option is what works, so that is what was built. Flagging it loudly
because it is a deliberate departure from the kickoff's instruction.

The spec's other requirement is untouched by this: temur's base_url stays
the REAL hostname (https://api.anthropic.com), so SNI and certificate
validation inside the guest are exactly what they would be without a
relay. /etc/hosts changes address resolution only, never the URL. The
successful handshake above is the proof.

The allowlist did not weaken. The set of reachable destinations is now
bounded by the relay's map rather than by regex matching on a
client-supplied string, which is if anything a stronger property: the
guest cannot express a destination the relay has no mapping for.

## Pins and new artifacts

  kernel   kit/bzImage-p3       3,813,888 B
           sha256 c964b9172584f3782b634fba22e3a8f3423778fc9ac636fb34f0b852d7c1b27a
           kit/kernel-p3.config sha256 7e67ae7d70ef86d421a818b47464599c3b808aa4eb9c5f9d4bc5b4888e37d8c8
           size cost over P2's bzImage-p3 predecessor: +20,480 B
  relay    @mercuryworkshop/wisp-js 0.4.1 (npm, --save-exact), AGPL-3.0
           integrity sha512-104LwiXiuhti/e32gmv0Da0u0yuLFDHX8JawCzleTP
           WJ5t5qTX4EYi4E7/ucbjBPN9wwVPWHE5g5yGqzl/NzQA==
  CA       NONE SHIPPED, and none needed. Verified in the temur tree:
           Cargo.toml takes ureq with "rustls-webpki-roots",
           webpki-roots 1.0.8 is in Cargo.lock, doctor.rs:1084 uses
           webpki_roots::TLS_SERVER_ROOTS, and a grep for native-tls,
           native_certs, /etc/ssl/certs and SSL_CERT_FILE across the
           whole tree returns NOTHING. Proven live by the handshake.
  snapshot build/state-p3-page.bin 35,118,932 B
           sha256 2a8cdcb926366f4f75b303aaf8a83002800fbf139d4fbee6cd447ca7b1db4206
           served gzipped as 15,935,215 B

P2's accepted artifacts are byte-identical and untouched: kit/bzImage-p2
is still ff1c9c18..., kit/kernel-p2.config still 42a439d6....

### Why ne2k, not virtio

v86 defaults net_device to {type:"ne2k"} and has emulated it far longer
than its virtio-net. It also costs less: virtio would need VIRTIO_PCI,
which P2 deliberately left off. Confirmed bound in the guest:

    DRIVER=ne2k-pci   PCI_ID=10EC:8029
    ne2k-pci 0000:00:05.0 eth0: RealTek RTL-8029(AS) found at 0xc000, IRQ 10

Config diff P2 -> P3: 79 symbols gained, ZERO LOST. Seventy-two of those
are bare NET_VENDOR_* menu gates with no driver under them, which is why
79 new symbols cost only 20 KB.

The 79 break down as 72 bare vendor gates plus these 7:

    CONFIG_NETDEVICES=y        subsystem gate
    CONFIG_NET_CORE=y          subsystem gate
    CONFIG_ETHERNET=y          subsystem gate
    CONFIG_NE2K_PCI=y          THE ONE NIC DRIVER
    CONFIG_NET_PTP_CLASSIFY=y  timestamping, pulled in behind the above
    CONFIG_PPS=y               timestamping, pulled in behind the above
    CONFIG_PTP_1588_CLOCK=y    timestamping, pulled in behind the above

So exactly one NIC DRIVER is enabled, NE2K_PCI, and
CONFIG_VIRTIO_PCI is not set. (An earlier draft said "the only
non-vendor-gate =y is NE2K_PCI", which was loose: the six subsystem and
timestamping symbols above are also =y. None of them is a driver.)

CONFIG_PACKET is still off, deliberately: busybox udhcpc would need raw
sockets for DHCP, so the guest is addressed statically instead
(192.168.86.100/24 via 192.168.86.1), which is fewer moving parts and
keeps the raw-socket surface out of the guest entirely.

## The relay

tools/relay.mjs, bound 127.0.0.1:8089. The listen address is a knob purely
so P3b can be authorized separately; it is not a public server today.

TWO GATES, deliberately:
  1. wisp-js's own filter bounds what the guest may ASK for to exactly the
     four mapped addresses (anchored regexes, port 443 only, UDP off,
     loopback off).
  2. CountingTCPSocket.connect() refuses anything not in the address map
     and is the only thing that ever dials a real host.

PAYLOAD IS NEVER LOGGED. Stated in the code comments and true of the
library too: every logging call in wisp-js's server prints connection
metadata (conn id, hostname, port, close reason) and none prints payload,
at any level including debug. The byte counters add up `.length` and never
inspect, buffer, decode or retain the bytes.

### Allowlist proofs (tools/relay-probe.mjs), 6/6

    PASS  allowed: 192.0.2.1:443 (maps to api.anthropic.com)   got=open
    PASS  blocked: 192.0.2.9:443 (unmapped)                    got=closed:HostBlocked
    PASS  blocked: 1.1.1.1:443 (bare public IP)                got=closed:HostBlocked
    PASS  blocked: api.anthropic.com:443 (by name)             got=closed:HostBlocked
    PASS  blocked: 192.0.2.1:80 (port not 443)                 got=closed:HostBlocked
    PASS  blocked: 127.0.0.1:443 (loopback)                    got=closed:HostBlocked

The bare-IP case is the shape a DoH leak would take as a request, and it
is refused. The by-name case matters too: nothing reaches a destination
except through the map.

### Rate limits (tools/relay-limit-probe.mjs), 2/2

Recorded values: 16 streams per wisp connection, 8 concurrent streams per
destination, 30 new websockets per client IP per minute, 8 concurrent
websockets per client IP.

    PASS  per-IP websocket rate limit: 36 attempts, 28 accepted, 8 refused (cap 30/min)
    PASS  per-host concurrent stream cap: 12 requested, 8 open, 4 refused (cap 8)

## Snapshot interaction: bring up AFTER restore

Measured, not assumed. Four variants against the same snapshot:

    A  no nudge at all                          FAIL
    B  full re-bring-up                         PASS
    C  link down/up + neigh flush               FAIL
    D  neigh flush only                         FAIL

So networking does NOT survive restore_state, and the minimum that revives
it is a full re-bring-up including re-adding the address. That is what the
page sends, and it is idempotent:

    ip link set eth0 down; ip addr flush dev eth0; ip link set eth0 up;
    ip addr add 192.168.86.100/24 dev eth0;
    ip route add default via 192.168.86.1; ip neigh flush all

Post-restore proof, after the nudge: POST-RESTORE NETWORK PASS,
restore_ms 109, total 3403 ms to a completed TLS handshake.

## The keyless snapshot, proven keyless

build/state-p3-page.bin, and the gzipped copy the page actually serves,
both searched for provider key prefixes:

    sk-ant-   0 hits        sk-proj-  0 hits
    sk-or-    0 hits        AIza      0 hits
    xai-      0 hits

Control: "api.anthropic.com" matches 23 times in the same file, so the
search works. The decompressed asset (35,118,932 B out of the .gz) gives
the same zeros, which is the check that actually means something.

A bare "sk-" matches 3 times; all three are Linux kernel strings, printed
in full rather than waved away:

    'TCP: %s: Impossible, sk->sk_state=%d'
    'block/disk-events.c'
    '&sk->sk_lock'

The snapshot is keyless BY CONSTRUCTION, not just by inspection: it is
taken before any key exists, and temur refuses to start for a hosted
provider without one, so there is no state in which a key could have been
present when it was written.

## The page

Two tiers, chosen by probing the relay at load:
  - NETWORKED: the P3a snapshot, ne2k NIC, dns_method "static" (never the
    "doh" default), traffic to the relay.
  - OFFLINE: the P2 snapshot, no NIC, no relay. Reached whenever the relay
    is absent, with a plain notice saying so rather than half-working.

THE PAGE IS NEVER IN THE KEY PATH. There is no key input field and there
will not be one. In the networked tier the page does not even launch
temur: temur refuses to start for a hosted provider without a key, so the
page lands the operator at the guest shell and tells them to run
`temur-setkey` (which reads the key with terminal echo OFF, writes it 0600
inside the guest, and clears its own variable) and then `temur`.

TWO SAFETY INTERLOCKS, enforced rather than promised:
  - The capturing self-test REFUSES to run in the networked tier, because
    it reads the terminal buffer and POSTs it. Proven: with the relay up,
    ?selftest=1 posted nothing at all.
  - The server sends a Content-Security-Policy whose connect-src is the
    page's own origin plus ws://127.0.0.1:8089 and nothing else, so the
    browser itself would block any off-box connection, the avoided DoH
    request included. This is enforcement, not observation.

Locality evidence: the server's request log shows every asset served from
127.0.0.1:8088, the relay log shows the websocket on 127.0.0.1:8089, and
the CSP makes anything else impossible. Those are the only two
destinations.

### Trust paragraph, DRAFT for review

On the page now, clearly marked "[DRAFT - pending review]". It ships
public only if and when planning and the operator approve it:

  Where your key goes

  This page runs a small Linux computer inside your browser. When you type
  an API key, you are typing it into that computer, not into this web
  page: there is no key box on this page, and the page never reads what
  you type into the terminal. Your key stays in that computer's memory.

  Requests to your AI provider are encrypted inside that computer before
  they leave it. They travel through a relay that can see only which
  provider you are contacting and how many bytes moved. The relay cannot
  read your key, your prompts, or the replies, and it can only reach the
  handful of AI providers on its allowlist.

  Nothing is stored. Close or reload this tab and the computer, its
  memory, and your key are gone. You will type the key again next time,
  because there is nowhere for it to have been kept.

## Measurements

RELAY-ADDED LATENCY, TLS handshake to api.anthropic.com:

    direct from the host, no relay, no emulator   76 / 79 / 106 / 155 / 162 ms, median 106
    from the guest through the relay              673 (cold) / 299 / 298 ms

So roughly +190 ms warm. Labelled honestly: that gap is the relay hop AND
v86's emulated NIC AND the guest doing TLS on an emulated 32-bit CPU. It
is not a measurement of the relay alone, and it should not be quoted as
one. Byte counts were identical every time (324 up, 2782-2784 down).

PAGE, offline tier, Edge 152.0.0.0 headless: TUI ready 3448 ms, echo 31
ms. That is slower than P2's 775 ms for one identified reason: the offline
path pays the full 2500 ms relay-probe timeout before it gives up. The
networked tier does not pay it (the probe succeeds immediately).

PAGE ASSETS: unchanged from P2 except the snapshot. The networked tier
loads state-p3-page.bin.gz at 15,935,215 B instead of the offline
15,581,537 B; only one of the two is ever fetched.

## Outstanding: the keyed steps

NOT DONE, and not doable by this session. docs/P3A-OPERATOR.md has the
full script: the real turn, the bash tool call, and the two failure paths
(bad key -> auth error in the TUI; relay down -> connect error). It also
lists what must not run while a key exists, notably the serial-logging
harnesses and the two page query parameters.

## KNOWN DEFECT: temur-setkey is not on the guest PATH

FOUND LIVE BY THE OPERATOR, 2026-09-05, during the keyed run. NOT FIXED
at the time of writing: fixing it means building a new keyless snapshot,
and a snapshot must not be taken while a keyed tab is open, because it
would capture the operator's key in the guest's memory image.

Symptom, at the guest shell:

    -sh: temur-setkey: not found

Cause, verified from primaries on both sides:
  - tools/gen-steps-p3-page-snap.mjs bakes the helper to
    /usr/local/bin/temur-setkey;
  - the rootfs's own /etc/profile (inside kit/rootfs.cpio.gz, read
    straight out of the newc archive) sets
        export PATH="/bin:/sbin:/usr/bin:/usr/sbin"
    which does NOT include /usr/local/bin.
So the helper exists and is executable, but its bare name resolves to
nothing.

WORKAROUND, in docs/P3A-OPERATOR.md now: invoke it by full path,
/usr/local/bin/temur-setkey. Nothing else about the keyed flow changes.

HOW I MISSED IT, recorded because the failure is instructive. The
snapshot step that "verified" the helper ran
`head -3 /usr/local/bin/temur-setkey` - by FULL PATH. That confirmed the
file existed and was written correctly, and would have passed no matter
what PATH contained. I verified the artifact and never once verified the
command I had told the operator to type. A check that cannot fail the way
the documented step fails is not a check of that step.

FIX CANDIDATES for the next keyless snapshot, none applied, desktop to
rule:
  a. bake the helper to /usr/bin instead of /usr/local/bin, so it lands
     on the PATH the rootfs already sets;
  b. or prepend /usr/local/bin to PATH in /root/.profile, alongside the
     APP_SECRET_FILE export that is already written there;
  c. and, either way, add a snapshot step that actually RUNS the helper
     by bare name against empty input. It exits 1 on an empty line
     without writing anything, so that is safe and stays keyless, and it
     would make a recurrence of "not found" impossible to miss - it is
     the check that (b) above should have been.

(a) is the smaller change; (b) keeps the helper out of the distro's own
bin directory. Both want (c).

## What fought back

THE KICKOFF'S DNS PLAN, covered at the top. The largest finding of the
phase and the reason the design differs from the brief.

wisp-js 0.4.1's stream_limit_per_host IS BROKEN AND FATAL. filter.mjs does
`for (let stream of connection.streams)`, but ServerConnection sets
`this.streams = {}`, an object, which is not iterable. Setting the option
to anything but -1 throws TypeError on the FIRST stream and, because the
throw is inside an async task nobody awaits, takes the entire relay
process down. It presented as every allowlist test inverting at once: the
relay died on test one, so the rest got no responses and "blocked" hosts
read as "open". Per-host capping is done in our own layer instead, and the
relay now installs unhandledRejection and uncaughtException handlers so no
single stream can kill it again.

wisp-server-node IS DEPRECATED FOR SECURITY. The kickoff offered it as the
first option; npm's own metadata says "deprecated due to security and
stability issues, please use @mercuryworkshop/wisp-js instead". Switched
to wisp-js, which is also the one with a native allowlist. Worth noting
for P3b that wisp-js is AGPL-3.0, which has source-availability
obligations if the relay is ever hosted publicly.

CSP BROKE v86 SILENTLY. `default-src 'self'` blocks v86's CPU worker,
which it starts from a blob URL (URL.createObjectURL + new Worker). The
machine restored and then produced no serial output at all, with no error
in the page. Fixed with worker-src/child-src blob:; connect-src still
bounds what the worker can reach.

temur WILL NOT START WITHOUT A KEY for a hosted provider, which is correct
but reshaped the page: "secret: APP_SECRET_FILE is not set" and an
immediate exit. This is why the networked tier lands at a shell. Also
worth recording: the anthropic provider has no api_key_file at the
top level of the config (config.rs documents the key as arriving by path
through APP_SECRET_FILE; api_key_file lives on named profiles and on
openai_compat), so the guest exports APP_SECRET_FILE instead.

A HARNESS BUG OF MY OWN, recorded because it produced a confident wrong
answer: restore-net.mjs judged the doctor line at the instant its regex
first matched, which is mid-line at "PASS: reachable:", before the
parenthesised proof had arrived. It reported FAIL over output that plainly
said PASS. Fixed by judging after the line completes, and by firing once.

## Out of scope, confirmed untouched

No WebLLM. No model hosting. No page design beyond the trust paragraph and
the relay-down notice. No dynamic resize. No multi-size snapshots. No
temur code change of any kind, and the temur repo was never written to.
Nothing deployed, exposed, or published; both listeners are 127.0.0.1.

## Reproducing

    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    npm ci
    node tools/relay.mjs &                    # 127.0.0.1:8089
    node tools/relay-probe.mjs                # allowlist, 6/6
    node tools/relay-limit-probe.mjs          # limits, 2/2
    node tools/gen-steps-p3-net.mjs
    node tools/run-guest-net.mjs kit/bzImage-p3 build/rootfs-temur.cpio.gz \
         build/steps-p3-net.json 128          # keyless doctor proof
    node tools/gen-steps-p3-page-snap.mjs
    node tools/run-guest-net.mjs kit/bzImage-p3 build/rootfs-temur.cpio.gz \
         build/steps-p3-page-snap.json 128 wisp://127.0.0.1:8089/ \
         build/state-p3-page.bin              # the keyless page snapshot
    node tools/restore-net.mjs build/state-p3-page.bin 128 \
         wisp://127.0.0.1:8089/ "<the nudge>" # post-restore proof
    sh tools/stage-page.sh
    node tools/serve-page.mjs 8088

For the kernel, in the P1/P2 Buildroot tree, with the PATH pinned:

    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
      make -C /home/dev/v86-guest-2026-09-04/buildroot-2026.02.3 linux-reconfigure
