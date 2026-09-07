# P3b deploy: the public proofs, step 9

2026-09-06 / 2026-09-07 UTC. Against the LIVE deployment.

    page   https://play.temur.live  and  https://temur-playground.pages.dev
    relay  https://relay.temur.live
    commit e17e1d882bacfe5562ed7ac7c04f10fa880da057

Sections 0 to 5 of docs/VPS-RUNBOOK.md ran on the box. This file carries
the step-9 proofs, the corrections the run produced, and the findings the
run produced that nobody was looking for.

A NOTE ON WHAT IS QUOTED HERE. The relay's journal contains CLIENT IP
ADDRESSES by design, because the per-IP limits key on them. Real
visitors are now in it. Every journal line reproduced below has had its
IP redacted, and no line belonging to a third party is reproduced at
all. See finding 3.

--------------------------------------------------------------------
## 1. Page stamp and /version equal the published head

Fetched independently rather than taken from the deploy:

    GitHub origin/main            e17e1d882bacfe5562ed7ac7c04f10fa880da057
    page (pages.dev) build-info   e17e1d882bacfe5562ed7ac7c04f10fa880da057
    page (play.temur.live)        e17e1d882bacfe5562ed7ac7c04f10fa880da057
    relay GET /version            e17e1d882bacfe5562ed7ac7c04f10fa880da057

All four equal. play.temur.live was attached during this pass and is
included throughout rather than mentioned as an afterthought.

PASS.

--------------------------------------------------------------------
## 2. Keyless grep of the DEPLOYED snapshot bytes

Downloaded from Pages, both hostnames, not from the clone:

    state-page.bin.gz      15,581,537 B  2ccd77d9489cb51e72197e1406f10341179eb7dd15aa6232be4fc2aa296045a3
    state-p5-page.bin.gz   15,937,162 B  6b16c97da47ed5cf6335e520d63c37832bffbb4024f6eb89e965bb0fa93783ac

Both hostnames serve bytes sha256-identical to the committed files, so
what is SERVED is what was reviewed. Decompressed and grepped:

    sk-ant-   0 / 0        sk-proj-  0 / 0        sk-or-  0 / 0
    AIza      0 / 0        xai-      0 / 0
    held-out P1..P7        0 / 0 for every pattern

(offline / networked). The deployed code was checked the same way:
app.js and index.html as served are byte-identical to the committed
files.

PASS.

--------------------------------------------------------------------
## 3. CSP locality against the deployed site

The Content-Security-Policy as served is BYTE-IDENTICAL to the one in
page/_headers, on both hostnames, and connect-src is exactly:

    connect-src 'self' wss://relay.temur.live

page/_headers is not itself served as content. A request for it returns
200, but so does any nonsense path: Cloudflare Pages serves index.html
as a catch-all rather than 404 (see finding 4).

WHAT THE PAGE CONTACTS, from a browser network log (--log-net-log) on
both tiers:

    play.temur.live      the page and its assets
    relay.temur.live     the wisp websocket, networked tier only

and nothing else. Statically, the served app.js contains no absolute URL
other than the two relay endpoints and two links; every fetch is
relative or RELAY_WS.

PASS, with a qualification recorded as finding 2: the netlog also shows
origins the BROWSER contacts on its own, and one of them is a
consequence of the deployment rather than of Edge.

--------------------------------------------------------------------
## 4. The NO PROVIDER tier is reachable and correct

Proven on the deployed page with relay.temur.live blocked at DNS
resolution, which spends no relay slot:

    notice     "NO PROVIDER: this sandbox cannot reach an AI provider at
                the moment, so an API key will not help here."
    landing    the shell, with the page-composed greeting, and a prompt
    trust      the block renders above the questions
    footer     build e17e1d8

The page-side ICRNL nudge is what makes that tier usable, and it is in
the landing line the guest echoes. Enter through the wizard and cat with
a single Ctrl-D were proven byte-level before the deploy; the deployed
app.js is byte-identical to the one those proofs ran against.

