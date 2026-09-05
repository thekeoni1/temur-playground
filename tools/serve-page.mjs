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
import http from "http";
import fs from "fs";
import path from "path";

const ROOT = path.resolve("page");
const PORT = Number(process.argv[2] || 8088);

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
      fs.writeFileSync("build/page-selftest.json", body);
      console.log("REPORT received: " + body.length + " B -> build/page-selftest.json");
      res.writeHead(204).end();
    });
    return;
  }

  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const file = path.join(ROOT, rel);

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
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": st.size,
      "Cache-Control": "no-store",
      // Cross-origin isolation, so SharedArrayBuffer is available if the
      // v86 build wants it. Harmless when it does not.
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",
      // Locality, ENFORCED by the browser rather than merely observed.
      // connect-src is the page's own origin plus the relay websocket and
      // nothing else, so if anything ever tried to reach off-box - a DoH
      // request to cloudflare-dns.com being the one this design actively
      // avoids - the browser would block it and report it in the console.
      // wasm-unsafe-eval is required for v86's WebAssembly.
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' ws://127.0.0.1:8089",
        // v86 starts its CPU worker from a blob URL
        // (URL.createObjectURL + new Worker), which default-src 'self'
        // blocks outright: the machine restores and then produces no
        // output at all. blob: workers inherit this policy, so
        // connect-src still bounds what the worker can reach.
        "worker-src 'self' blob:",
        "child-src 'self' blob:",
        "img-src 'self' data:",
        "base-uri 'none'",
        "form-action 'none'",
      ].join("; "),
    });
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
