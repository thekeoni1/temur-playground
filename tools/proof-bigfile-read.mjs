// THE FILE-CAP GATE: can the 128 MB guest read a document at the NEW
// 16 MiB per-file cap without dying?
//
// The page's per-file cap went 8 MiB -> 16 MiB. The files live in the
// visitor's tab and never reach a server, so the only real cost is that
// visitor's memory, and the one place that can actually break is INSIDE
// the guest: temur's office reader pulls one document into a machine with
// 128 MB of RAM, and MEM_MB is deliberately not being raised. So the cap
// raise ships only if this passes.
//
// THE MECHANISM IS tools/proof-office-read.mjs, UNCHANGED IN SUBSTANCE.
// Files arrive by emulator.create_file, which is the page's own drop
// path. A scripted model (tools/guest-stub-model.sh, reused as committed)
// stands on guest loopback, because no temur surface ever prints tool
// output and the extracted text exists only in the request body temur
// sends its provider. Those bodies are written into the share and read
// back over 9p here, so what is checked is the guest's own bytes.
//
// WHAT PASSES. A clean read (the document's marker line comes back in the
// tool result) OR temur's own graceful size refusal. Both are the machine
// behaving. WHAT FAILS: the guest dying (OOM kill, kernel panic, a dead
// console) or the run hanging.
//
// TWO TURNS, NOT ONE, because the memory has to be read BETWEEN the two
// reads. Each turn is a separate `temur -p`, the stub's counter and plan
// are reset between them, and turn one's request bodies are read back
// before turn two can overwrite them.
//
// THE COMMAND-ECHO TRAP. The console echoes the command line back, so a
// grep for a word the command itself contains matches whether or not the
// command ran. This repository has been bitten by it twice. Every marker
// below is therefore SPLIT in the typed text ("MF""=") and whole in the
// pattern (/MF=/), which no echo can satisfy.
//
// NO STATE IS SAVED HERE and none can be: this run writes into the share,
// and the empty-at-snapshot assert refuses a snapshot built on a run that
// does.
//
// Usage: node tools/proof-bigfile-read.mjs <bzImage> <initrd> <state.bin> <label> [relayUrl]
import { V86 } from "v86";
import fs from "fs";
import { execFileSync } from "child_process";

const [bzimage, initrd, statePath, label, relayArg] = process.argv.slice(2);
const CMDLINE =
  "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";
const DOCS = "build/bigfiles";
const CAP = 16 * 1024 * 1024;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Generated, not committed: two valid documents just under the new cap,
// each with a known first line so a clean read is an exact match.
execFileSync("python3", ["tools/mkbig-sample.py", DOCS], { stdio: "inherit" });

const DOCUMENTS = [
  {
    name: "big.pdf",
    marker: "BIG-PDF-PAGE-ONE-MARKER",
    // The two refusals temur could legitimately give for a large PDF.
    refusal: /over the \d+ MiB limit for documents|no text layer/,
  },
  {
    name: "big.xlsx",
    marker: "BIG-XLSX-ROW-ONE-MARKER",
    refusal: /over the \d+ MiB limit for documents|expands to more than \d+ MiB/,
  },
];

for (const d of DOCUMENTS) {
  d.bytes = fs.readFileSync(DOCS + "/" + d.name);
  d.size = d.bytes.length;
  if (d.size > CAP) {
    console.log("ABORT: " + d.name + " is over the 16 MiB cap, a visitor could not drop it");
    process.exit(2);
  }
}

const cfg = {
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" },
  vga_bios: { url: "./bios/vgabios.bin" },
  bzimage: { url: bzimage },
  initrd: { url: initrd },
  cmdline: CMDLINE,
  // NOT RAISED. The whole question is whether the new cap fits the guest
  // every visitor already gets, so this must stay what the page ships.
  memory_size: 128 * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  filesystem: {},
  autostart: false,
  disable_keyboard: true,
  disable_mouse: true,
  disable_speaker: true,
};
if (relayArg) {
  cfg.net_device = { type: "ne2k", relay_url: relayArg, dns_method: "static" };
}

