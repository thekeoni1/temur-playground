// Sandbox P3b: temur in the browser, with BYO-key networking.
//
// TWO TIERS.
//   offline   - the P2 snapshot, no NIC, no relay. Always available.
//   networked - the P3b snapshot, ne2k NIC, traffic to a WISP relay.
// The page probes the relay first and falls back to the offline tier with
// a plain notice rather than half-working.
//
// THE PAGE IS NEVER IN THE KEY PATH. There is no key input field here and
// there never will be one: the key is typed into temur inside the
// terminal, in the guest, at temur's OWN hidden prompt. That is the
// strongest form of the trust story, because the page has nothing to
// leak.
//
// Terminal geometry is fixed at 80x24 (see P2). Dynamic resize is parked.

const COLS = 80;
const ROWS = 24;
const MEM_MB = 128;

// --- the relay endpoint, ONE knob ------------------------------------
//
// RELAY_WS is the truth; RELAY_WISP is DERIVED from it, because v86 wants
// its own scheme name for the same URL (libv86.js does
// url.replace("wisp://","ws://") and url.replace("wisps://","wss://"),
// verified in the pinned build). Deriving is the point: two constants
// hand-maintained for one endpoint is skew waiting to happen, and a page
// pointed half at production and half at a dev port would fail in a way
// nobody reads correctly.
//
// WHICH endpoint is decided by where the page is served from, not by a
// query parameter. A local page therefore cannot accidentally talk to
// the public relay, and the deployed page cannot be talked into talking
// to anything else: the shipped CSP names the production relay and
// nothing else, so a tampered URL is refused by the browser rather than
// merely discouraged.
const RELAY_PROD = "wss://relay.temur.live/";
const RELAY_DEV = "ws://127.0.0.1:8089/";
const LOCAL =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname === "";
const RELAY_WS = LOCAL ? RELAY_DEV : RELAY_PROD;
const RELAY_WISP = RELAY_WS.replace(/^wss:/, "wisps:").replace(/^ws:/, "wisp:");

// The relay's own /version, for the footer link. Same host, http(s).
const RELAY_VERSION_URL =
  RELAY_WS.replace(/^wss:/, "https:").replace(/^ws:/, "http:") + "version";

// The public repository. This is the AGPL source offer the footer makes
// good on, so it is a real link and not a placeholder: anyone who can
// reach a running relay must be able to reach its complete corresponding
// source, and the footer plus the commit stamp are how they do it.
const REPO_URL = "https://github.com/thekeoni1/temur-playground";
// The trust block now says the runbook is "linked below", so it has to be.
// Variant B makes a checkable claim about this page, and a claim that a
// link exists is the cheapest kind to falsify.
const RUNBOOK_URL = REPO_URL + "/blob/main/docs/VPS-RUNBOOK.md";

const SNAP_ONLINE = "assets/state-p5-page.bin.gz";
const SNAP_OFFLINE = "assets/state-page.bin.gz";

// Networking does not survive restore_state: the guest kernel's interface
// state comes back but the JS-side adapter and its websocket are new, and
// the link stays dead until the address is re-added. Measured: with no
// nudge the guest cannot connect at all; a link bounce or an ARP flush
// alone is not enough either. This full re-bring-up is the minimum that
// works, and it is idempotent.
const NET_NUDGE =
  "ip link set eth0 down; ip addr flush dev eth0; ip link set eth0 up; " +
  "ip addr add 192.168.86.100/24 dev eth0; " +
  "ip route add default via 192.168.86.1 2>/dev/null; " +
  "ip neigh flush all\n";

