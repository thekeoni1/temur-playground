// Sandbox P3a: prove the relay's enforcement, from a WISP client.
//
// Opens streams through the relay and records what the server does with
// each. Nothing here sends application data: a stream that is ALLOWED is
// opened at TCP level and closed again immediately. No TLS, no HTTP
// request, no key, nothing that constitutes using a provider's API.
//
// Usage: node tools/relay-probe.mjs [ws://127.0.0.1:8089/]
import { client as wispc, packet } from "@mercuryworkshop/wisp-js/client";

const URL_ = process.argv[2] || "ws://127.0.0.1:8089/";
const { close_reasons } = packet;

const REASON = Object.fromEntries(
  Object.entries(close_reasons).map(([k, v]) => [v, k]),
);

function connect(url) {
  return new Promise((resolve, reject) => {
    const conn = new wispc.ClientConnection(url);
    conn.onopen = () => resolve(conn);
    conn.onerror = () => reject(new Error("wisp connection failed"));
    setTimeout(() => reject(new Error("wisp connect timeout")), 10000);
  });
}

// Resolves to what the relay decided: "open" or the close reason name.
function tryStream(conn, host, port, waitMs = 6000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const stream = conn.create_stream(host, port);
    stream.onclose = (reason) =>
      done("closed:" + (REASON[reason] || "0x" + reason.toString(16)));
    // No close by the deadline means the relay let it through and the
    // TCP connection to the destination stands.
    setTimeout(() => {
      done("open");
      try {
        stream.close();
      } catch (e) {}
    }, waitMs);
  });
}

const results = [];
function record(name, expectation, got) {
  const pass =
    expectation === "open" ? got === "open" : got.startsWith(expectation);
  results.push({ name, expected: expectation, got, pass });
  console.log(
    (pass ? "PASS  " : "FAIL  ") +
      name.padEnd(46) +
      " expected=" +
      expectation.padEnd(18) +
      " got=" +
      got,
  );
}

const main = async () => {
  const conn = await connect(URL_);

  // (a) the one mapped destination connects
  record(
    "allowed: 192.0.2.1:443 (maps to api.anthropic.com)",
    "open",
    await tryStream(conn, "192.0.2.1", 443),
  );

  // (b) an unmapped address in the same reserved range is refused. This
  // is the general case: the guest cannot express a destination that the
  // relay has no mapping for.
  record(
    "blocked: 192.0.2.9:443 (unmapped)",
    "closed:HostBlocked",
    await tryStream(conn, "192.0.2.9", 443, 4000),
  );

  // (c) a bare public IP is refused. This is the shape a DoH leak would
  // take: the page resolving names itself and dialling real addresses.
  record(
    "blocked: 1.1.1.1:443 (bare public IP)",
    "closed:HostBlocked",
    await tryStream(conn, "1.1.1.1", 443, 4000),
  );

  // (d) asking by NAME is refused too. Nothing reaches a destination
  // except through the address map.
  record(
    "blocked: api.anthropic.com:443 (by name)",
    "closed:HostBlocked",
    await tryStream(conn, "api.anthropic.com", 443, 4000),
  );

  // (e) a mapped address on a non-allowlisted port is still refused
  record(
    "blocked: 192.0.2.1:80 (port not 443)",
    "closed:HostBlocked",
    await tryStream(conn, "192.0.2.1", 80, 4000),
  );

  // (f) reaching back at the relay host is refused
  record(
    "blocked: 127.0.0.1:443 (loopback)",
    "closed:HostBlocked",
    await tryStream(conn, "127.0.0.1", 443, 4000),
  );

  console.log("\n--- summary ---");
  const failed = results.filter((r) => !r.pass);
  console.log(
    results.length - failed.length + "/" + results.length + " passed",
  );
  process.exit(failed.length ? 1 : 0);
};

main().catch((e) => {
  console.log("PROBE ERROR: " + e.message);
  process.exit(2);
});
