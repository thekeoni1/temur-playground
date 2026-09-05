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
// LOCAL ONLY in P3a: binds 127.0.0.1 and nothing else. The listen address
// is a knob solely so P3b can be reviewed and authorized separately; it
// is not a public server today.
import http from "http";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

// NodeTCPSocket is the socket adapter wisp-js is designed to let you swap
// (ServerConnection takes a TCPSocket in its options), but the package's
// exports map only publishes ".", "./client" and "./server", so the class
// itself is not importable by package name. Reached by a repo-relative
// file URL instead. This is NOT a fork or a patch: the file is the pinned
// package's own, unmodified, and only the documented injection point is
// used. If a future bump moves this path the relay fails loudly at
// startup rather than silently losing its byte accounting.
const { NodeTCPSocket } = await import(
  new URL(
    "../node_modules/@mercuryworkshop/wisp-js/src/server/net.mjs",
    import.meta.url,
  ).href
);

const PORT = Number(process.env.RELAY_PORT || 8089);
const HOST = process.env.RELAY_HOST || "127.0.0.1";

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
const LIMITS = {
  streamsPerConnection: 16, // concurrent streams on one wisp connection
  streamsPerHost: 8, // concurrent streams to any single destination
  wsPerIpPerMinute: 30, // new wisp websocket connections per client IP
  wsConcurrentPerIp: 8, // simultaneous wisp websockets per client IP
};

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
  allow_loopback_ips: false, // no reaching back into the host
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
  wisp_motd: null,
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

function allowUpgrade(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60000);
  hits.push(now);
  recent.set(ip, hits);
  if (hits.length > LIMITS.wsPerIpPerMinute) {
    return { ok: false, why: "rate: >" + LIMITS.wsPerIpPerMinute + "/min" };
  }
  if ((live.get(ip) || 0) >= LIMITS.wsConcurrentPerIp) {
    return {
      ok: false,
      why: "concurrent: >=" + LIMITS.wsConcurrentPerIp,
    };
  }
  return { ok: true };
}

const server = http.createServer((req, res) => {
  // No HTTP surface at all: this endpoint exists only to be upgraded.
  res.writeHead(426, { "Content-Type": "text/plain" });
  res.end("upgrade required\n");
});

server.on("upgrade", (req, socket, head) => {
  const ip = req.socket.remoteAddress;
  const verdict = allowUpgrade(ip);
  if (!verdict.ok) {
    logLine({ event: "upgrade_refused", ip, why: verdict.why });
    socket.destroy();
    return;
  }

  live.set(ip, (live.get(ip) || 0) + 1);
  logLine({ event: "ws_open", ip, live: live.get(ip) });
  socket.on("close", () => {
    live.set(ip, Math.max(0, (live.get(ip) || 1) - 1));
    logLine({ event: "ws_close", ip, live: live.get(ip) });
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
    note: "connection-level logging only; payload is never logged",
  });
});
