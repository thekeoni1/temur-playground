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
