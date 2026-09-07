// Sandbox P3a: the WISP relay.
//
// A DUMB PIPE. The guest terminates TLS itself (temur builds ureq with
// rustls + baked webpki-roots), so everything crossing this process for a
// :443 stream is ciphertext. This relay cannot read it and does not try.
//
// PAYLOAD IS NEVER LOGGED. Not at any log level, not in error paths. The
// only things recorded are connection-level facts: a timestamp, the
// destination hostname and port, and byte counts in each direction. The
// byte counters below add up lengths and never inspect, buffer, decode or
// store the bytes themselves. The upstream library was checked for this
// too: every logging call in @mercuryworkshop/wisp-js's server prints
// connection metadata (conn id, hostname, port, close reason) and none
// prints payload, including at debug level.
//
// BIND ADDRESS. Defaults to 127.0.0.1. In the deployed shape it stays on
// 127.0.0.1 and Caddy terminates TLS in front of it; see relay/README.md.
//
// LICENSING. This directory is AGPL-3.0-only, because wisp-js is, and
// this relay is a derived work that runs as a network service. See
// relay/LICENSE and relay/README.md; the rest of the repository is MIT.
import http from "http";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { WebSocketServer } from "ws";
import crypto from "crypto";

// --- the one deep import, asserted -----------------------------------
//
// NodeTCPSocket is the socket adapter wisp-js is designed to let you swap
// (ServerConnection takes a TCPSocket in its options), but the package's
// exports map only publishes ".", "./client" and "./server", so the class
// itself is not importable by package name. It is reached by file path
// instead: UNPUBLISHED INTERNALS, deliberately, and the only such reach
// in this program. This is NOT a fork or a patch; the file is the pinned
// package's own, unmodified, and only the documented injection point is
// used.
//
// The package ROOT is resolved through Node's own algorithm rather than
// by a hardcoded relative path, so this works whether wisp-js is
// installed under relay/node_modules (the deployed shape, npm ci in this
// directory) or hoisted to the repository root (the dev shape). The
// version and the symbol are then ASSERTED, because an unpinned bump
// that moved this file would otherwise cost the relay its byte
// accounting silently.
const WISP_JS_PIN = "0.4.1";
const WISP_JS_PKG = "@mercuryworkshop/wisp-js";