const emulator = new V86(cfg);
// UTF-8 decoded as a whole buffer, not byte by byte: temur marks a
// finished tool with U+2713 / U+2717 and per-byte fromCharCode splits
// those into replacement characters, failing a run that worked.
let buf = [];
const decoder = new TextDecoder("utf-8");
let out = "";
const sync = () => { out = decoder.decode(new Uint8Array(buf)); return out; };
emulator.add_listener("serial0-output-byte", (b) => { buf.push(b); });
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };

let timedOut = false;
async function until(re, ms = 60000, what = "") {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (re.test(sync())) return true;
    await wait(250);
  }
  timedOut = true;
  console.log("  TIMEOUT waiting for " + re + " " + what);
  console.log("  tail: " + JSON.stringify(sync().slice(-900)));
  return false;
}

async function run(cmd, ms = 30000) {
  const mark = "M" + Math.random().toString(36).slice(2, 8);
  buf = [];
  send(cmd + "; " + "echo " + mark + "''RC=$?\r");
  const ok = await until(new RegExp(mark + "RC=\\d"), ms, cmd);
  const text = sync();
  const m = text.match(new RegExp(mark + "RC=(\\d+)"));
  return { out: text, rc: m ? Number(m[1]) : null, finished: ok };
}

const results = {};
let failed = 0;
function check(name, ok, detail) {
  results[name] = { ok: !!ok, detail };
  if (!ok) failed += 1;
  console.log((ok ? "  PASS  " : "  FAIL  ") + name + (detail ? "  " + detail : ""));
}

// ---- the memory reading ------------------------------------------------
// BOTH MemFree AND MemAvailable, because they answer different questions.
// Reading a 15.5 MiB file over 9p fills the guest's page cache, which
// MemFree counts as gone and MemAvailable counts as reclaimable, so
// MemFree alone would make a healthy read look like a leak.
const memory = [];
async function mem(when) {
  const r = await run(
    "awk '/^MemFree:/{f=$2} /^MemAvailable:/{a=$2} /^Cached:/{c=$2} " +
      'END{print "MF""=" f " MA""=" a " CA""=" c}\' /proc/meminfo',
  );
  const m = r.out.match(/MF=(\d+) MA=(\d+) CA=(\d+)/);
  const row = m
    ? {
        when,
        memFreeKb: Number(m[1]),
        memAvailableKb: Number(m[2]),
        cachedKb: Number(m[3]),
      }
    : { when, memFreeKb: null, memAvailableKb: null, cachedKb: null };
  memory.push(row);
  console.log(
    "  MEM  " +
      when.padEnd(28) +
      "MemFree " +
      (row.memFreeKb === null ? "?" : (row.memFreeKb / 1024).toFixed(1) + " MB") +
      "   MemAvailable " +
      (row.memAvailableKb === null
        ? "?"
        : (row.memAvailableKb / 1024).toFixed(1) + " MB") +
      "   Cached " +
      (row.cachedKb === null ? "?" : (row.cachedKb / 1024).toFixed(1) + " MB"),
  );
  return row;
}

// ---- the PEAK, which is the number the OOM question turns on ----------
// A reading taken after a read shows the NET change, and the allocator has
// already given the pages back by then: the offline run moved MemFree only
// 6 MB across both documents while the same binary peaked at 79 MB of RSS
// on the host. So the headroom claim cannot rest on before/after alone.
// A sampler runs in the guest for the length of the turn and the MINIMUM
// it sees is reported. It costs a shell and an awk once a second, which
// depresses the figure slightly - an error in the safe direction.
async function sampleStart() {
  const r = await run(
    "rm -f /tmp/memlog && touch /tmp/sampling && " +
      "( while [ -f /tmp/sampling ]; do " +
      "awk '/^MemFree:/{f=$2} /^MemAvailable:/{a=$2} END{print f\" \"a}' " +
      "/proc/meminfo >> /tmp/memlog; sleep 1; done ) & " +
      "sleep 1; echo SAMPL''ING",
  );
  return /SAMPLING/.test(r.out);
}