PASS.

--------------------------------------------------------------------
## 5. Allowlist refusal, live

Three shapes, against wss://relay.temur.live:

    unmapped host                example.com:443   REFUSED, wisp code 72
    mapped host, non-443 port    192.0.2.1:80      REFUSED, wisp code 72
    loopback                     127.0.0.1:22      REFUSED, wisp code 72
    control: mapped host, 443    192.0.2.1:443     ALLOWED

THE CONTROL MATTERS AND ITS SEMANTICS ARE NOT OBVIOUS. WISP has no open
acknowledgement for a TCP stream: the server just starts relaying, so
SUCCESS IS SILENCE and a refusal is the only thing that raises an event.
A first version of this probe reported the control as refused because it
waited for an open that does not exist. The three refusals are real
CLOSE frames carrying a code; the control is the absence of one.

The relay's own record of the control, from the journal, IP redacted:

    {"event":"stream_close","id":19,"dest":"api.anthropic.com:443",
     "bytes_up":0,"bytes_down":0,"ms":6013}

ZERO BYTES IN EITHER DIRECTION. The relay opened a TCP socket to the
provider and nothing was ever sent on it. No API request was made, by
this session or on its behalf, at any point in this pass.

PASS.

--------------------------------------------------------------------
## 6. Rate limits live, and the fix-or-retire decision

relay-limit-probe.mjs was reclassified as a deploy-time probe because
its second proof needs live egress. The public relay provides it. Run
against wss://relay.temur.live with the deployed caps (60/min, 8/host):

    FIRST RUN, the probe as it stood:
      FAIL  per-IP rate limit: 66 attempts, 66 accepted, 0 refused
      PASS  per-host stream cap: 12 requested, 8 open, 4 refused

THE RELAY WAS NOT AT FAULT. A grace-corrected measurement of the same
66 attempts, taken independently:

      attempts 66   accepted 60   refused 6
      close codes on refusal: {"4002": 6}

Exactly the cap, and every refusal carrying the shared-address rate
code. The probe was BLIND, for precisely the reason desktop made a
standing rule about: it resolved on the socket "open" event, and a
refusal now completes the handshake before closing with a private code,
so every refusal counted as an acceptance.

DECISION: FIX, not retire. The probe is the only thing that exercises
the per-host stream cap against a real upstream, and that half was
correct all along. The rate half needed the 400 ms accept grace that is
now standing for every relay client. After the fix, against the live
relay:

      PASS  per-IP rate limit: 66 attempts, 60 accepted, 6 refused
      PASS  per-host stream cap: 12 requested, 8 open, 4 refused
      2/2

relay-refusal-probe.mjs and relay-proxy-probe.mjs were NOT run against
the public relay and the reason is structural rather than an omission:
both start their own relay process and drive it with X-Forwarded-For to
simulate distinct clients, which requires RELAY_TRUST_PROXY and a
trusted socket. Against a public endpoint they would be simulating a
proxy that is not there. They ran green locally at these caps.

PASS.

--------------------------------------------------------------------
## 7. The relay-down banner appears and clears

Driven on the operator's cue, with a page holding a live connection to
the PRODUCTION relay. The page ran the deployed app.js byte for byte
(sha256 9998f2d9600af84a...), served under a non-localhost name so that
it selected the production endpoint.

    00:21:45  settled, networked tier, no banner
    00:22:09  operator: systemctl stop temur-relay
              /version from outside -> 502
    00:22:14  OUTAGE BANNER APPEARS, about 5 s after the stop
              "Relay connection lost. Requests from the guest will HANG
               rather than fail ..."
    00:22:34  operator: systemctl start temur-relay
              /version -> 200, same commit, same build timestamp
    00:23:09  BANNER CLEARS BY ITSELF, no reload, about 35 s after the
              restart, consistent with v86's 10 s redial and the page's
              1 s poll

502 rather than a refused connection, because Caddy stays up and
proxies to a backend that is gone. The banner shown was the OUTAGE
variant, not the shared-address one, which is the distinction the two
messages exist to preserve.