function resolveWispJs() {
  const req = createRequire(import.meta.url);
  let dir;
  try {
    dir = path.dirname(req.resolve(WISP_JS_PKG + "/server"));
  } catch (e) {
    throw new Error(
      "relay: cannot resolve " + WISP_JS_PKG + " at all (run npm ci): " + e.message,
    );
  }
  // The exports map does not publish "./package.json", so walk up from
  // the resolved entry to the directory that owns it.
  for (let i = 0; i < 8; i++) {
    const pj = path.join(dir, "package.json");
    if (fs.existsSync(pj)) {
      const meta = JSON.parse(fs.readFileSync(pj, "utf8"));
      if (meta.name === WISP_JS_PKG) return { root: dir, version: meta.version };
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error("relay: resolved " + WISP_JS_PKG + " but found no package.json for it");
}

const wispJs = resolveWispJs();
if (wispJs.version !== WISP_JS_PIN) {
  console.error(
    "relay: REFUSING TO START. " +
      WISP_JS_PKG +
      " resolved to version " +
      wispJs.version +
      ", but this relay reaches into its unpublished internals " +
      "(src/server/net.mjs, NodeTCPSocket) and is pinned to exactly " +
      WISP_JS_PIN +
      ". Check relay/package.json, then re-read that file before " +
      "moving the pin: the byte accounting and the per-host stream cap " +
      "both live in a subclass of that class.",
  );
  process.exit(3);
}

const NET_MJS = path.join(wispJs.root, "src", "server", "net.mjs");
let NodeTCPSocket;
try {
  ({ NodeTCPSocket } = await import(pathToFileURL(NET_MJS).href));
} catch (e) {
  console.error(
    "relay: REFUSING TO START. " +
      WISP_JS_PKG +
      "@" +
      WISP_JS_PIN +
      " no longer has " +
      NET_MJS +
      ": " +
      e.message,
  );
  process.exit(3);
}
if (typeof NodeTCPSocket !== "function") {
  console.error(
    "relay: REFUSING TO START. " +
      NET_MJS +
      " exists but exports no NodeTCPSocket class (got " +
      typeof NodeTCPSocket +
      "); the pin is " +
      WISP_JS_PIN +
      ".",
  );
  process.exit(3);
}

const PORT = Number(process.env.RELAY_PORT || 8089);
const HOST = process.env.RELAY_HOST || "127.0.0.1";

// --- the build stamp --------------------------------------------------
//
// The standing rule is that the deployed relay always matches a
// published commit. This is what makes that checkable instead of merely
// asserted: tools/stamp.mjs writes relay/build-info.json from the
// commit, and GET /version answers with it, so anyone can compare what
// is running against what is published.
//
// A missing stamp is a REFUSAL, not a default. The alternative is a
// relay that answers /version with "unknown", which looks like an answer
// and is worth nothing. RELAY_ALLOW_UNSTAMPED=1 exists for running this
// on a laptop against a dirty tree; it does not invent a sha, it makes
// the relay say out loud, in relay_start and in every /version answer,
// that it has none.
const BUILD_INFO_PATH = new URL("./build-info.json", import.meta.url);
let build;
try {
  build = JSON.parse(fs.readFileSync(BUILD_INFO_PATH, "utf8"));
} catch (e) {
  if (process.env.RELAY_ALLOW_UNSTAMPED === "1") {
    build = { commit: null, short: null, built: null, unstamped: true };
    console.error(
      "relay: RUNNING UNSTAMPED. No relay/build-info.json, and " +
        "RELAY_ALLOW_UNSTAMPED=1 is set. /version will report no commit. " +
        "This must never be a deployment.",
    );
  } else {
    console.error(
      "relay: REFUSING TO START. No relay/build-info.json, so this " +
        "process cannot say which commit it is. Run:\n" +
        "    node tools/stamp.mjs\n" +
        "from the repository root, then start it again. The deployed " +
        "relay always matches a published commit, and /version is how " +
        "that is checked; a relay that cannot answer it is not " +
        "deployable. RELAY_ALLOW_UNSTAMPED=1 overrides this for local " +
        "work only.",
    );
    process.exit(4);
  }
}

// --- who is the client? ----------------------------------------------
//
// The per-IP limits below are only worth anything if the IP is the
// client's. Behind a TLS-terminating reverse proxy on the same host,
// req.socket.remoteAddress is the PROXY (127.0.0.1) for every visitor,
// so all of them share one bucket and the first few lock everyone else
// out. That is not a hypothetical: it is the deployed shape.
//
// So: when RELAY_TRUST_PROXY=1 AND the connection actually arrives from
// loopback, take the client from the LAST hop of X-Forwarded-For, which
// is the one the proxy itself appended (anything a client puts in that
// header lands earlier in the list and is ignored). Both conditions
// matter. Off by default, because trusting that header on a directly
// exposed socket would let any client pick its own rate-limit bucket.
const TRUST_PROXY = process.env.RELAY_TRUST_PROXY === "1";

function isLoopback(addr) {
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1" ||
    (typeof addr === "string" && addr.startsWith("127."))
  );
}

// --- what goes in the log instead of the address ---------------------
//
// A RAW IP IS PERSONAL DATA AND THIS IS A PUBLIC SERVICE. The limits
// below need the real address to work, so the address stays in memory;
// what gets WRITTEN DOWN is a salted hash of it.
//
// THE SALT IS PER PROCESS AND NEVER PERSISTED. That is the point rather
// than a shortcut: it rotates on every restart, so nobody can correlate
// a visitor across restarts and nobody can reverse the hash by trying
// the four billion IPv4 addresses against a salt they do not have.
// Within one process the hash is stable, which is exactly what soak
// review needs: you can see that one address opened three connections
// without learning which address it was.
const LOG_SALT = crypto.randomBytes(32);

function hashIp(ip) {
  return crypto.createHmac("sha256", LOG_SALT).update(String(ip)).digest("hex").slice(0, 8);
}

function clientIp(req) {
  const socketIp = req.socket.remoteAddress || "unknown";
  if (TRUST_PROXY && isLoopback(socketIp)) {
    const xff = req.headers["x-forwarded-for"];
    if (xff) {
      const hops = String(xff)
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
      const last = hops[hops.length - 1];
      if (last) return { ip: last, source: "x-forwarded-for" };
    }
  }
  return { ip: socketIp, source: "socket" };
}

// --- the allowlist ---------------------------------------------------
//
// ANCHORED regexes, deliberately. wisp-js tests hostname_whitelist
// entries with entry.test(hostname), so an unanchored /api\.openai\.com/
// would also match "api.openai.com.attacker.example" and
// "notapi.openai.com". ^...$ is what makes this an allowlist rather than
// a substring search. No wildcards, no subdomains, exactly the four hosts
// the brief names.
const ALLOWED_HOSTS = [
  /^api\.anthropic\.com$/,
  /^api\.openai\.com$/,
  /^generativelanguage\.googleapis\.com$/,
  /^api\.x\.ai$/,
];

// --- the synthetic address map ---------------------------------------
//
// WHY THIS EXISTS. v86's WISP adapter does not send hostnames. Its
// CONNECT frame is built as
//   send_wisp_frame({type:"CONNECT", hostname: b.ipv4.dest.join("."), ...})
// so the "hostname" field is ALWAYS the destination IPv4 address off the
// packet header, in both dns_method modes. And dns_method "static"
// answers every A query with one hardcoded address:
//   case 1: d.push({... data:[192,168,87,1]})
// so every destination collapses to 192.168.87.1, which is neither
// distinguishable nor reachable. dns_method "doh" would resolve real
// addresses but only by doing DNS-over-HTTPS to cloudflare-dns.com from
// the page, which is off-box egress this phase forbids.
//
// So the guest is given NO DNS at all. /etc/hosts pins each allowed API
// hostname to one address in 192.0.2.0/24 (RFC 5737 TEST-NET-1, reserved
// for documentation and never globally routable, so it cannot collide
// with a real destination). The guest dials that address; the relay maps
// it back to the real hostname here and dials THAT.
//
// This is the allowlist. The guest cannot express any destination
// outside this table, because an unmapped address has nothing to map to
// and is refused. temur's base_url keeps the real hostname throughout,
// so SNI and certificate validation inside the guest are untouched -
// /etc/hosts changes address resolution only, never the URL.
const ADDRESS_MAP = new Map([
  ["192.0.2.1", "api.anthropic.com"],
  ["192.0.2.2", "api.openai.com"],
  ["192.0.2.3", "generativelanguage.googleapis.com"],
  ["192.0.2.4", "api.x.ai"],
]);

// Modest, and recorded in the report.
//
// THE PER-IP CAPS ARE THE SHARED-ADDRESS CAPS. Everyone behind one
// office, campus or mobile network arrives as a single address, so 8 at
// once locked out a whole building after eight people. 24 is the number
// a shared address can hold; 60/min is the rate it can open them at.
//
// THE GLOBAL CAP IS WHAT MAKES THAT SAFE. Without a ceiling, raising a
// per-IP cap raises the worst case with nothing bounding it at all. The
// worst case is what a cap is for, so:
//
//   MEMORY, measured on node v24.20.0, the version the box runs, as a
//   PROXY on this laptop because no session can reach the box. The relay
//   idles at 63.0 MiB RSS and 400 idle wisp connections add 11.5 MB,
//   about 30 kB each. The relay does NOT terminate TLS (the guest does),
//   so a stream is a plain socket and its buffers, call it 64 kB, and a
//   visitor at the full 16 streams is about 1 MB. On 414 MB of usable
//   RAM, with the OS and Caddy and this process's own 65 MB taken off
//   and SWAP NOT COUNTED, roughly 129 MB is left for connections. 48
//   visitors at their worst is about 48 MB of that.
//
//   FILE DESCRIPTORS ARE WHAT BINDS, not memory. A visitor costs one
//   client socket plus up to streamsPerConnection upstream sockets: 17.
//   systemd gives a service a SOFT limit of 1024 by default, which held
//   this to 48. The unit now sets LimitNOFILE=8192 (see
//   docs/VPS-RUNBOOK.md section 3), so 96 x 17 = 1632 against 8192 is
//   comfortable. The two numbers move together or not at all: the
//   startup check below refuses to run if the box does not actually
//   provide the descriptors this ceiling assumes.
//
//   96 RATHER THAN 128, which is desktop planning's call and its
//   reasoning: the ~1 MB per loaded visitor above is REASONED and not
//   measured, so the margin is deliberate. 96 x ~1 MB is about 96 MB
//   against the ~129 MB measured free, a quarter of 96 answers the
//   shared-address worry without letting one address dominate, soak is
//   what validates it, and a later raise is one publish, pull and
//   restart.
const LIMITS = {
  streamsPerConnection: 16, // concurrent streams on one wisp connection
  streamsPerHost: 8, // concurrent streams to any single destination
  wsPerIpPerMinute: 60, // new wisp websocket connections per client IP
  wsConcurrentPerIp: 24, // simultaneous wisp websockets per client IP
  wsConcurrentTotal: 96, // simultaneous wisp websockets, WHOLE RELAY
};

// --- does this box actually have the descriptors above? ---------------
//
// ADDED BY LAPTOP PLANNING, NOT PART OF DESKTOP'S RULING. Recorded here
// because a reader should be able to tell an ordered change from an
// added one.
//
// THE TWO HALVES OF THE CEILING LIVE IN DIFFERENT PLACES. The cap is in
// this file, in this repository. The descriptor limit that makes it
// survivable is a LimitNOFILE line in a unit file on a machine no
// session can see. Nothing keeps them together: a box whose unit
// predates that line, or was hand-edited, or was rebuilt from an older
// snapshot, will happily run a relay configured for 96 visitors against
// a limit that supports 48. It will not complain at startup. It will
// fail as descriptor exhaustion under load, which is the worst moment
// and the least legible symptom this service has.
//
// So the relay checks at startup and refuses. That is the same idiom as
// the missing stamp above: refusing beats starting in a state whose
// answer to an obvious question is "unknown".

// Descriptors this process needs BEYOND the connection arithmetic: the
// listening socket, stdio, node's own handles, and slack so that a
// burst of half-open sockets during a reconnect storm does not tip a
// relay over the edge it was sitting exactly on. It is an allowance,
// deliberately generous and deliberately a named constant rather than a
// number buried in an expression; it is not a measurement.
const FD_ALLOWANCE = 64;

// One client socket plus at most streamsPerConnection upstream sockets,
// per visitor, for as many visitors as the ceiling allows.
const FD_REQUIRED = LIMITS.wsConcurrentTotal * (1 + LIMITS.streamsPerConnection) + FD_ALLOWANCE;

// The EFFECTIVE (soft) limit, which is the one that bites. /proc is the
// only place a node process can read this without an addon, so off
// Linux there is nothing to read and the check is SKIPPED WITH A NOTE
// rather than guessed at.
function readSoftNofile() {
  let text;
  try {
    text = fs.readFileSync("/proc/self/limits", "utf8");
  } catch (e) {
    return null;
  }
  for (const line of text.split("\n")) {
    if (!line.startsWith("Max open files")) continue;
    const cols = line.slice("Max open files".length).trim().split(/\s+/);
    if (!cols.length) return null;
    if (cols[0] === "unlimited") return Infinity;
    const n = Number(cols[0]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const FD_SOFT = readSoftNofile();
if (FD_SOFT === null) {
  console.error(
    "relay: NOTE: cannot read /proc/self/limits, so the descriptor check " +
      "is skipped. This is expected off Linux. On the deployment host it " +
      "is not, and a relay whose descriptor limit is unknown is one " +
      "concurrency spike from an unreadable failure.",
  );
} else if (FD_SOFT < FD_REQUIRED) {
  console.error(
    "relay: REFUSING TO START. This process may open " +
      FD_SOFT +
      " file descriptors, and its configured ceiling needs " +
      FD_REQUIRED +
      ".\n" +
      "    wsConcurrentTotal " +
      LIMITS.wsConcurrentTotal +
      " x (1 client + " +
      LIMITS.streamsPerConnection +
      " streams) + " +
      FD_ALLOWANCE +
      " allowance = " +
      FD_REQUIRED +
      "\n" +
      "THE FIX is LimitNOFILE in the systemd unit:\n" +
      "    LimitNOFILE=8192\n" +
      "in [Service] in /etc/systemd/system/temur-relay.service, then\n" +
      "    sudo systemctl daemon-reload && sudo systemctl restart temur-relay\n" +
      "See docs/VPS-RUNBOOK.md section 3. Starting anyway would mean " +
      "running out of descriptors under load instead of here.",
  );
  process.exit(5);
}

// wisp-js's own filter is the FIRST of two gates: it restricts what the
// guest may ask for to exactly the mapped synthetic addresses. The second
// gate is CountingTCPSocket.connect(), which refuses anything not in
// ADDRESS_MAP and is the only thing that ever dials a real host.
// allow_direct_ip and allow_private_ips are on ONLY because the mapped
// addresses are literal IPs in a reserved range; the map, not these
// flags, is what bounds the destination set.
Object.assign(wisp.options, {
  hostname_whitelist: [...ADDRESS_MAP.keys()].map(
    (ip) => new RegExp("^" + ip.replace(/\./g, "\\.") + "$"),
  ),
  port_whitelist: [443], // TLS only; no cleartext destinations
  allow_direct_ip: true, // the mapped destinations ARE literal IPs
  allow_private_ips: true, // 192.0.2.0/24 is "reserved" to ipaddr.js
  // No reaching back into the host. This is the one flag whose refusal
  // is re-proven against the DEPLOYED relay: the deploy proof dials a
  // loopback destination from inside the guest and shows it refused, on
  // the public service rather than only on a laptop.
  allow_loopback_ips: false,
  allow_udp_streams: false, // TCP only; UDP would be a DNS side channel
  allow_tcp_streams: true,
  stream_limit_total: LIMITS.streamsPerConnection,
  // NOT options.stream_limit_per_host. That option is BROKEN in
  // @mercuryworkshop/wisp-js 0.4.1: filter.mjs does
  //   for (let stream of connection.streams)
  // but ServerConnection sets this.streams = {}, an object, which is not
  // iterable. Setting it to anything but -1 throws TypeError on the first
  // stream and, because the throw is inside an async task nobody awaits,
  // takes the whole relay process down. Per-host capping is enforced
  // below instead, in CountingTCPSocket.connect().
  stream_limit_per_host: -1,
  // The same stamp the page footer and GET /version show, on the wisp
  // greeting itself, so it is visible to a client that never fetches
  // anything over HTTP.
  wisp_motd: build.commit
    ? "temur sandbox relay, commit " + build.short + " (source: AGPL-3.0, see /version)"
    : null,
});

// --- connection-level accounting -------------------------------------

let streamSeq = 0;

function logLine(fields) {
  // One flat line, machine-greppable, metadata only.
  process.stdout.write(
    new Date().toISOString() + " " + JSON.stringify(fields) + "\n",
  );
}

// Counts bytes without looking at them. super.send/super.recv do the real
// work; we only add up .length. Nothing here retains a payload reference.
const livePerHost = new Map(); // hostname -> concurrent stream count

class CountingTCPSocket extends NodeTCPSocket {
  constructor(hostname, port) {
    super(hostname, port);
    this._id = ++streamSeq;
    this._up = 0;
    this._down = 0;
    this._opened = Date.now();
    this._counted = false;
    // Deliberately NOT logged here. wisp-js constructs the socket object
    // before it runs the allowlist, so logging in the constructor would
    // print a "stream opened" line for destinations that are then
    // refused. Streams are logged in connect(), which only runs once the
    // filter has allowed them.
  }

  // Per-destination concurrency cap, standing in for the library's broken
  // stream_limit_per_host. Throwing here is the supported way to refuse:
  // wisp-js wraps socket.connect() in a try/catch, logs the failure and
  // closes the stream, so the client gets a clean refusal instead of a
  // dead relay.
  async connect() {
    // Second gate. Translate the synthetic address the guest dialled into
    // the real hostname, and refuse anything that is not in the map. This
    // is what makes the destination set closed: there is no unmapped
    // address that resolves to anywhere.
    const asked = this.hostname;
    const real = ADDRESS_MAP.get(asked);
    if (!real) {
      logLine({
        event: "stream_refused",
        id: this._id,
        dest: asked + ":" + this.port,
        why: "destination not in address map",
      });
      throw new Error("destination not allowed");
    }
    if (!ALLOWED_HOSTS.some((re) => re.test(real))) {
      // Belt and braces: the map and the allowlist must agree.
      logLine({
        event: "stream_refused",
        id: this._id,
        dest: asked + " -> " + real,
        why: "mapped host not on allowlist",
      });
      throw new Error("mapped host not allowed");
    }
    this.hostname = real;
    this._asked = asked;

    const n = livePerHost.get(this.hostname) || 0;
    if (n >= LIMITS.streamsPerHost) {
      logLine({
        event: "stream_refused",
        id: this._id,
        dest: this.hostname + ":" + this.port,
        why: "per-host concurrent limit " + LIMITS.streamsPerHost,
      });
      throw new Error("per-host stream limit reached");
    }
    livePerHost.set(this.hostname, n + 1);
    this._counted = true;
    logLine({
      event: "stream_open",
      id: this._id,
      asked: this._asked + ":" + this.port,
      dest: this.hostname + ":" + this.port,
    });
    try {
      return await super.connect();
    } catch (e) {
      this._release();
      throw e;
    }
  }

  _release() {
    if (!this._counted) return;
    this._counted = false;
    const n = (livePerHost.get(this.hostname) || 1) - 1;
    if (n <= 0) livePerHost.delete(this.hostname);
    else livePerHost.set(this.hostname, n);
  }

  async send(data) {
    this._up += data.length;
    return await super.send(data);
  }

  async recv() {
    const data = await super.recv();
    if (data) this._down += data.length;
    return data;
  }

  async close() {
    if (this.socket) {
      logLine({
        event: "stream_close",
        id: this._id,
        dest: this.hostname + ":" + this.port,
        bytes_up: this._up,
        bytes_down: this._down,
        ms: Date.now() - this._opened,
      });
    }
    this._release();
    return await super.close();
  }
}

// --- per-IP limiting at the upgrade -----------------------------------
//
// wisp-js's own client_ip_whitelist/blacklist are documented "not
// implemented!", and its stream limits are per wisp connection, so a
// client could open unlimited wisp connections. This is the layer that
// bounds that, per the brief's per-IP requirement.
const recent = new Map(); // ip -> number[] (timestamps)
const live = new Map(); // ip -> count
let liveTotal = 0; // every live wisp websocket, all addresses

// REFUSAL IS A MESSAGE, NOT A DISCONNECT.
//
// This used to be socket.destroy() with no HTTP response written. In a
// browser that is close code 1006 with no reason, which is BYTE FOR BYTE
// what a relay that is not running looks like, so a visitor turned away
// by a limit and a visitor facing an outage saw exactly the same thing
// and the page could not tell them apart.
//
// Writing an HTTP 429 before destroying does not fix it either: the
// browser does not expose a failed handshake's status to script. What IS
// visible to script is a CloseEvent, so the refusal completes the
// websocket handshake and then closes with a private close code and a
// short reason. The page reads the code and says something true.
//
// 4000-4999 is the private range reserved for application use. These
// codes are page-facing contract: page/app.js maps them to the message a
// visitor reads, so do not renumber them without changing that too.
const CLOSE_SHARED_ADDRESS = 4001; // this address holds too many at once
const CLOSE_SHARED_RATE = 4002; // this address opened too many too fast
const CLOSE_AT_CAPACITY = 4003; // the whole relay is full, nobody's fault

// The reason string travels in the close frame and is capped at 123
// bytes by the protocol. It is diagnostic, not visitor copy: the page
// writes the visitor's wording from the CODE, so a reason that changes
// breaks nothing.
function allowUpgrade(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60000);
  hits.push(now);
  recent.set(ip, hits);
  if (hits.length > LIMITS.wsPerIpPerMinute) {
    return {
      ok: false,
      why: "rate: >" + LIMITS.wsPerIpPerMinute + "/min",
      code: CLOSE_SHARED_RATE,
      reason: "shared address: too many new connections",
    };
  }
  if ((live.get(ip) || 0) >= LIMITS.wsConcurrentPerIp) {
    return {
      ok: false,
      why: "concurrent: >=" + LIMITS.wsConcurrentPerIp,
      code: CLOSE_SHARED_ADDRESS,
      reason: "shared address: too many connections at once",
    };
  }
  // Checked LAST so the log names the per-address cause when that is
  // what fired. A visitor cannot act on the difference and is told the
  // same thing either way; the operator reading the log can.
  if (liveTotal >= LIMITS.wsConcurrentTotal) {
    return {
      ok: false,
      why: "global concurrent: >=" + LIMITS.wsConcurrentTotal,
      code: CLOSE_AT_CAPACITY,
      reason: "relay at capacity",
    };
  }
  return { ok: true };
}

// The refusal handshake. noServer, so it never listens on anything: it
// exists only to turn an upgrade into a websocket long enough to say why
// it is closing.
const refusalWss = new WebSocketServer({ noServer: true });

// THE REFUSAL MUST STAY CHEAP. It completes a handshake and nothing
// else: no wisp session, no ServerConnection, no upstream dial. It also
// must not consume the slot it is refusing for, which is why `live` is
// incremented on the ACCEPTED path below and never here, and why the
// socket is torn down on a timer rather than left to the client.
function refuseUpgrade(req, socket, head, verdict, ip, source) {
  logLine({
    event: "upgrade_refused",
    ip: hashIp(ip),
    ip_source: source,
    why: verdict.why,
    close_code: verdict.code,
  });
  let handed = false;
  // If the handshake cannot be completed for any reason, fall back to
  // the old behaviour rather than leaking the socket.
  const giveUp = setTimeout(() => {
    if (!handed) socket.destroy();
  }, 2000);
  try {
    refusalWss.handleUpgrade(req, socket, head, (ws) => {
      handed = true;
      clearTimeout(giveUp);
      ws.close(verdict.code, verdict.reason);
      // A client that ignores the close frame does not get to hold the
      // socket open on the strength of having been refused.
      setTimeout(() => {
        try {
          ws.terminate();
        } catch (e) {}
      }, 1000);
    });
  } catch (e) {
    clearTimeout(giveUp);
    socket.destroy();
  }
}

const server = http.createServer((req, res) => {
  // Exactly one HTTP route. Everything else exists only to be upgraded.
  if (req.method === "GET" && req.url.split("?")[0] === "/version") {
    const body = JSON.stringify(
      {
        commit: build.commit,
        short: build.short,
        built: build.built,
        unstamped: build.unstamped === true || undefined,
        wisp_js: wispJs.version,
        node: process.version,
      },
      null,
      1,
    );
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
      // No CORS header on purpose. The page LINKS to this rather than
      // fetching it, so the page's connect-src stays wss-and-self only;
      // widening it to the relay's https origin would buy a nicer footer
      // at the cost of the tightest claim the page makes.
    });
    res.end(body);
    return;
  }
  res.writeHead(426, { "Content-Type": "text/plain" });
  res.end("upgrade required\n");
});

server.on("upgrade", (req, socket, head) => {
  const { ip, source } = clientIp(req);
  const verdict = allowUpgrade(ip);
  if (!verdict.ok) {
    refuseUpgrade(req, socket, head, verdict, ip, source);
    return;
  }

  live.set(ip, (live.get(ip) || 0) + 1);
  liveTotal++;
  // The MAP lookups below use the raw ip on purpose; only the logged
  // field is hashed. Hashing a map key would silently break the limits.
  logLine({ event: "ws_open", ip: hashIp(ip), ip_source: source, live: live.get(ip), live_total: liveTotal });
  socket.on("close", () => {
    live.set(ip, Math.max(0, (live.get(ip) || 1) - 1));
    liveTotal = Math.max(0, liveTotal - 1);
    logLine({ event: "ws_close", ip: hashIp(ip), live: live.get(ip), live_total: liveTotal });
  });

  wisp.routeRequest(req, socket, head, { TCPSocket: CountingTCPSocket });
});

// A single misbehaving stream must not be able to take the relay down.
// This is how the wisp-js stream_limit_per_host bug killed the process on
// its first connection: the throw happened inside an async task nobody
// awaited. Log the fact (no payload) and keep serving.
process.on("unhandledRejection", (err) => {
  logLine({
    event: "unhandled_rejection",
    error: String((err && err.message) || err),
  });
});
process.on("uncaughtException", (err) => {
  logLine({ event: "uncaught_exception", error: String(err && err.message) });
});

server.listen(PORT, HOST, () => {
  logLine({
    event: "relay_start",
    bind: HOST + ":" + PORT,
    allowlist: ALLOWED_HOSTS.map(String),
    address_map: Object.fromEntries(ADDRESS_MAP),
    limits: LIMITS,
    // The real number off the real box, so a deploy report can quote it
    // rather than assume the unit was applied.
    nofile_soft: FD_SOFT === null ? "unreadable" : FD_SOFT === Infinity ? "unlimited" : FD_SOFT,
    nofile_required: FD_REQUIRED,
    commit: build.commit,
    unstamped: build.unstamped === true || undefined,
    wisp_js: wispJs.version,
    client_ip_source: TRUST_PROXY
      ? "x-forwarded-for last hop when the socket is loopback, else socket"
      : "socket",
    ip_logging: "per-process salted HMAC-SHA256, first 8 hex; the raw address is never logged and the salt rotates on restart",
    note: "connection-level logging only; payload is never logged",
  });
});
