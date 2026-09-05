// Prove the per-IP limits still key on the CLIENT when the relay sits
// behind a reverse proxy, and that they do not trust the header when it
// is not behind one.
//
// WHY THIS EXISTS. allowUpgrade() keys on req.socket.remoteAddress. In
// the deployed shape Caddy terminates TLS on the same host and proxies
// to loopback, so EVERY visitor arrives as 127.0.0.1 and they all share
// one rate-limit and concurrency bucket: the first few visitors would
// lock out everyone else, and one visitor could deny the service to all
// of them. That is a deployment defect this probe exists to catch.
//
// The probe starts its own relay processes, so it needs nothing running
// and leaves nothing behind. It sends no application data on any stream;
// it only opens websockets and counts which ones the relay accepted.
import { spawn } from "child_process";
import { WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RELAY = path.join(HERE, "relay.mjs");

// Must match LIMITS.wsConcurrentPerIp in relay.mjs. The concurrency cap
// is used rather than the per-minute rate because it trips in one
// decisive step instead of thirty.
const CONCURRENT_PER_IP = Number(process.argv[2] || 8);

const CLIENT_A = "203.0.113.7"; // RFC 5737 TEST-NET-3, both of them
const CLIENT_B = "198.51.100.9"; // RFC 5737 TEST-NET-2

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function startRelay(port, trustProxy) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, RELAY_HOST: "127.0.0.1", RELAY_PORT: String(port) };
    if (trustProxy) env.RELAY_TRUST_PROXY = "1";
    else delete env.RELAY_TRUST_PROXY;
    const child = spawn(process.execPath, [RELAY], { env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    const onData = (d) => {
      buf += d.toString();
      if (buf.includes('"relay_start"')) {
        const line = buf.split("\n").find((l) => l.includes('"relay_start"'));
        resolve({ child, startLine: line, out: () => buf });
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => reject(new Error("relay exited early with " + code + ": " + buf)));
    setTimeout(() => reject(new Error("relay did not start: " + buf)), 10000);
  });
}

// One upgrade attempt, carrying an X-Forwarded-For as a proxy would.
function openWs(port, xff) {
  return new Promise((resolve) => {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/", {
      headers: { "X-Forwarded-For": xff },
    });
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    ws.on("open", () => done({ ok: true, ws }));
    ws.on("error", () => done({ ok: false }));
    ws.on("close", () => done({ ok: false }));
    setTimeout(() => done({ ok: false }), 5000);
  });
}

// Fill one client's bucket to the cap, confirm the next one is refused,
// then see whether a DIFFERENT client still gets in.
async function scenario(port, label) {
  const held = [];
  let acceptedA = 0;
  for (let i = 0; i < CONCURRENT_PER_IP; i++) {
    const r = await openWs(port, CLIENT_A);
    if (r.ok) {
      acceptedA++;
      held.push(r.ws);
    }
  }
  const overA = await openWs(port, CLIENT_A);
  if (overA.ok) held.push(overA.ws);
  const clientB = await openWs(port, CLIENT_B);
  if (clientB.ok) held.push(clientB.ws);
  for (const w of held) {
    try {
      w.close();
    } catch (e) {}
  }
  await wait(300);
  console.log(
    "  " +
      label +
      ": client A accepted " +
      acceptedA +
      "/" +
      CONCURRENT_PER_IP +
      ", A over the cap " +
      (overA.ok ? "ACCEPTED" : "refused") +
      ", client B " +
      (clientB.ok ? "accepted" : "REFUSED"),
  );
  return { acceptedA, overA: overA.ok, clientB: clientB.ok };
}

async function main() {
  let pass = 0;
  const total = 2;

  // 1. Behind a trusted proxy: separate buckets per X-Forwarded-For.
  const on = await startRelay(8091, true);
  const srcOn = JSON.parse(on.startLine.slice(on.startLine.indexOf("{"))).client_ip_source;
  console.log("relay with RELAY_TRUST_PROXY=1");
  console.log("  relay_start client_ip_source: " + JSON.stringify(srcOn));
  const a = await scenario(8091, "trusted proxy ");
  on.child.kill("SIGKILL");
  await wait(400);
  const okOn = a.acceptedA === CONCURRENT_PER_IP && !a.overA && a.clientB;
  console.log(
    (okOn ? "PASS  " : "FAIL  ") +
      "RELAY_TRUST_PROXY=1: one client's cap does not shut out another client",
  );
  if (okOn) pass++;

  // 2. Not behind a proxy: the header must NOT be trusted, so every
  // attempt is the same loopback client and they share one bucket.
  const off = await startRelay(8092, false);
  const srcOff = JSON.parse(off.startLine.slice(off.startLine.indexOf("{"))).client_ip_source;
  console.log("\nrelay with RELAY_TRUST_PROXY unset");
  console.log("  relay_start client_ip_source: " + JSON.stringify(srcOff));
  const b = await scenario(8092, "no trust flag");
  off.child.kill("SIGKILL");
  await wait(400);
  const okOff = b.acceptedA === CONCURRENT_PER_IP && !b.overA && !b.clientB;
  console.log(
    (okOff ? "PASS  " : "FAIL  ") +
      "RELAY_TRUST_PROXY unset: X-Forwarded-For is ignored, one bucket for the socket",
  );
  if (okOff) pass++;

  console.log("\n--- summary ---");
  console.log(pass + "/" + total + " passed");
  process.exit(pass === total ? 0 : 1);
}

main().catch((e) => {
  console.log("PROXY PROBE ERROR: " + e.message);
  process.exit(2);
});
