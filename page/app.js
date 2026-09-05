// Sandbox P3a: temur in the browser, with BYO-key networking.
//
// TWO TIERS.
//   offline   - the P2 snapshot, no NIC, no relay. Always available.
//   networked - the P3a snapshot, ne2k NIC, traffic to a WISP relay.
// The page probes the relay first and falls back to the offline tier with
// a plain notice rather than half-working.
//
// THE PAGE IS NEVER IN THE KEY PATH. There is no key input field here and
// there never will be one: the key is typed into temur inside the
// terminal, in the guest. That is the strongest form of the trust story,
// because the page has nothing to leak.
//
// Terminal geometry is fixed at 80x24 (see P2). Dynamic resize is parked.

const COLS = 80;
const ROWS = 24;
const MEM_MB = 128;

// The relay URL is a knob: P3a is 127.0.0.1 and nothing else. P3b, if it
// is ever authorized, flips this and NOTHING else on the page.
const RELAY_WISP = "wisp://127.0.0.1:8089/";
const RELAY_WS = "ws://127.0.0.1:8089/";

const SNAP_ONLINE = "assets/state-p4-page.bin.gz";
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

const LAUNCH = "TERM=xterm temur\n";

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

const term = new Terminal({
  cols: COLS,
  rows: ROWS,
  convertEol: false,
  cursorBlink: true,
  fontSize: 14,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  theme: { background: "#000000", foreground: "#d0d0d0" },
});
term.open(document.getElementById("term"));

// --- is the relay there? ---------------------------------------------
//
// A plain websocket open attempt. If it fails the page says so and runs
// the offline tier, rather than booting a networked guest whose requests
// would all hang.
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
      return finish(false);
    }
    ws.onopen = () => {
      try {
        ws.close();
      } catch (e) {}
      finish(true);
    };
    ws.onerror = () => finish(false);
    ws.onclose = () => finish(false);
    setTimeout(() => {
      try {
        ws.close();
      } catch (e) {}
      finish(false);
    }, timeoutMs);
  });
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
  const state = { mode: "none", up: true };

  function lost() {
    if (!state.up) return;
    state.up = false;
    bannerEl.textContent =
      "Relay connection lost. Requests from the guest will HANG rather " +
      "than fail: the connection was accepted inside this page before the " +
      "relay went away, so nothing tells the guest it is gone. Restart the " +
      "relay and this notice clears, or reload to run the offline tier.";
    const btn = document.createElement("button");
    btn.textContent = "reload for the offline tier";
    btn.onclick = () => location.reload();
    bannerEl.appendChild(document.createElement("br"));
    bannerEl.appendChild(btn);
    bannerEl.hidden = false;
  }
  function back() {
    if (state.up) return;
    state.up = true;
    bannerEl.textContent = "";
    bannerEl.hidden = true;
  }

  const adapter = findWispAdapter(emulator);
  if (adapter) {
    state.mode = "adapter-socket";
    setInterval(() => {
      const ws = adapter.wispws;
      if (ws && ws.readyState === WebSocket.OPEN) back();
      else lost();
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
      mon.onclose = () => { lost(); setTimeout(open, 3000); };
      mon.onerror = () => lost();
    };
    open();
  }
  return state;
}

// --- boot -------------------------------------------------------------

async function main() {
  if (typeof DecompressionStream === "undefined") {
    status("this browser has no DecompressionStream; cannot gunzip the snapshot", true);
    return;
  }

  const t0 = performance.now();

  status("checking for the relay...");
  networked = await probeRelay();

  if (networked) {
    noticeEl.textContent =
      "Networked tier: the guest can reach the configured API provider " +
      "through the local relay.";
    noticeEl.className = "notice ok";
  } else {
    noticeEl.textContent =
      "OFFLINE TIER: no relay is reachable at " +
      RELAY_WS +
      ", so this guest has no network. temur will run and everything " +
      "local to it works, but any request to a hosted provider will fail. " +
      "Start the relay and reload to use a hosted model.";
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

    setTimeout(() => {
      if (networked) send(NET_NUDGE);
      setTimeout(
        () => {
          // In the NETWORKED tier the page does not launch temur. temur
          // refuses to start for a hosted provider until a key exists
          // ("secret: APP_SECRET_FILE is not set"), and the page is not
          // allowed anywhere near a key, so it lands the operator at the
          // guest shell and tells them the two commands to run. The key
          // is typed inside the guest, into a helper that turns terminal
          // echo off; the page never sees a keystroke of it.
          if (!networked) send(LAUNCH);
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
              "Networked tier. You are at the guest shell. Run  temur-setkey  " +
              "to enter your API key (input is hidden, it is written only " +
              "inside this throwaway VM), then run  temur  to start. " +
              "This page has no key field and never reads your key.";
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
          const q = new URLSearchParams(location.search);
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
  const rep = { ...window.__p3, ua: navigator.userAgent, cols: COLS, rows: ROWS };
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
  // Nothing to quit: the networked tier lands at a shell.
  await wait(2500);
  send("temur doctor 2>&1 | grep -i reachable\n");
  await wait(9000);

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