async function sampleStop() {
  // Stopping first, then reading: the loop notices the flag within its
  // one-second sleep.
  await run("rm -f /tmp/sampling; sleep 2; wc -l < /tmp/memlog");
  // awk's comma form needs no quotes at all, which keeps this free of the
  // nested-quote tangle; the marker is split by the shell instead, so the
  // echoed command line cannot satisfy the pattern.
  const r = await run(
    "awk 'NR==1||$1<mf{mf=$1} NR==1||$2<ma{ma=$2} END{print mf, ma, NR}' " +
      "/tmp/memlog > /tmp/mem-min; echo PK''MIN=$(cat /tmp/mem-min)",
  );
  const m = r.out.match(/PKMIN=(\d+) (\d+) (\d+)/);
  if (!m) return { minFreeKb: null, minAvailableKb: null, samples: 0 };
  const row = {
    minFreeKb: Number(m[1]),
    minAvailableKb: Number(m[2]),
    samples: Number(m[3]),
  };
  console.log(
    "  PEAK over " + row.samples + " samples during the read:  " +
      "lowest MemFree " + (row.minFreeKb / 1024).toFixed(1) + " MB" +
      "   lowest MemAvailable " + (row.minAvailableKb / 1024).toFixed(1) + " MB",
  );
  return row;
}

// The guest is alive if it can still answer. A dead console, an OOM kill
// of the shell or a panic all show up as this not coming back.
async function alive(when) {
  const r = await run("echo ALI''VE-" + when, 45000);
  const ok = /ALIVE-/.test(r.out) && r.rc === 0;
  return ok;
}

