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

// THE P6 PAIR. Both tiers are now built from ONE kernel and ONE overlay,
// which is what finally gets console.sh and the MOTD to the offline tier:
// it used to be built from the P2-era rootfs and had never received
// either. The p5 and P2 snapshots stay committed beside these, untouched,
// as the record of what the keyed runs before this milestone used.
const SNAP_ONLINE = "assets/state-p6-net.bin.gz";
const SNAP_OFFLINE = "assets/state-p6-offline.bin.gz";

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
    // AND THE STRIP ADAPTS, rather than contradicting the line above it.
    // Its first step was a clickable "get an API key" sitting directly
    // over a notice that says a key will not help here, which sends the
    // reader off to spend real time on something this tier cannot use.
    // All three steps (get a key / answer the wizard / chat) describe the
    // networked flow and not one of them applies offline, so the whole
    // strip goes rather than just its link. The networked tier keeps it
    // exactly as the markup ships it.
    const stepsEl = document.getElementById("steps");
    if (stepsEl) stepsEl.hidden = true;
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
    // THE SHARE. Empty here on purpose: the snapshot carries the guest's
    // side of the mount, and the filesystem's contents come back with
    // the state. The emulator that restores must still be built with a
    // 9p device or there is nothing for that state to land in.
    filesystem: {},
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
          else if (!q.has("netcheck") && !q.has("filecheck"))
            send(LAUNCH_INIT);
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
          // The file panel appears only now, with the machine up and the
          // share mounted, so it cannot invite a drop that would go
          // nowhere.
          wireFiles(emulator);
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
          // filecheck proves the file path on BOTH tiers. It posts no
          // screen text, only booleans and hashes of bytes it generated
          // itself, which is what makes running it on the networked tier
          // safe where selftest is not.
          if (q.has("filecheck")) {
            filecheck(send);
          }
          // textcheck measures the diagnostics rule on both tiers.
          if (q.has("textcheck")) {
            textcheck();
          }
        },
        networked ? 900 : 300,
      );
    }, 400);
  });
}

// --- files in and out -------------------------------------------------
//
// The share is /files in the guest, which is also the guest's working
// directory, so a file that arrives here is already in front of temur
// with nothing to explain. The JS side of it is v86's 9p filesystem:
// create_file writes, read_file reads, and both are data in this tab.
//
// THE CAPS ARE MEASURED, NOT GUESSED. create_file itself is nearly free
// (1 MiB in 3 ms, 8 MiB in 3 ms, 16 MiB in 15 ms) because it is a write
// into this tab's memory. The cost that matters is the GUEST reading the
// file back, which ran at roughly 200 ms per MiB on this machine: 0.6 s
// at 1 MiB, 1.6 s at 8 MiB, 3.0 s at 16 MiB. Content hashes matched at
// every size, so these are comfort limits, not correctness ones.
//
// 8 MiB per file is where a file stops being something the guest can
// pick up briskly, and it is already far past anything a model will read
// in one go. 32 MiB in total keeps the whole share well inside a guest
// that has 128 MB of RAM and a filesystem that lives in this tab, with
// room for the machine itself.
//
// They are refusals, never truncations. A file silently cut in half is
// worse than a file that did not arrive, because the visitor would find
// out from the model's confusion rather than from the page.
const FILE_MAX_BYTES = 8 * 1024 * 1024;
const SHARE_MAX_BYTES = 32 * 1024 * 1024;

const filesEl = document.getElementById("files");
const fileListEl = document.getElementById("filelist");
const fileMsgEl = document.getElementById("filesmsg");
const fileInputEl = document.getElementById("fileinput");
const fileAddEl = document.getElementById("fileadd");

function fmtBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}

// One plain sentence, and it stays until the next action replaces it.
function fileMsg(text) {
  if (!fileMsgEl) return;
  if (!text) {
    fileMsgEl.hidden = true;
    fileMsgEl.textContent = "";
    return;
  }
  fileMsgEl.textContent = text;
  fileMsgEl.hidden = false;
}

// v86 has no public listing call, so this reads the filesystem object
// directly and is written to survive not finding what it expects: a
// listing that throws would take the whole panel down with it, and the
// panel is not important enough to cost anyone their session.
function shareList(emulator) {
  try {
    const fs9p = emulator && emulator.fs9p;
    if (!fs9p || typeof fs9p.read_dir !== "function") return [];
    const names = fs9p.read_dir("/") || [];
    return names.map((name) => {
      let size = 0;
      try {
        const p = fs9p.SearchPath(name);
        if (p && p.id !== -1) size = fs9p.GetInode(p.id).size || 0;
      } catch (e) {}
      return { name, size };
    });
  } catch (e) {
    return [];
  }
}