// THE TWO LANDINGS.
//
// Offline tier: that snapshot carries a keyless local config, so temur
// itself is the right thing to start.
//
// Networked tier: the guest lands at TEMUR'S OWN SETUP WIZARD (P3b item
// 10). It replaced a baked Anthropic config plus a bespoke key helper,
// and it is better on every axis that matters: the visitor chooses their
// own provider instead of being defaulted into one, the key is typed at
// temur's own hidden prompt rather than into something written for this
// playground, and the guest behaves exactly like a real first install,
// which is the demo. The wizard refuses to run over an existing config,
// so the snapshot deliberately ships none.
//
// The MOTD is printed first so the three commands are on screen above the
// wizard for anyone who backs out of it with Ctrl-C.
// CONSOLE_FIX, and it is not cosmetic: without it the offline tier is
// unusable for setup.
//
// The guest serial console boots with ICRNL OFF (iflag 0x1400), so CR
// never terminates a `read`. busybox ash's line editor reads CR itself,
// which is why ordinary shell commands feel completely normal and only
// prompts break; and because the CR is then STORED rather than
// discarded, an answer comes back with a trailing CR that presents as a
// wrong value rather than as a terminal problem. That is the P3a
// finding, and it was fixed at the source by etc/profile.d/console.sh.
//
// THAT FIX ONLY EVER REACHED ONE OF THE TWO SNAPSHOTS. console.sh went
// into the P5 overlay, which produced the NETWORKED snapshot;
// tools/stage-page.sh builds the offline snapshot from the P2-era
// rootfs, which never received it. Every proof since P3a ran on the
// networked tier, so nothing caught it, and an operator met it on the
// live page with Enter echoing as ^M.
//
// So the page sets it at landing, on BOTH tiers. Same shape as
// NET_NUDGE above: one idempotent command injected where the guest
// starts, rather than a 15 MB snapshot rebuild. On the networked tier
// it is redundant, because console.sh already ran there, and it is
// carried anyway ON PURPOSE: the page should not depend on which
// overlay a given snapshot happened to receive, which is exactly the
// coupling that produced this defect. Rebuilding the offline snapshot
// so it carries console.sh properly is the structurally cleaner fix and
// is a separate question.
const CONSOLE_FIX = "stty icrnl; ";

// THE OFFLINE LANDING IS A SHELL, not the agent. Starting temur here
// put the visitor inside the one program that cannot do the thing they
// came for: it runs, and then every prompt fails because no provider is
// reachable. A shell is the honest place to arrive.
//
// THE GREETING IS COMPOSED HERE RATHER THAN READ FROM /etc/temur-motd,
// and that is not a preference. The motd DOES NOT EXIST on this
// snapshot: it went into the P5 overlay, so it reached the networked
// image and not this one, exactly as console.sh did. `cat
// /etc/temur-motd` here prints "No such file or directory", which would
// have made an error message the first thing a visitor read. Checked on
// the tier rather than assumed.
//
// It also must not say what the networked motd says. That one opens
// with `temur init  set up a provider and enter your API key`, which on
// this tier is advice to spend time on something that cannot work.
//
// `clear` first because the page TYPES this line into the guest, so the
// guest echoes it: without the clear, a visitor's first screen is five
// wrapped lines of printf quoting followed by the greeting. The clear
// runs after the echo and before the output, so what remains is the
// greeting alone.
const OFFLINE_MOTD =
  "clear; printf '%s\\n' " +
  "'temur in a browser: a throwaway Linux computer in your browser tab.' " +
  "'' " +
  "'This one cannot reach an AI provider, so temur will start but cannot' " +
  "'answer. Run temur doctor to see why. Everything else is an ordinary' " +
  "'Linux shell, so have a look around.'";

const LAUNCH_OFFLINE = CONSOLE_FIX + OFFLINE_MOTD + "\n";
// THE WHOLE ARC IN ONE LINE. `temur init && temur` means a visitor who
// finishes the wizard lands IN THE AGENT with no second step to
// discover. The Ctrl-C escape survives by construction rather than by a
// special case: init exits non-zero when interrupted, so && short
// circuits and they get the shell instead. Both paths are proven in the
// report.
//
// The motd is no longer printed here. The three numbered lines above
// the terminal say the same thing on the page, and saying it twice was
// the disease this pass is treating.
// `clear;` for the same reason OFFLINE_MOTD carries one, and it is not
// cosmetic here either. NET_NUDGE is four ip commands the page types
// into the guest, so the guest echoes all four, and the first thing a
// visitor saw on the networked tier was the plumbing that got the
// machine online. The clear runs after the echo and before the wizard
// draws, so what remains is the wizard alone. NET_NUDGE itself is
// untouched: it works, and only its echo was ever the problem.
const LAUNCH_INIT =
  CONSOLE_FIX + "clear; export TERM=xterm; temur init && temur\n";

// netcheck needs a config for doctor to read, and the snapshot has none
// on purpose. It writes a THROWAWAY one under a redirected
// XDG_CONFIG_HOME in /tmp and removes it in the same line, so the guest
// the visitor would meet is not altered. Keyless: no key file is named
// or created.
const NETCHECK_PROBE =
  "mkdir -p /tmp/nc/temur && printf '%s' " +
  "'{\"provider\":\"anthropic\",\"max_tokens\":4096," +
  "\"base_url\":\"https://api.anthropic.com\"," +
  "\"model\":\"claude-sonnet-5\"}' > /tmp/nc/temur/config.json && " +
  "XDG_CONFIG_HOME=/tmp/nc temur doctor 2>&1 | grep -iE '(un)?reachable:'; " +
  "rm -rf /tmp/nc\n";

