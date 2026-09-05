// Local-only static server for page/.
//
// Deliberately not python -m http.server: that sets Content-Encoding: gzip
// on .gz files from the mimetypes table, so the browser would gunzip the
// snapshot transparently and the page's own DecompressionStream would then
// be handed already-decompressed bytes. This server sends every file
// verbatim as application/octet-stream unless it knows better, sets no
// Content-Encoding, and logs the byte count of every asset it serves so
// the page's transfer total can be checked from the server side too.
//
// Binds 127.0.0.1 only. Nothing leaves the machine.
//
// THE SECURITY HEADERS ARE NOT WRITTEN HERE. They are read from
// page/_headers, the Cloudflare Pages file that ships with the site, so
// what this server sends and what the deployed site sends come from one
// source and cannot drift. By default the headers are served BYTE FOR
// BYTE as that file has them, which is what makes a local check worth
// anything.
//
// The one deviation is opt-in and loud: PAGE_DEV_RELAY=<origin> APPENDS
// that origin to connect-src, for the 127.0.0.1 relay a development loop
// needs. The shipped file is never edited to make local work work.
import http from "http";
import fs from "fs";
import path from "path";

const ROOT = path.resolve("page");
const PORT = Number(process.argv[2] || 8088);
const HEADERS_FILE = path.join(ROOT, "_headers");
const DEV_RELAY = process.env.PAGE_DEV_RELAY || null;

// Cloudflare Pages _headers: a line at column 0 is a path pattern, the
// indented lines under it are headers for it. "#" comments, blank lines
// ignored. Only the "/*" rule is used here, which is the only rule the
// file has.
function loadHeaders() {
  const text = fs.readFileSync(HEADERS_FILE, "utf8");
  const rules = new Map();
  let current = null;
  for (const raw of text.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = raw.trim();
      rules.set(current, []);
      continue;
    }
    if (!current) continue;
    const i = raw.indexOf(":");
    if (i < 0) continue;
    rules.get(current).push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
  }
  const wild = rules.get("/*");
  if (!wild || !wild.length) {
    throw new Error("no /* rule with headers in " + HEADERS_FILE);
  }
  return wild;
}

const SHIPPED_HEADERS = loadHeaders();

// The served set: the shipped headers, plus the dev relay in connect-src
// when and only when PAGE_DEV_RELAY says so.
const SERVED_HEADERS = SHIPPED_HEADERS.map(([name, value]) => {
  if (DEV_RELAY && name.toLowerCase() === "content-security-policy") {
    return [
      name,
      value.replace(/connect-src ([^;]*)/, (m, srcs) => "connect-src " + srcs.trim() + " " + DEV_RELAY),
    ];
  }
  return [name, value];
});

console.log("headers from " + path.relative(process.cwd(), HEADERS_FILE) + ":");
for (const [n, v] of SERVED_HEADERS) console.log("  " + n + ": " + v);
if (DEV_RELAY) {
  console.log(
    "NOTE: connect-src was WIDENED by PAGE_DEV_RELAY=" +
      DEV_RELAY +
      ". This is a local deviation from the shipped policy.",
  );
} else {
  console.log("(byte-identical to the shipped policy; no PAGE_DEV_RELAY set)");
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
};

const served = new Map();

const server = http.createServer((req, res) => {
  // The page POSTs its self-test result here. This is how a real browser
  // reports what it actually rendered back to a headless build session:
  // measurements plus the literal text of the xterm buffer.
  if (req.method === "POST" && req.url === "/report") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      // EACH MODE GETS ITS OWN FILE. They all used to post to one
      // filename, so the last run silently overwrote the evidence of the
      // one before it, and a proof that had in fact been taken looked
      // like a proof that had never happened. The mode names itself in
      // the body; anything unrecognised lands under "unknown" rather
      // than on top of a real report.
      let mode = "selftest";
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed.mode === "string" && /^[a-z][a-z0-9-]{0,30}$/.test(parsed.mode)) {
          mode = parsed.mode;
        } else if (parsed.mode !== undefined) {
          mode = "unknown";
        }
      } catch (e) {
        mode = "unparseable";
      }
      const out = "build/page-report-" + mode + ".json";
      fs.writeFileSync(out, body);
      console.log("REPORT received: " + body.length + " B -> " + out);
      res.writeHead(204).end();
    });
    return;
  }

  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const file = path.join(ROOT, rel);

  // Pages consumes _headers as configuration and never serves it; do the
  // same here, or the local site would differ from the deployed one in
  // the one file that defines how they are meant to be identical.
  if (rel === "/_headers") {
    res.writeHead(404).end("not found");
    return;
  }

  // Keep the server inside page/ even if the path tries to climb out.
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, "index.html")) {
    res.writeHead(403).end("forbidden");
    return;
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404).end("not found");
      console.log("404 " + rel);
      return;
    }
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    // Cross-origin isolation (so SharedArrayBuffer is available if the
    // v86 build wants it) and the CSP both come from page/_headers.
    // connect-src is the page's own origin plus the relay websocket and
    // nothing else, so anything trying to reach off-box, a DoH request to
    // cloudflare-dns.com being the one this design actively avoids, is
    // blocked by the browser and reported in its console rather than
    // merely discouraged. wasm-unsafe-eval is required for v86's
    // WebAssembly, and blob: workers are required because v86 starts its
    // CPU worker from a blob URL; those workers inherit this policy, so
    // connect-src still bounds what the worker can reach.
    const head = {
      "Content-Type": type,
      "Content-Length": st.size,
      "Cache-Control": "no-store",
    };
    for (const [n, v] of SERVED_HEADERS) head[n] = v;
    res.writeHead(200, head);
    served.set(rel, st.size);
    console.log("200 " + rel + "  " + st.size + " B  " + type);
    fs.createReadStream(file).pipe(res);
  });
});

process.on("SIGINT", () => {
  let total = 0;
  console.log("\n--- assets served ---");
  for (const [k, v] of served) {
    console.log(v.toString().padStart(10) + " B  " + k);
    total += v;
  }
  console.log(total.toString().padStart(10) + " B  TOTAL");
  process.exit(0);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("serving " + ROOT + " on http://127.0.0.1:" + PORT + " (localhost only)");
});