function shareTotal(emulator) {
  return shareList(emulator).reduce((a, f) => a + f.size, 0);
}

function renderFiles(emulator) {
  if (!filesEl) return;
  filesEl.hidden = false;
  const list = shareList(emulator);
  fileListEl.textContent = "";
  for (const f of list) {
    const li = document.createElement("li");
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = f.name;
    const sz = document.createElement("span");
    sz.className = "sz";
    sz.textContent = fmtBytes(f.size);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "download";
    btn.addEventListener("click", () => downloadOne(emulator, f.name));
    li.appendChild(nm);
    li.appendChild(sz);
    li.appendChild(btn);
    fileListEl.appendChild(li);
  }
}

async function downloadOne(emulator, name) {
  try {
    fileMsg("reading " + name + "...");
    const bytes = await emulator.read_file(name);
    if (!bytes) {
      fileMsg("Could not read " + name + " from the machine.");
      return;
    }
    // A blob URL and a synthetic click: the bytes never leave the tab,
    // and nothing is fetched, so the CSP is untouched by this.
    const url = URL.createObjectURL(new Blob([bytes]));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoked on a turn of the loop rather than immediately: some
    // browsers have not finished with the URL when click() returns.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    fileMsg("");
  } catch (e) {
    fileMsg("Could not read " + name + ": " + e.message);
  }
}

async function addFiles(emulator, fileHandles) {
  const incoming = Array.from(fileHandles || []);
  if (!incoming.length) return;

  let total = shareTotal(emulator);
  for (const f of incoming) {
    // Per-file cap first, so the message names the file that is wrong
    // rather than blaming the share for being full.
    if (f.size > FILE_MAX_BYTES) {
      // NOT "is 8.0 MB and the limit is 8.0 MB", which is what naming
      // both rounded sizes produced for a file one byte over: a refusal
      // that reads as a contradiction and makes the page look broken
      // rather than strict. Caught in the browser check.
      fileMsg(
        f.name + " is larger than the " + fmtBytes(FILE_MAX_BYTES) +
          " limit for one file, so it was not added.",
      );
      continue;
    }
    if (total + f.size > SHARE_MAX_BYTES) {
      fileMsg(
        f.name + " would take the machine past its " +
          fmtBytes(SHARE_MAX_BYTES) + " total, so it was not added.",
      );
      continue;
    }
    try {
      // Progress, because reading a large file off disk is not instant
      // even though the write into the machine is.
      fileMsg("adding " + f.name + " (" + fmtBytes(f.size) + ")...");
      const buf = new Uint8Array(await f.arrayBuffer());
      await emulator.create_file(f.name, buf);
      total += f.size;
      fileMsg(f.name + " is in /files.");
    } catch (e) {
      fileMsg("Could not add " + f.name + ": " + e.message);
    }
  }
  renderFiles(emulator);
}