const statusEl = document.getElementById("status");
const barEl = document.querySelector("#bar > div");
const noticeEl = document.getElementById("notice");
const bannerEl = document.getElementById("relaybanner");

let lastEcho = null;
const pending = [];
let tuiReadyMs = null;
let altSeen = "";
let networked = false;

function status(line, isErr) {
  statusEl.textContent = line;
  statusEl.className = isErr ? "err" : "";
}

function fmtMB(n) {
  return (n / 1048576).toFixed(2) + " MB";
}

// --- terminal -------------------------------------------------------
//
// fontSize is the one dimension that is safe to change here. COLS and
// ROWS are NOT: 80x24 is baked into the snapshot's stty and temur reads
// its size once at startup, so a browser-side grid change would leave
// the guest drawing for a terminal that no longer exists. Bigger means
// bigger pixels; the grid is the same 80x24 either way.
//
// 16 rather than 17 for a measured reason. At 17 the rendered terminal
// is 748 px, which puts the page's content edge at 760 px: past the
// 753 px a 768 px viewport actually has once a classic scrollbar takes
// its 15, so the commonest tablet width would get a horizontal
// scrollbar. At 16 the terminal is 704 px and that width has room to
// spare. Narrow viewports are handled by the step-down in index.html,
// which scales the rendered pixels and leaves this number alone.
const term = new Terminal({
  cols: COLS,
  rows: ROWS,
  convertEol: false,
  cursorBlink: true,
  fontSize: 16,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  theme: { background: "#000000", foreground: "#d0d0d0" },
});
term.open(document.getElementById("term"));

// --- is the relay there, and does it want us? -------------------------
//
// THREE ANSWERS, NOT TWO. "ok", "refused" and "down" are different
// things and a visitor deserves to be told which one happened.
//
// The relay's close codes are the contract (see relay/relay.mjs). A
// refusal completes the handshake and then closes with one of these, so
// OPENING IS NOT THE SAME AS BEING ACCEPTED: this used to resolve true
// the instant the socket opened, which after the relay learned to
// explain itself would have reported a refused visitor as a working
// relay and booted them into a networked guest whose every request
// hangs. So an opened socket is held for a grace period, and only a
// socket still open at the end of it counts as accepted.
const CLOSE_SHARED_ADDRESS = 4001;
const CLOSE_SHARED_RATE = 4002;
const CLOSE_AT_CAPACITY = 4003;

function isRefusal(code) {
  return (
    code === CLOSE_SHARED_ADDRESS || code === CLOSE_SHARED_RATE || code === CLOSE_AT_CAPACITY
  );
}

// Long enough for a refusal to arrive from a real relay over a real
// network, short enough that nobody notices it on the happy path.
const ACCEPT_GRACE_MS = 400;

function probeRelay(timeoutMs = 2500) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    let ws;
    try {
      ws = new WebSocket(RELAY_WS);
    } catch (e) {
      return finish("down");
    }
    ws.onopen = () => {
      setTimeout(() => {
        if (done) return;
        try {
          ws.close();
        } catch (e) {}
        finish("ok");
      }, ACCEPT_GRACE_MS);
    };
    ws.onerror = () => finish("down");
    ws.onclose = (ev) => finish(isRefusal(ev && ev.code) ? "refused" : "down");
    setTimeout(() => {
      try {
        ws.close();
      } catch (e) {}
      finish("down");
    }, timeoutMs);
  });
}

// The one place the shared-address wording lives, so the startup notice
// and the mid-session banner cannot drift apart.
//
// It does not say NAT, or CGNAT, or bucket, and it does not print the
// cap: the reader is somebody on a company or campus network who has no
// idea why a stranger's page is turning them away, and the number will
// change without them.
//
// TWO FACTS AND NOTHING ELSE. An earlier version explained the
// mechanism, reassured the reader it was not their fault, and said what
// still worked. All true, all cut: this is a banner, and the Q&A now
// carries the detail it did not carry when this was written.
function sharedAddressText() {
  return (
    "Too many people are using this from your network right now. " +
    "Waiting a little and reloading usually clears it."
  );
}

// --- fetch the snapshot, counting bytes ------------------------------