PASS.

A SMALL DEFECT OBSERVED WHILE DOING THIS, recorded because it will
otherwise be found by a visitor: on the networked tier the outage banner
FLASHES FOR ROUGHLY 25 SECONDS DURING BOOT and then clears on its own.
The guest's websocket is not OPEN until the guest has restored and
brought its interface up, and the watcher's poll starts before that, so
a visitor is told the relay connection is lost while the machine is
still starting normally. Nothing is wrong when it appears. It is a
false alarm on the happy path and it should be suppressed until the
guest has been up once.

--------------------------------------------------------------------
## 8. One operator keyed turn

THE OPERATOR'S, in their browser. This session never saw the key, the
prompt or the reply, and never held one at any point.

Reported: provider Gemini, the turn completed cleanly through the live
relay.

Corroborated from the relay's journal. These are the only lines for
that turn, IPs redacted, reproduced in full:

    {"event":"stream_close","id":1,"dest":"generativelanguage.googleapis.com:443",
     "bytes_up":340,"bytes_down":4466,"ms":694}
    {"event":"stream_close","id":2,"dest":"generativelanguage.googleapis.com:443",
     "bytes_up":30953,"bytes_down":7339,"ms":1945}
    {"event":"stream_close","id":3,"dest":"generativelanguage.googleapis.com:443",
     "bytes_up":31362,"bytes_down":4147,"ms":3243}

THIS IS THE TRUST CLAIM, DEMONSTRATED RATHER THAN ASSERTED. The page
tells a visitor that the relay "can see only which provider you are
contacting and how many bytes moved". What the relay actually recorded
for a real turn is a destination, a byte count in each direction, and a
duration. There is no payload, no prompt, no reply, and no key, because
the relay never had them: the traffic is TLS the guest terminated
itself.

PASS.

--------------------------------------------------------------------
## FINDINGS THE PROOFS PRODUCED

### Finding 1: several addresses, and what they were

The journal shows websocket opens from about eight addresses other than
this laptop's, beginning a few minutes after the service came up. THE
OPERATOR STATES THESE WERE THEIR OWN DEVICES, looking at the live page
from more than one machine and network. They have direct knowledge of
that and this report takes it; the addresses are not reproduced here
either way.

ONE PATTERN IS WORTH A SECOND LOOK RATHER THAN AN ASSUMPTION: four
distinct addresses in different network blocks appeared within eleven
seconds of each other. That is a short interval for one person to open
four devices, and it is also the signature of LINK PREVIEW BOTS, which
render a shared URL from several hosted nodes at once. The page opens
its relay websocket automatically on load, so anything that renders the
page appears here exactly as a visitor does. If the URL was shared
anywhere around that time, that is the likelier explanation, and it is
not a problem.

WHAT DOES NOT DEPEND ON WHO THEY WERE, and is the part worth recording:
NO STREAM TO ANY DESTINATION OUTSIDE THE ALLOWLIST APPEARS IN THE
JOURNAL, from any address, at any time. Every connection that was not
this laptop's probes or the operator's own turn opened a websocket and
reached nothing. The two gates held under real traffic from real
addresses rather than only in a probe, and that holds whether the
traffic was the operator, a preview bot, or a stranger.

An earlier draft of this section called these connections strangers and
scanning. That was an inference from address blocks, not an
observation, and it was wrong or at least unfounded. The correction is
recorded rather than quietly applied, because a public report claiming
it was scanned on launch night is a claim about other people.

### Finding 2: the deployment adds headers the repository does not

The CSP does not drift, and that was the claim the local server was
built to protect. But the FULL header set does. Cloudflare adds, on
every response:

    nel: {"report_to":"cf-nel","success_fraction":0.0,...}
    report-to: {"group":"cf-nel","endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?..."}]}
    access-control-allow-origin: *

