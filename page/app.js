// Sandbox P2, step 2: boot a usable temur TUI in the browser.
//
// The page restores a v86 snapshot that was taken at the guest shell
// prompt with the temur config already written and the tty already sized
// to 80x24. It does NOT download the kernel or the initrd: restore_state
// carries full memory and device state, so those 7.68 MB are dead weight
// here (proved in tools/restore-nokernel.mjs before relying on it).
//
// Terminal geometry is FIXED at 80x24 this phase. The snapshot's stty was
// taken at that size and temur reads the size once at startup, so a
// browser-side resize would desync the guest. Dynamic resize is P3+.

const COLS = 80;
const ROWS = 24;
const MEM_MB = 128;
const STATE_URL = "assets/state-page.bin.gz";

// Sent once the machine is running. The snapshot sits at the shell prompt,
// so this is what turns "a booted guest" into "a live temur prompt".
const LAUNCH = "TERM=xterm temur\n";

const statusEl = document.getElementById("status");
const barEl = document.querySelector("#bar > div");

let lastEcho = null;
const pending = [];

// Time to a real TUI, not just to "the launch line was sent". temur enters
// the alternate screen as its first act of drawing, so the first
// ESC [ ? 1049 h on the serial line is the honest "interactive" moment.
let tuiReadyMs = null;
let altSeen = "";

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

// --- fetch the snapshot, with a byte counter ------------------------

async function fetchState(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch " + url + ": HTTP " + res.status);
  const total = Number(res.headers.get("content-length") || 0);

  // Count the bytes actually on the wire, then gunzip in the browser.
  // The server sends the .gz verbatim with no Content-Encoding, so this
  // is a real transfer measurement and not a doubly-decompressed one.
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

// --- boot -----------------------------------------------------------

async function main() {
  if (typeof DecompressionStream === "undefined") {
    status("this browser has no DecompressionStream; cannot gunzip the snapshot", true);
    return;
  }

  const t0 = performance.now();
  let state;
  try {
    state = await fetchState(STATE_URL);
  } catch (e) {
    status("snapshot fetch failed: " + e.message, true);
    return;
  }
  const tFetched = performance.now();

  status(
    "restoring machine state (" +
      fmtMB(state.buf.byteLength) +
      " decompressed)...",
  );
  barEl.style.width = "100%";

  const emulator = new V86({
    wasm_path: "vendor/v86.wasm",
    bios: { url: "vendor/seabios.bin" },
    vga_bios: { url: "vendor/vgabios.bin" },
    memory_size: MEM_MB * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    autostart: false,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
  });
  window.emulator = emulator;

  // Guest -> terminal. Bytes arrive one at a time; batch them per frame
  // or the first full TUI repaint crawls.
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
        if (window.__p2) window.__p2.tuiReadyMs = tuiReadyMs;
      }
    }
    outBuf.push(byte);
    if (!flushQueued) {
      flushQueued = true;
      requestAnimationFrame(flush);
    }
  });

  // Terminal -> guest, as UTF-8 bytes.
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

    setTimeout(() => {
      for (const ch of LAUNCH) emulator.serial0_send(ch);
      const totalMs = Math.round(performance.now() - t0);
      window.__p2 = {
        wireBytes: state.wire,
        stateBytes: state.buf.byteLength,
        fetchMs: Math.round(tFetched - t0),
        restoreMs: restoreMs,
        readyMs: totalMs,
      };
      status(
        "ready: temur running at " +
          COLS +
          "x" +
          ROWS +
          "\nfetch " +
          window.__p2.fetchMs +
          " ms / restore " +
          restoreMs +
          " ms / page-open to interactive " +
          totalMs +
          " ms",
      );
      document.getElementById("bar").style.display = "none";
      term.focus();
      if (new URLSearchParams(location.search).has("selftest")) selftest();
      setInterval(() => {
        if (lastEcho !== null) {
          statusEl.textContent =
            statusEl.textContent.split("\nlast keypress")[0] +
            "\nlast keypress to first echoed byte: " +
            lastEcho +
            " ms";
        }
      }, 500);
    }, 400);
  });
}

// --- self-test ------------------------------------------------------
//
// Opened with ?selftest=1 the page drives itself and POSTs what it saw
// back to the local server. That is how a headless build session gets
// hard evidence out of a real browser: the literal xterm buffer text at
// three points, plus the timings. term.input() goes through the same
// onData path a physical keystroke does, so the echo figure is real.

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
  const rep = { ...window.__p2, ua: navigator.userAgent, cols: COLS, rows: ROWS };
  try {
    await wait(4000);
    rep.frameAfterLaunch = screen();

    term.input("hello from p2");
    await wait(2500);
    rep.frameAfterTyping = screen();
    rep.echoMs = lastEcho;

    term.input(String.fromCharCode(127).repeat(13));
    await wait(2000);
    rep.frameAfterErase = screen();

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
  status("selftest posted");
}

main();
