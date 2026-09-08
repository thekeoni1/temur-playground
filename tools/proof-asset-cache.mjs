// PROOF: a returning visitor with a warm cache runs the CURRENT app.js.
//
// This is the one that matters. A fresh-profile load proves nothing about
// the defect, because the defect only ever appears to someone who already
// has the old file cached. So this builds two versions of the site,
// primes a browser against the first, and loads the second THROUGH THE
// SAME PROFILE.
//
// IT RUNS ITS OWN CONTROL, and the control is the point. An experiment
// that only ever comes out green has not shown it can detect anything, so
// the same warm profile is also pointed at a build with BARE, unstamped
// references, which must come back showing the STALE script. If the
// control does not reproduce the bug, this file is measuring nothing and
// its green result is worthless.
//
// Nothing here touches the repository: the three sites are built in a
// scratch directory from copies. The snapshots are deliberately NOT
// copied, because the question is which SCRIPT the browser executed, and
// that is settled at parse time, long before the emulator would want a
// snapshot. Each build's app.js sets document.title to its own name, so
// the answer is one string in a dumped DOM.
//
// Usage: node tools/proof-asset-cache.mjs
import fs from "fs";
import path from "path";
import http from "http";
import { execFile, execFileSync } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);
import { fileURLToPath } from "url";
import { stampAssetRefs } from "./asset-stamp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "page");
const WORK = process.env.PROOF_DIR ||
  "/tmp/claude-1000/-home-dev-temur/b2349638-44d5-4fa8-8ef8-57be74533732/scratchpad/cacheproof";
const PORT = Number(process.env.PROOF_PORT || 8099);
const EDGE = "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

// Pages' real defaults, which are what create the window: the html is
// always revalidated, everything else is held for four hours.
const CACHE_HTML = "public, max-age=0, must-revalidate";
const CACHE_ASSET = "public, max-age=14400, must-revalidate";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".bin": "application/octet-stream",
};

function buildSite(name, { stamped, version, marker }) {
  const dir = path.join(WORK, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "vendor"), { recursive: true });

  // app.js announces which build it is, at parse time.
  const app = fs.readFileSync(path.join(PAGE, "app.js"), "utf8");
  fs.writeFileSync(
    path.join(dir, "app.js"),
    'document.title = "' + marker + '";\n' + app,
  );
  fs.writeFileSync(
    path.join(dir, "build-info.js"),
    'window.__BUILD__ = {"commit":"0","short":"' + version + '"};\n',
  );
  for (const v of ["xterm.js", "libv86.js", "xterm.css", "v86.wasm"]) {
    const src = path.join(PAGE, "vendor", v);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, "vendor", v));
  }
  let html = fs.readFileSync(path.join(PAGE, "index.html"), "utf8");
  if (stamped) html = stampAssetRefs(html, version);
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return dir;
}

let serveDir = null;
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(serveDir, rel === "/" ? "index.html" : rel);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end("nf");
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? CACHE_HTML : CACHE_ASSET,
  });
  fs.createReadStream(file).pipe(res);
});

// ASYNC, AND THAT IS NOT A STYLE CHOICE. The http server that answers
// these loads lives in THIS process, so a synchronous exec would block
// the event loop and the browser's very first request for index.html
// could never be served. The first version of this file did exactly
// that and every load timed out looking like a browser fault.
async function load(profile, label) {
  // A REAL profile directory reused across loads is the whole mechanism
  // here: it is the browser cache that carries the stale file forward.
  let out = "";
  try {
    const r = await execFileAsync(
      EDGE,
      [
        "--headless=old",
        "--disable-gpu",
        "--no-first-run",
        "--user-data-dir=" + profile,
        "--dump-dom",
        "http://localhost:" + PORT + "/",
      ],
      { encoding: "utf8", timeout: 90000, maxBuffer: 64 * 1024 * 1024 },
    );
    out = r.stdout;
  } catch (e) {
    out = (e && e.stdout) || "";
  }
  const m = /<title>([^<]*)<\/title>/.exec(out);
  const got = m ? m[1] : "(no title)";
  console.log("  " + label.padEnd(46) + " -> " + got);
  return got;
}

fs.mkdirSync(WORK, { recursive: true });
const OLD = buildSite("old", { stamped: false, version: "oldv", marker: "BUILD-OLD" });
const NEWSTAMPED = buildSite("new-stamped", { stamped: true, version: "newv", marker: "BUILD-NEW" });
const NEWBARE = buildSite("new-bare", { stamped: false, version: "newv", marker: "BUILD-NEW" });

await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
console.log("=== asset cache proof, one origin on :" + PORT + " ===\n");

const results = {};

// CONTROL FIRST. If this does not go stale, nothing below means anything.
const profA = "C:\\Windows\\Temp\\cacheproof-control-" + Date.now();
serveDir = OLD;
results.controlPrime = await load(profA, "CONTROL prime on the old build");
serveDir = NEWBARE;
results.controlWarm = await load(profA, "CONTROL warm load, BARE refs (the defect)");

// THE FIX.
const profB = "C:\\Windows\\Temp\\cacheproof-fix-" + Date.now();
serveDir = OLD;
results.fixPrime = await load(profB, "FIX prime on the old build");
serveDir = NEWSTAMPED;
results.fixWarm = await load(profB, "FIX warm load, STAMPED refs");

// And the baseline a fresh visitor gets.
const profC = "C:\\Windows\\Temp\\cacheproof-fresh-" + Date.now();
serveDir = NEWSTAMPED;
results.fresh = await load(profC, "FRESH profile, stamped build");

server.close();

const controlReproduced = results.controlWarm === "BUILD-OLD";
const fixWorks = results.fixWarm === "BUILD-NEW";
const freshOk = results.fresh === "BUILD-NEW";
const primedOk = results.controlPrime === "BUILD-OLD" && results.fixPrime === "BUILD-OLD";

console.log("\n  control reproduces the stale-JS defect: " + controlReproduced);
console.log("  warm cache runs the CURRENT app.js:      " + fixWorks);
console.log("  fresh profile runs the current app.js:   " + freshOk);
console.log("  both primes really loaded the old build: " + primedOk);

const ok = controlReproduced && fixWorks && freshOk && primedOk;
console.log("\n=== " + (ok ? "PASS" : "FAIL") + " ===");
fs.writeFileSync(
  path.join(ROOT, "build", "proof-asset-cache.json"),
  JSON.stringify({ results, controlReproduced, fixWorks, freshOk, primedOk, ok }, null, 1),
);

for (const p of [profA, profB, profC]) {
  try {
    execFileSync("powershell.exe", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" +
      p.split("\\").pop() + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"],
      { timeout: 30000 });
  } catch (e) {}
}
process.exit(ok ? 0 : 1);