async function fetchState(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch " + url + ": HTTP " + res.status);
  const total = Number(res.headers.get("content-length") || 0);

  let got = 0;
  const counter = new TransformStream({
    transform(chunk, ctrl) {
      got += chunk.byteLength;
      if (total) barEl.style.width = ((got / total) * 100).toFixed(1) + "%";
      status(
        "fetching snapshot: " +
          fmtMB(got) +
          (total ? " / " + fmtMB(total) : "") +
          " (gzip on the wire)",
      );
      ctrl.enqueue(chunk);
    },
  });

  const stream = res.body
    .pipeThrough(counter)
    .pipeThrough(new DecompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return { buf, wire: got };
}

// --- relay loss, told plainly --------------------------------------
//
// v86 gives no event for this. Its wisp adapter sets wispws.onclose to
// setTimeout(() => this.register_ws(url), 10000) and retries forever in
// silence, so with the relay gone the guest sits on a connection that was
// accepted in-page and will never answer. The operator sees a spinner and
// nothing else, which is what happened during the keyed run.
//
// Of the two ways to notice, this watches THE ACTUAL SOCKET the guest's
// traffic uses, by polling its readyState rather than by hooking onclose.
// Polling was the deliberate choice: v86 owns that handler and uses it to
// reconnect, so chaining onto it risks breaking the reconnect, and
// re-reading adapter.wispws every tick follows each new socket for free.
// A separate monitor websocket would have been easier but could disagree
// with the guest's real link, and it would spend one of the relay's
// per-IP connection slots. It stays here only as the fallback for a v86
// build whose adapter this cannot find.
function findWispAdapter(emulator) {
  const candidates = [emulator.network_adapter, emulator.v86 && emulator.v86.network_adapter];
  for (const c of candidates) if (c && "wispws" in c) return c;
  return null;
}

function watchRelay(emulator) {
  const state = { mode: "none", up: true, cause: null };

  // How long a refusal stays the explanation for a link that is down.
  // v86 redials every 10 s, so a refusal that is still the reason will
  // be restated well within this; if it is not, the honest answer
  // becomes the outage message again.
  const REFUSAL_MEMORY_MS = 30000;
  let refusedAt = 0;

  // THE WATCHER MUST NOT SPEAK BEFORE THE FIRST CONNECTION. state.up
  // starts true and the adapter poll begins the moment the snapshot is
  // restored, which is before the guest's wisp socket has finished
  // dialling. The first ticks therefore saw a socket that was not OPEN
  // yet and fired an outage banner at a visitor whose relay was fine.
  // So no outage is declared until the socket has once been observed
  // OPEN.
  //
  // The suppression is BOUNDED, or a relay that is genuinely
  // unreachable would never be reported at all: past STARTUP_GRACE_MS
  // the watcher speaks whether or not it ever saw a connection. 15 s,
  // because v86 redials every 10 s and the first dial is at boot, so a
  // whole redial cycle plus a handshake fits inside the grace, while a
  // dead relay is still named long before a visitor has finished
  // reading the page.
  const STARTUP_GRACE_MS = 15000;
  const startedAt = Date.now();
  let seenOpen = false;

  function banner(text) {
    bannerEl.textContent = text;
    const btn = document.createElement("button");
    btn.textContent = "reload without a provider";
    btn.onclick = () => location.reload();
    bannerEl.appendChild(document.createElement("br"));
    bannerEl.appendChild(btn);
    bannerEl.hidden = false;
  }

  // TWO CAUSES, TWO MESSAGES. Telling a refused visitor that the relay
  // is down sends them to wait for something that is not broken; telling
  // an outage that their network is busy sends them to blame their
  // office wifi. The cause is re-evaluated on every tick, so a link that
  // goes from refused to genuinely down updates rather than sticking.
  // THE CLOSE CODE IS AUTHORITATIVE, BUT IT CAN BE MISSED. The poll runs
  // once a second and v86 builds a fresh socket on each redial, so a
  // refusal that arrives less than a tick after the socket appears can
  // close before the listener is on it. Re-probing settles it: a fresh
  // connection to the SAME origin the page already talks to is either
  // refused with a code, or it is not, and either way we learn which of
  // the two messages is the true one.
  //
  // Deliberately not a fetch of the relay's /version. That is an https
  // origin, the shipped CSP allows only wss:// for this host, and
  // /version sends no CORS header on purpose. Reaching it would mean
  // widening the policy for a diagnostic, which is a bad trade for the
  // tightest claim the page makes.
  const REPROBE_EVERY_MS = 5000;
  let lastProbe = 0;
  function reprobe() {
    const now = Date.now();
    if (now - lastProbe < REPROBE_EVERY_MS) return;
    lastProbe = now;
    probeRelay(2000).then((r) => {
      if (r === "refused") refusedAt = Date.now();
    });
  }

  function down() {
    if (Date.now() - refusedAt >= REFUSAL_MEMORY_MS) reprobe();
    const refused = Date.now() - refusedAt < REFUSAL_MEMORY_MS;
    const cause = refused ? "refused" : "lost";
    if (!state.up && state.cause === cause) return;
    state.up = false;
    state.cause = cause;
    if (refused) {
      banner(sharedAddressText() + " Requests will not go through until then.");
    } else {
      banner(
        "Relay connection lost. Requests from the guest will HANG rather " +
          "than fail: the connection was accepted inside this page before the " +
          "relay went away, so nothing tells the guest it is gone. Restart the " +
          "relay and this notice clears, or reload to run without a provider.",
      );
    }
  }
  function back() {
    // Above the early return on purpose. state.up starts true, so on the
    // very first OPEN tick this function does nothing else, and a latch
    // set below the guard would never be set at all.
    seenOpen = true;
    if (state.up) return;
    state.up = true;
    state.cause = null;
    refusedAt = 0;
    bannerEl.textContent = "";
    bannerEl.hidden = true;
  }
  // Kept as the old name so the fallback path below reads the same.
  const lost = down;

  // Read the close CODE off the guest's own socket, which is the only
  // place the refusal is stated. addEventListener, never onclose: v86
  // owns that handler and uses it to redial every 10 s, so assigning to
  // it would silently break reconnection. v86 replaces the socket object
  // on each redial, so every new one gets its own listener.
  let watched = null;
  function noticeRefusals(ws) {
    if (!ws || ws === watched) return;
    watched = ws;
    try {
      ws.addEventListener("close", (ev) => {
        if (isRefusal(ev && ev.code)) refusedAt = Date.now();
      });
    } catch (e) {}
  }

  const adapter = findWispAdapter(emulator);
  if (adapter) {
    state.mode = "adapter-socket";
    setInterval(() => {
      const ws = adapter.wispws;
      noticeRefusals(ws);
      if (ws && ws.readyState === WebSocket.OPEN) back();
      else if (seenOpen || Date.now() - startedAt > STARTUP_GRACE_MS) down();
    }, 1000);
  } else {
    // Fallback only: costs one of the relay's per-IP websocket slots.
    state.mode = "monitor-socket";
    let mon = null;
    const open = () => {
      try {
        mon = new WebSocket(RELAY_WS);
      } catch (e) {
        lost();
        return;
      }
      mon.onopen = () => back();
      mon.onclose = (ev) => {
        if (isRefusal(ev && ev.code)) refusedAt = Date.now();
        lost();
        setTimeout(open, 3000);
      };
      mon.onerror = () => lost();
    };
    open();
  }
  return state;
}

// --- the build stamp, shown ------------------------------------------
//
// tools/stamp.mjs writes page/build-info.js from the commit; it is not
// tracked, so no committed file ever carries a sha that could be stale.
// If it is missing the footer says the build is unstamped rather than
// inventing a version, which is the same rule the relay follows when it
// refuses to start without one.
function renderStamp() {
  const el = document.getElementById("stamp");
  if (!el) return;
  const b = window.__BUILD__;
  const parts = [];
  parts.push(b && b.commit ? "build " + b.short : "UNSTAMPED BUILD");
  el.textContent = parts.join("");

  const src = document.createElement("span");
  if (REPO_URL) {
    src.appendChild(document.createTextNode(" \u00b7 "));
    const a = document.createElement("a");
    a.href = REPO_URL;
    a.textContent = "source, relay included (AGPL-3.0)";
    src.appendChild(a);
  } else {
    src.appendChild(
      document.createTextNode(
        " \u00b7 relay source is AGPL-3.0; the repository link is set at deploy",
      ),
    );
  }
  el.appendChild(src);

  const rb = document.createElement("span");
  rb.appendChild(document.createTextNode(" \u00b7 "));
  const a3 = document.createElement("a");
  a3.href = RUNBOOK_URL;
  a3.textContent = "deployment runbook";
  rb.appendChild(a3);
  el.appendChild(rb);

  const v = document.createElement("span");
  v.appendChild(document.createTextNode(" \u00b7 "));
  const a2 = document.createElement("a");
  a2.href = RELAY_VERSION_URL;
  a2.textContent = "relay /version";
  v.appendChild(a2);
  el.appendChild(v);
}

// --- boot -------------------------------------------------------------

async function main() {
  renderStamp();
  if (typeof DecompressionStream === "undefined") {
    status("this browser has no DecompressionStream; cannot gunzip the snapshot", true);
    return;
  }

  const t0 = performance.now();

  status("checking for the relay...");
  const probe = await probeRelay();
  networked = probe === "ok";

  if (networked) {
    // The good-news banner, and it used to describe the plumbing rather
    // than say anything useful: "the guest can reach the configured API
    // provider through the local relay". Same defect as the offline
    // notice on the other branch of this if, and worse, because "the
    // local relay" is FACTUALLY WRONG on the deployed page: RELAY_WS is
    // wss://relay.temur.live and the relay is a VPS, local to nobody.
    // Another laptop-era leftover, on the tier every ordinary visitor
    // sees. What a visitor needs from this line is whether setting up a
    // key is worth their time.
    noticeEl.textContent =
      "Networked tier: this sandbox can reach an AI provider, so a key " +
      "you set up here will work.";
    noticeEl.className = "notice ok";
  } else {
    // WRITTEN FOR A VISITOR, NOT FOR THE DEVELOPER WHO BUILT THIS. The
    // old wording ended "Start the relay and reload", which told a
    // stranger to start a server they have no access to: a leftover
    // from when this page only ever ran on a laptop, where it was a
    // real instruction. It also spent its words on "relay", "guest" and
    // a wss:// URL, and never said the one thing that would have saved
    // the reader any time, which is that setting up a key here cannot
    // work. An operator lost exactly that time on the live page.
    //
    // The endpoint still matters for OUR debugging, so it goes to the
    // console below rather than into the reader's first sentence.
    noticeEl.textContent =
      "NO PROVIDER: this sandbox cannot reach an AI provider at the " +
      "moment, so an API key will not help here.";
    noticeEl.className = "notice warn";
    console.info("temur sandbox: offline tier, no relay reachable at " + RELAY_WS);
  }

  // A refusal is NOT an outage and must not be described as one. The
  // tier is the same offline tier either way, but the reason is
  // different and only one of the two is worth waiting out.
  if (probe === "refused") {
    noticeEl.textContent = "NO PROVIDER: " + sharedAddressText();
    noticeEl.className = "notice warn";
  }

  const snapUrl = networked ? SNAP_ONLINE : SNAP_OFFLINE;
  let state;
  try {
    state = await fetchState(snapUrl);
  } catch (e) {
    status("snapshot fetch failed: " + e.message, true);
    return;
  }
  const tFetched = performance.now();

  status("restoring machine state (" + fmtMB(state.buf.byteLength) + ")...");
  barEl.style.width = "100%";

  const opts = {
    wasm_path: "vendor/v86.wasm",
    bios: { url: "vendor/seabios.bin" },
    vga_bios: { url: "vendor/vgabios.bin" },
    memory_size: MEM_MB * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    autostart: false,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
  };
  if (networked) {
    // dns_method MUST be "static". The wisp backend defaults it to "doh",
    // which would make this page do DNS-over-HTTPS to cloudflare-dns.com:
    // off-box egress, from the page, without the user asking. The guest
    // resolves nothing anyway - its /etc/hosts pins each allowed API
    // hostname to an address the relay maps back.
    opts.net_device = {
      type: "ne2k",
      relay_url: RELAY_WISP,
      dns_method: "static",
    };
  }

  const emulator = new V86(opts);
  window.emulator = emulator;

  let outBuf = [];
  let flushQueued = false;
  function flush() {
    flushQueued = false;
    if (!outBuf.length) return;
    const bytes = Uint8Array.from(outBuf);
    outBuf = [];
    term.write(bytes);
  }
  emulator.add_listener("serial0-output-byte", (byte) => {
    if (pending.length) {
      lastEcho = Math.round(performance.now() - pending.shift());
      pending.length = 0;
    }
    if (tuiReadyMs === null) {
      altSeen = (altSeen + String.fromCharCode(byte)).slice(-16);
      if (altSeen.includes("[?1049h")) {
        tuiReadyMs = Math.round(performance.now() - t0);
        if (window.__p3) window.__p3.tuiReadyMs = tuiReadyMs;
      }
    }
    outBuf.push(byte);
    if (!flushQueued) {
      flushQueued = true;
      requestAnimationFrame(flush);
    }
  });

  const enc = new TextEncoder();
  term.onData((data) => {
    pending.push(performance.now());
    for (const byte of enc.encode(data)) {
      emulator.serial0_send(String.fromCharCode(byte));
    }
  });

  emulator.add_listener("emulator-ready", async () => {
    const tR = performance.now();
    await emulator.restore_state(state.buf);
    const restoreMs = Math.round(performance.now() - tR);
    emulator.run();

    const send = (s) => {
      for (const ch of s) emulator.serial0_send(ch);
    };

    const q = new URLSearchParams(location.search);
    setTimeout(() => {
      if (networked) send(NET_NUDGE);
      setTimeout(
        () => {
          // The networked tier lands at temur's own setup wizard; the
          // offline tier starts temur directly. netcheck is the one
          // exception: it drives the terminal itself, so the wizard must
          // not be sitting on the same tty waiting for an answer.
          if (!networked) send(LAUNCH_OFFLINE);
          else if (!q.has("netcheck")) send(LAUNCH_INIT);
          const totalMs = Math.round(performance.now() - t0);
          window.__p3 = {
            tier: networked ? "networked" : "offline",
            wireBytes: state.wire,
            stateBytes: state.buf.byteLength,
            fetchMs: Math.round(tFetched - t0),
            restoreMs: restoreMs,
            readyMs: totalMs,
          };
          if (networked) {
            window.__p3.relayWatch = watchRelay(emulator).mode;
            noticeEl.textContent =
              "Networked tier. The terminal is running  temur init , temur's " +
              "own setup wizard: pick a provider, then paste your API key at " +
              "its hidden prompt (paste with Ctrl-Shift-V). The key is typed " +
              "into the emulated machine, not into this page, and it is gone " +
              "when you close the tab. Ctrl-C leaves the wizard at a shell, " +
              "where  temur init ,  temur  and  temur doctor  are the three " +
              "commands.";
            noticeEl.className = "notice ok";
          }
          status(
            "ready (" +
              window.__p3.tier +
              "): temur running at " +
              COLS +
              "x" +
              ROWS +
              "\nfetch " +
              window.__p3.fetchMs +
              " ms / restore " +
              restoreMs +
              " ms / launch sent at " +
              totalMs +
              " ms",
          );
          document.getElementById("bar").style.display = "none";
          term.focus();
          if (q.has("selftest")) selftest();
          // netcheck proves the NETWORKED tier from the browser without
          // capturing anything: it runs the keyless doctor probe and
          // posts nothing at all. The evidence is the relay's own
          // connection log, which never contains payload.
          if (q.has("netcheck") && networked) {
            netcheck(send);
          }
          // relaycheck proves the relay-loss banner. It reads the BANNER,
          // never the terminal buffer, so unlike the self-test it carries
          // no way to leak a key even if one existed.
          if (q.has("relaycheck") && networked) {
            relaycheck();
          }
          // landingcheck proves the page's own landing reached the guest.
          if (q.has("landingcheck") && networked) {
            landingcheck();
          }
        },
        networked ? 900 : 300,
      );
    }, 400);
  });
}

// --- self-test ------------------------------------------------------
//
// REFUSES TO RUN IN THE NETWORKED TIER. The self-test reads the terminal
// buffer and POSTs it to the local server. In the networked tier a real
// key may have been typed into temur, and a screen capture is exactly how
// a key would escape into a file. This is enforced here rather than left
// as an instruction, so no operator step can turn it on by accident.

function screen() {
  const b = term.buffer.active;
  const lines = [];
  for (let i = 0; i < b.length; i++) {
    const line = b.getLine(i);
    if (line) lines.push(line.translateToString(true));
  }
  return lines.join("\n").replace(/\n+$/, "");
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function selftest() {
  if (networked) {
    status(
      "selftest REFUSED: it captures the terminal, and the networked tier " +
        "may contain a key. Run it against the offline tier only.",
      true,
    );
    return;
  }
  const rep = {
    mode: "selftest",
    ...window.__p3,
    ua: navigator.userAgent,
    cols: COLS,
    rows: ROWS,
  };
  try {
    await wait(4000);
    rep.frameAfterLaunch = screen();
    term.input("hello from p3a");
    await wait(2500);
    rep.frameAfterTyping = screen();
    rep.echoMs = lastEcho;
    term.input(String.fromCharCode(127).repeat(14));
    await wait(2000);
    term.input("exit\r");
    await wait(5000);
    rep.frameAfterExit = screen();
    rep.tuiReadyMs = tuiReadyMs;
    rep.ok = true;
  } catch (e) {
    rep.ok = false;
    rep.error = String(e);
  }
  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rep, null, 1),
  });
  status("selftest posted (offline tier)");
}