// A kernel OOM is loud. Anything matching here means the guest ran out,
// whether or not the shell survived it.
function oomSigns(text) {
  const hits = [];
  for (const re of [
    /Out of memory/i,
    /oom[-_ ]kill/i,
    /Killed process/i,
    /Kernel panic/i,
    /page allocation failure/i,
  ]) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

console.log("=== file-cap gate: " + label + " ===");
for (const d of DOCUMENTS) {
  console.log(
    "  " + d.name.padEnd(10) + d.size + " B  " + (d.size / 1048576).toFixed(2) + " MiB",
  );
}
const state = fs.readFileSync(statePath);

await new Promise((resolve) => {
  emulator.add_listener("emulator-ready", async () => {
    await emulator.restore_state(new Uint8Array(state).buffer);
    emulator.run();
    console.log("restored " + statePath + " (" + state.length + " B)");
    resolve();
  });
});

buf = [];
send("\r");
await until(/#\s$/, 30000, "prompt after restore");

let r = await run("temur --version");
check(
  "the snapshot's temur is v0.34.0",
  /temur 0\.34\.0/.test(r.out),
  (r.out.match(/temur \d+\.\d+\.\d+/) || [""])[0],
);
check("guest is responsive before anything is dropped", await alive("start"));

// ---- point 1: before the drop -----------------------------------------
await mem("1 before the drop");

// ---- the drop, by the page's own upload path --------------------------
const t0 = Date.now();
for (const d of DOCUMENTS) {
  await emulator.create_file(d.name, new Uint8Array(d.bytes));
}
await emulator.create_file("stub.sh", new Uint8Array(fs.readFileSync("tools/guest-stub-model.sh")));
const dropMs = Date.now() - t0;
console.log("  dropped both documents in " + dropMs + " ms (create_file, the page's path)");

r = await run("ls -l /files", 60000);
check(
  "both documents arrived over the page's upload path",
  DOCUMENTS.every((d) => r.out.includes(d.name)),
);
// Recorded, not asserted. These two together are 31.07 MiB, which fits
// the OLD 32 MiB share cap as well, so this pair says nothing about the
// share total; the 64 MiB total is proved in the browser by filecheck.
// What matters here is the PER-FILE cap, which is the one the guest pays.
const totalDropped = DOCUMENTS.reduce((a, d) => a + d.size, 0);
console.log(
  "  share now holds " + (totalDropped / 1048576).toFixed(2) +
    " MiB (the per-file cap is what this gate tests)",
);
await mem("1b after the drop");

// ---- stand the scripted model up on loopback --------------------------
r = await run("cp /files/stub.sh /tmp/stub.sh && chmod +x /tmp/stub.sh && echo COP''IED");
check("scripted model planted", r.rc === 0 && /COPIED/.test(r.out));

r = await run(
  "printf '127.0.0.1:8080 stream tcp nowait root /bin/sh sh /tmp/stub.sh\\n' " +
    "> /tmp/inetd.conf && inetd /tmp/inetd.conf && sleep 1 && " +
    "netstat -ltn 2>/dev/null | grep ':8080' && echo LISTEN''ING",
);
check(
  "scripted model listening on 127.0.0.1:8080",
  r.rc === 0 && /LISTENING/.test(r.out),
);

// The offline tier's shipped config already points at this loopback port,
// so that tier is used exactly as it ships. The networked tier carries no
// config, so a throwaway is written for the run.
let wroteConfig = false;
r = await run("[ -f /root/.config/temur/config.json ] && echo HAS''CFG || echo NO''CFG");
if (/NOCFG/.test(r.out)) {
  const c =
    '{"provider":"openai-compat","max_tokens":4096,"openai_compat":' +
    '{"base_url":"http://127.0.0.1:8080/v1","model":"guest-stub","context_window":8192}}';
  r = await run(
    "mkdir -p /root/.config/temur && printf '%s' '" + c +
      "' > /root/.config/temur/config.json && echo wrote-config",
  );
  wroteConfig = true;
  check("throwaway config written (this tier ships none)", r.rc === 0);
} else {
  check(
    "the tier's own shipped config is used unchanged",
    /HASCFG/.test(r.out),
    "its base_url is the loopback port the scripted model answers on",
  );
}

// ---- one turn per document -------------------------------------------
const reads = [];
for (const [i, d] of DOCUMENTS.entries()) {
  console.log("\n---- turn " + (i + 1) + ": " + d.name + " ----");

  // Reset the stub: one path in the plan, counter cleared, so this turn's
  // bodies land at req-1.json and req-2.json again.
  r = await run(
    "printf '/files/" + d.name + "\\n' > /tmp/stub-plan && rm -f /tmp/stub-count && " +
      "wc -l < /tmp/stub-plan",
  );
  check("turn " + (i + 1) + " read plan written", r.rc === 0 && /\b1\b/.test(r.out));

  const sampling = await sampleStart();
  check("turn " + (i + 1) + " memory sampler running", sampling);

  const tr0 = Date.now();
  r = await run("cd /files && temur -p 'read " + d.name + "' --plain 2>&1", 900000);
  const turnMs = Date.now() - tr0;
  const peak = await sampleStop();
  const turn = r.out;
  const oom = oomSigns(turn);

  const stillAlive = await alive("after-" + d.name);
  const reached = /OFFICE-READ-PROOF-END/.test(turn);
  const ok = (turn.match(/✓ read:/g) || []).length;
  const no = (turn.match(/✗ read:/g) || []).length;

  console.log(
    "  turn took " + (turnMs / 1000).toFixed(1) + " s; " + ok + " succeeded, " + no +
      " refused; reached the end: " + reached,
  );

  // THE GATE, stated as its two halves.
  check(
    "GATE " + d.name + ": the guest did not die",
    stillAlive && oom.length === 0,
    oom.length ? "OOM/panic signs in the console: " + JSON.stringify(oom) : "console still answers",
  );
  check(
    "GATE " + d.name + ": the page did not hang (the turn returned)",
    r.finished && reached,
    (turnMs / 1000).toFixed(1) + " s",
  );

  // ---- what temur actually sent, read back over 9p ------------------
  const bodies = [];
  for (let n = 1; n <= 4; n += 1) {
    // read_file REJECTS for a name that is not there rather than
    // resolving null, and a turn writes only as many bodies as it made
    // calls, so the probe past the last one must be caught.
    let rawBody = null;
    try {
      rawBody = await emulator.read_file("req-" + n + ".json");
    } catch (e) {
      continue;
    }
    if (!rawBody) continue;
    let body;
    try {
      body = JSON.parse(Buffer.from(rawBody).toString("utf8"));
    } catch (e) {
      continue;
    }
    for (const m of body.messages || []) {
      if (m.role !== "tool") continue;
      const text =
        typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      if (!bodies.includes(text)) bodies.push(text);
    }
  }
  const result = bodies[0] || "";
  console.log(
    "\n  ---- tool result for " + d.name + " (" + result.length + " bytes) ----",
  );
  console.log(result.slice(0, 900).replace(/^/gm, "  "));
  if (result.length > 900) console.log("  ... [" + (result.length - 900) + " more bytes]");
  console.log("  ---- end ----");

  const clean = result.includes(d.marker);
  const refused = d.refusal.test(result);
  check(
    "GATE " + d.name + ": a clean read OR temur's own size refusal",
    clean || refused,
    clean
      ? "CLEAN READ, the marker came back in the extracted text"
      : refused
        ? "temur's own graceful refusal: " + result.split("\n")[0].slice(0, 100)
        : "NEITHER: " + (result ? result.split("\n")[0].slice(0, 120) : "no tool result at all"),
  );

  const after = await mem((i === 0 ? "2" : "3") + " after reading " + d.name);
  reads.push({
    name: d.name,
    sizeBytes: d.size,
    turnMs,
    outcome: clean ? "clean read" : refused ? "temur size refusal" : "neither",
    toolResultBytes: result.length,
    toolResultFirstLine: result.split("\n")[0].slice(0, 200),
    succeededMarks: ok,
    refusedMarks: no,
    reachedEnd: reached,
    guestAlive: stillAlive,
    oomSigns: oom,
    memAfter: after,
    memPeakDuringRead: peak,
  });

  // Clear this turn's bodies BY NAME before the next turn reuses them.
  // Named explicitly rather than globbed: a glob in a command that is
  // read by a person should not look like it could take the share with it.
  await run("rm -f /files/req-1.json /files/req-2.json /files/req-3.json");
}

const verdict = {
  label,
  statePath,
  wroteConfig,
  capBytes: CAP,
  documents: DOCUMENTS.map((d) => ({ name: d.name, sizeBytes: d.size })),
  dropMs,
  shareTotalBytes: totalDropped,
  memory,
  reads,
  results,
  failed,
  gate: failed === 0 && !timedOut ? "PASS" : "FAIL",
};
fs.writeFileSync(
  "build/proof-bigfile-read-" + label + ".json",
  JSON.stringify(verdict, null, 1),
);

console.log("\n---- the lowest the guest ever got, sampled DURING each read ----");
for (const rd of reads) {
  const pk = rd.memPeakDuringRead || {};
  console.log(
    "  " + rd.name.padEnd(12) +
      "lowest MemFree " +
      (pk.minFreeKb == null ? "?" : (pk.minFreeKb / 1024).toFixed(1) + " MB") +
      "   lowest MemAvailable " +
      (pk.minAvailableKb == null ? "?" : (pk.minAvailableKb / 1024).toFixed(1) + " MB") +
      "   (" + (pk.samples || 0) + " samples over " + (rd.turnMs / 1000).toFixed(1) + " s)",
  );
}
console.log("\n---- memory, the three points the gate asks for ----");
for (const m of memory) {
  console.log(
    "  " + m.when.padEnd(30) +
      "MemFree " + (m.memFreeKb / 1024).toFixed(1) + " MB" +
      "   MemAvailable " + (m.memAvailableKb / 1024).toFixed(1) + " MB",
  );
}
console.log(
  "\n=== " + (failed ? "FAILED (" + failed + ")" : "ALL PASS") + ": " + label +
    "  GATE " + verdict.gate + " ===",
);
try { emulator.stop(); } catch (e) {}
process.exit(failed ? 1 : 0);