The first two mean A VISITOR'S BROWSER MAY SEND NETWORK ERROR REPORTS TO
CLOUDFLARE, on its own, outside the page's control. That is visible in
the network log as a.nel.cloudflare.com. It is not governed by
connect-src, because reporting endpoints are exempt by design.

It carries no payload and success_fraction is 0, so only errors are
reported, and Cloudflare is already the CDN serving the page. It does
not touch the guest's provider traffic, which goes to a different origin
that is not behind Cloudflare. But "the page contacts nothing else" is
not quite true of the deployment, and the trust story should say what is
true rather than what was true on a laptop.

RECOMMENDATION: state it, or turn it off if Pages permits. Not decided
here.

### Finding 3: the journal contains visitor IP addresses

docs/VPS-RUNBOOK.md section 6 says the log lines "are safe to share
as-is, which is what makes soak review possible at all". That was
written when the only client was the operator. It is now a public
service, and the per-IP limits mean every connection is logged WITH THE
CLIENT'S ADDRESS.

Connection-level only is still true. Payload-free is still true. But an
IP address is personal data, and a log full of strangers' addresses is
not something to paste into an issue, a report or a relay message
without thought. This file redacts every one.

RECOMMENDATION: qualify that sentence in the runbook, and decide
whether the relay should log a truncated or hashed address. Not changed
in this pass; it is a design question, not a typo.

### Finding 4: Pages serves index.html for unknown paths

Any path that does not exist returns 200 with the page's HTML rather
than 404. A mistyped asset path therefore reaches the page's own fetch
as a successful response containing HTML, and fails later and less
clearly than it should. fetchState checks res.ok, which is true here.

Not exercised by anything today, since the asset paths are correct.
Worth knowing before someone debugs a missing asset.

### Finding 5: this session's probes sent zero bytes to any provider

Recorded because the standing rule is that the build session never runs
the product against a live provider API. Sixteen streams to
api.anthropic.com appear in the journal from this laptop's probes, every
one of them with bytes_up 0 and bytes_down 0. The relay opened TCP
sockets; nothing was ever written to them.

--------------------------------------------------------------------
## RUNBOOK CORRECTIONS FROM THE RUN

Applied to docs/VPS-RUNBOOK.md in the same pass, in the steps
themselves rather than as errata:

  * `cd /srv/relay/app` FAILS for the login user, and correctly:
    `adduser --system` creates the home without world execute, so ubuntu
    cannot traverse into it. The checkout uses `git -C`; anything
    needing a working directory runs as
    `sudo -u relay -H sh -c 'cd ... && ...'`.
  * `-H` ON sudo IS REQUIRED, or npm writes its cache into the calling
    user's home.
  * BUFFERUTIL'S INSTALL SCRIPT was skipped under npm's script policy
    and is LEFT UNAPPROVED ON PURPOSE. ws falls back to its JavaScript
    implementation; the relay is fully functional. Approving a native
    build script on the deployment host is not worth the speed at this
    traffic.
  * MEASURED ON THE BOX, replacing the laptop proxy: nofile_soft 8192
    against nofile_required 1696, and 18.8 MB idle for the whole
    process, against 63 MiB for the same build on this laptop. V8 sizes
    its heap from available memory.

--------------------------------------------------------------------
## THE POLICY QUESTION, RECORDED NOT DECIDED

Every page commit moves the published HEAD. The relay stamps the commit
it was deployed from, and section 5 of the runbook checks that
/version equals the published head. When only page/ changes, must the
relay be redeployed to keep them equal?

Redeploying restores the equality and costs a restart. Not redeploying
leaves a relay whose /version is behind the published head, which
weakens the check into "the relay matches SOME published commit".

Not decided here, and the relay was NOT redeployed in this pass.

--------------------------------------------------------------------
## VERDICT

Eight proofs, eight passes. The [DRAFT] marker on the trust block comes
off in this pass, which is what it was waiting for: the claims it
hedged are now demonstrated against the live deployment, and the one
that mattered most, that the relay sees only a destination and a byte
count, is demonstrated by the relay's own record of a real keyed turn.