function wireFiles(emulator) {
  if (!filesEl) return;
  renderFiles(emulator);

  if (fileAddEl && fileInputEl) {
    fileAddEl.addEventListener("click", () => fileInputEl.click());
    fileInputEl.addEventListener("change", async () => {
      await addFiles(emulator, fileInputEl.files);
      // Cleared so the same file can be chosen twice in a row.
      fileInputEl.value = "";
    });
  }

  // Drag and drop onto the terminal itself. dragover must be cancelled
  // or the browser navigates to the file and the machine is gone.
  const termEl = document.getElementById("term");
  if (termEl) {
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    termEl.addEventListener("dragenter", (e) => {
      stop(e);
      termEl.classList.add("dropping");
    });
    termEl.addEventListener("dragover", (e) => {
      stop(e);
      termEl.classList.add("dropping");
    });
    termEl.addEventListener("dragleave", (e) => {
      stop(e);
      termEl.classList.remove("dropping");
    });
    termEl.addEventListener("drop", async (e) => {
      stop(e);
      termEl.classList.remove("dropping");
      await addFiles(emulator, e.dataTransfer && e.dataTransfer.files);
    });
  }

  // The guest writes to the share too, and nothing tells the page when.
  // A slow poll is enough for a list that is usually empty and never
  // long, and it costs a directory read of an in-memory filesystem.
  setInterval(() => renderFiles(emulator), 2000);

  // Named so the browser harness can drive exactly what a visitor's
  // click drives, rather than a parallel path written for the test.
  window.__files = {
    list: () => shareList(emulator),
    add: (fh) => addFiles(emulator, fh),
    download: (n) => downloadOne(emulator, n),
    caps: { FILE_MAX_BYTES, SHARE_MAX_BYTES },
    msg: () => (fileMsgEl ? fileMsgEl.textContent : ""),
  };
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

// --- filecheck --------------------------------------------------------
//
// Proves the PAGE's own file path, on both tiers, the way a visitor
// drives it: through window.__files, which is the same code the button
// and the drop handler call. A parallel path written for the test would
// prove only that the test works.
//
// IT NEVER POSTS THE TERMINAL. selftest refuses the networked tier
// outright because it captures the screen and a visitor's key could be
// on it. This mode reads the screen too, but only to pull one 64-hex
// sha256 out of it with a regex, and it posts booleans and hashes of
// bytes THIS PAGE generated. No screen text is captured or sent, which
// is why it is safe to run on both tiers, and running on both is the
// point: proofs follow the visitor.
//
// The wizard is suppressed for this mode on the networked tier, for the
// same reason netcheck suppresses it: this mode types at the shell, and
// the wizard must not be sitting on the same tty waiting for an answer.
async function sha256Hex(bytes) {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function filecheck(send) {
  const rep = { mode: "filecheck", tier: networked ? "networked" : "offline" };
  await wait(networked ? 2500 : 1500);

  // ---- upload, through the page's own add path -------------------
  const up = new Uint8Array(64 * 1024);
  crypto.getRandomValues(up);
  const upSha = await sha256Hex(up);
  const upName = "filecheck-up.bin";
  await window.__files.add([new File([up], upName)]);
  rep.uploadListed = window.__files.list().some((f) => f.name === upName);

  // The guest's own view of those bytes. This is the half that a JS-side
  // check cannot give: it proves the file crossed into the machine.
  term.clear();
  send("sha256sum /files/" + upName + "\r");
  await wait(4000);
  const upSeen = /\b[0-9a-f]{64}\b/.exec(screen());
  rep.uploadGuestSha = upSeen ? upSeen[0] : null;
  rep.uploadShaMatches = !!upSeen && upSeen[0] === upSha;
  rep.uploadBytes = up.length;

  // ---- download, guest bytes back out ----------------------------
  const downName = "filecheck-down.bin";
  term.clear();
  send(
    "dd if=/dev/urandom of=/files/" + downName +
      " bs=1024 count=64 2>/dev/null; sha256sum /files/" + downName + "\r",
  );
  await wait(5000);
  const downSeen = /\b[0-9a-f]{64}\b/.exec(screen());
  rep.downloadGuestSha = downSeen ? downSeen[0] : null;
  const back = await emulator.read_file(downName);
  rep.downloadPageSha = back ? await sha256Hex(back) : null;
  rep.downloadShaMatches =
    !!rep.downloadGuestSha && rep.downloadGuestSha === rep.downloadPageSha;
  rep.downloadBytes = back ? back.length : 0;
  rep.downloadListed = window.__files.list().some((f) => f.name === downName);

  // The real button, once, to prove the anchor path does not throw under
  // this CSP. The saved file itself is the browser's business; what is
  // asserted here is that the page got the bytes and the click ran.
  let clickThrew = null;
  try {
    await window.__files.download(downName);
  } catch (e) {
    clickThrew = e.message;
  }
  rep.downloadClickThrew = clickThrew;

  // ---- the caps refuse, and say so in one sentence ---------------
  const caps = window.__files.caps;
  rep.caps = caps;

  const overOne = new Uint8Array(caps.FILE_MAX_BYTES + 1);
  const beforeOne = window.__files.list().length;
  await window.__files.add([new File([overOne], "too-big.bin")]);
  rep.perFileRefused = window.__files.list().length === beforeOne;
  rep.perFileMessage = window.__files.msg();

  // Fill toward the total with files that each pass the per-file cap, so
  // the SECOND cap is what refuses and not the first.
  const chunk = new Uint8Array(caps.FILE_MAX_BYTES);
  let guard = 0;
  while (
    window.__files.list().reduce((a, f) => a + f.size, 0) +
      caps.FILE_MAX_BYTES <=
      caps.SHARE_MAX_BYTES &&
    guard < 8
  ) {
    await window.__files.add([new File([chunk], "fill" + guard + ".bin")]);
    guard += 1;
  }
  const beforeTotal = window.__files.list().length;
  rep.totalBeforeRefusal = window.__files
    .list()
    .reduce((a, f) => a + f.size, 0);
  await window.__files.add([new File([chunk], "one-too-many.bin")]);
  rep.totalRefused = window.__files.list().length === beforeTotal;
  rep.totalMessage = window.__files.msg();

  rep.ok =
    rep.uploadListed &&
    rep.uploadShaMatches &&
    rep.downloadShaMatches &&
    rep.downloadListed &&
    rep.downloadClickThrew === null &&
    rep.perFileRefused &&
    rep.totalRefused;

  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rep, null, 1),
  });
  status("filecheck posted: " + (rep.ok ? "ok" : "FAILED"));
}