main();

// --- netcheck ---------------------------------------------------------
//
// Proves the NETWORKED tier from a real browser. It runs the KEYLESS
// doctor probe and posts back ONE line: doctor's reachability verdict.
// It never captures the terminal buffer. It is safe only because it runs
// against a freshly restored, provably keyless snapshot before any
// operator has typed anything; it is not for use during a keyed session,
// which is why the capturing self-test refuses the networked tier outright.
async function netcheck(send) {
  // The init landing is suppressed for this mode, so the guest is at a
  // shell and this is the only thing typed into it.
  await wait(2500);
  send(NETCHECK_PROBE);
  await wait(12000);

  const flat = screen().replace(/\s+/g, " ");
  const m = flat.match(/(PASS|FAIL): (un)?reachable:[^|]{0,90}/);
  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      {
        mode: "netcheck",
        tier: "networked",
        tuiReadyMs: tuiReadyMs,
        // Page timings only. No terminal content leaves this function
        // except the one matched reachability line.
        wireBytes: window.__p3 && window.__p3.wireBytes,
        stateBytes: window.__p3 && window.__p3.stateBytes,
        fetchMs: window.__p3 && window.__p3.fetchMs,
        restoreMs: window.__p3 && window.__p3.restoreMs,
        readyMs: window.__p3 && window.__p3.readyMs,
        relayWatch: window.__p3 && window.__p3.relayWatch,
        line: m ? m[0].trim() : "(no reachability line found)",
      },
      null,
      1,
    ),
  });
  status("netcheck posted");
}