// --- textcheck --------------------------------------------------------
//
// The diagnostics-in-visitor-text rule, made checkable. The page has been
// through a reduction pass whose whole point was that a visitor should
// not have to read this project's vocabulary to use it, and the file
// panel is new visitor-facing text, so the rule is measured again rather
// than assumed to still hold.
//
// FOUR NUMBERS: markup and rendered text, on each tier. Markup catches a
// term hidden in an attribute or a hidden element that a later change
// could reveal; rendered text catches what is actually on screen. Both
// are counted because either alone can be gamed by accident.
//
// /files is NOT a diagnostic and is not in this list. The share path is
// deliberate visitor-facing text: the brief requires the MOTD and the
// page to print the same short path, and a visitor who is told where
// their file went is better off than one who is not.
const DIAGNOSTIC_TERMS = [
  "wisp",
  "virtio",
  "9p",
  "fs9p",
  "create_file",
  "read_file",
  "msize",
  "initramfs",
  "bzImage",
  "cpio",
  "snapshot",
  "PAGE_DEV_RELAY",
  "127.0.0.1",
  "localhost",
  "undefined",
  "NaN",
  "[object Object]",
];

async function textcheck() {
  await wait(networked ? 3000 : 2000);
  const markup = document.body.innerHTML;
  const shown = document.body.innerText || document.body.textContent || "";
  // TWO THINGS THIS COUNT MUST NOT DO, both found by running it.
  //
  // A plain substring match counted "9p" fifty times in the markup, all
  // of them inside "9px" in xterm's inline styles. A check that reports
  // a CSS length as a leaked kernel term is worse than no check, so the
  // match is bounded.
  //
  // And the relay endpoint the page is CONFIGURED with is not a leak.
  // Locally that is 127.0.0.1 because the harness passes PAGE_DEV_RELAY;
  // on the deployed page it is relay.temur.live, and either way it is a
  // deliberate value in a link, not a diagnostic that escaped. It is
  // removed from the haystack rather than excused in the total, so what
  // remains is genuinely unexplained.
  const scrub = (hay) => {
    let h = hay;
    for (const u of [RELAY_WS, RELAY_WISP]) {
      if (!u) continue;
      const host = String(u).replace(/^\w+:\/\//, "").replace(/\/$/, "");
      while (h.includes(host)) h = h.replace(host, "");
      const bare = host.split(":")[0];
      while (h.includes(bare)) h = h.replace(bare, "");
    }
    return h;
  };
  const countIn = (hayRaw) => {
    const hay = scrub(hayRaw).toLowerCase();
    const hits = {};
    let total = 0;
    for (const t of DIAGNOSTIC_TERMS) {
      const esc = t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Bounded on both sides, so "9p" does not match "9px" and "cpio"
      // does not match a longer word that happens to contain it.
      const re = new RegExp("(^|[^a-z0-9_])" + esc + "([^a-z0-9_]|$)", "g");
      const n = (hay.match(re) || []).length;
      if (n) {
        hits[t] = n;
        total += n;
      }
    }
    return { total, hits };
  };
  const inMarkup = countIn(markup);
  const inShown = countIn(shown);
  await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      {
        mode: "textcheck",
        tier: networked ? "networked" : "offline",
        terms: DIAGNOSTIC_TERMS.length,
        markupCount: inMarkup.total,
        markupHits: inMarkup.hits,
        textCount: inShown.total,
        textHits: inShown.hits,
        // Proof the panel is really on the page when this was measured,
        // so a zero cannot come from the panel simply being absent.
        filePanelPresent: !!document.getElementById("files") &&
          !document.getElementById("files").hidden,
        sharePathShown: /\/files/.test(shown),
        ok: inMarkup.total === 0 && inShown.total === 0,
      },
      null,
      1,
    ),
  });
  status("textcheck posted");
}

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
  // WAS motdShown, AND IT MEASURED NOTHING. It matched the in-guest motd
  // that the reduction pass stopped printing, so it had been permanently
  // false since a89b87b: a check that can only ever say no is worse than
  // no check, because it reads like a covered case. What is worth
  // asserting on this screen now is the landing fix that replaced it,
  // the `clear;` in LAUNCH_INIT: neither the four-line NET_NUDGE echo nor
  // the launch line itself may still be above the wizard.
  const clean = !/ip addr flush|ip neigh flush|temur init &&/.test(flat);
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
        cleanLanding: clean,
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