// --- relaycheck -------------------------------------------------------
//
// Watches for the relay-loss banner and posts what it saw. It reads only
// window.__p3 and the banner's own text, never the terminal, so it is
// safe by construction rather than by instruction. The operator kills the
// relay while this is waiting.
async function relaycheck() {
  const t0 = performance.now();
  let seen = null;
  let cleared = null;
  const appearBy = t0 + 60000;
  while (performance.now() < appearBy && !seen) {
    if (!bannerEl.hidden) {
      seen = {
        atMs: Math.round(performance.now() - t0),
        text: bannerEl.textContent.slice(0, 400),
        hasReloadButton: !!bannerEl.querySelector("button"),
      };
    }
    await wait(500);
  }
  // Second half: the operator restarts the relay and the banner must go
  // away on its own, or the notice is a one-way trap.
  if (seen) {
    const clearBy = performance.now() + 90000;
    while (performance.now() < clearBy && !cleared) {
      if (bannerEl.hidden) cleared = { atMs: Math.round(performance.now() - t0) };
      await wait(500);
    }
  }
  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      {
        mode: "relaycheck",
        tier: "networked",
        relayWatch: window.__p3 && window.__p3.relayWatch,
        bannerShown: !!seen,
        banner: seen,
        bannerCleared: !!cleared,
        clearedAt: cleared,
      },
      null,
      1,
    ),
  });
  status("relaycheck: banner " + (seen ? "appeared" : "MISSING") + ", cleared " + (cleared ? "yes" : "no"));
}

// --- landingcheck -----------------------------------------------------
//
// Proves that what the PAGE sends on the networked tier actually lands:
// the MOTD, then temur's wizard sitting at its first question. Like
// netcheck it matches ONE known line and posts that match, never the
// terminal buffer, so it cannot carry anything a visitor typed. It also
// reports the footer stamp, which is plain page text.
// It belongs in the same do-not-run-with-a-key list as the others.
async function landingcheck() {
  await wait(9000);
  const flat = screen().replace(/\s+/g, " ");
  const motd = /temur init\s+set up a provider/.test(flat);
  const prompt = /Template \[1\]:/.test(flat);
  const wrote = /Config will be written to: (\/\S+)/.exec(flat);
  const stampEl = document.getElementById("stamp");
  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      {
        mode: "landingcheck",
        tier: "networked",
        motdShown: motd,
        wizardAtFirstQuestion: prompt,
        configPath: wrote ? wrote[1] : null,
        relayWatch: window.__p3 && window.__p3.relayWatch,
        readyMs: window.__p3 && window.__p3.readyMs,
        stampText: stampEl ? stampEl.textContent.trim() : null,
        relayWs: RELAY_WS,
        relayWisp: RELAY_WISP,
      },
      null,
      1,
    ),
  });
  status("landingcheck posted");
}
