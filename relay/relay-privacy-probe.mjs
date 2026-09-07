// Prove the log carries NO client address, and that hashing it did not
// break the thing the raw address is kept for.
//
// TWO HALVES AND BOTH MATTER. A fix that hashed the map key would pass
// the first half and silently destroy rate limiting, so the second half
// is not a formality: it is the regression this change could cause.
//
// The probe starts its own relay process, needs nothing running, and
// leaves nothing behind. No application data is sent on any stream.
import { spawn } from "child_process";
import { WebSocket } from "ws";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RELAY = path.join(HERE, "relay.mjs");

// Must match LIMITS in relay.mjs.
const CONCURRENT_PER_IP = Number(process.argv[2] || 24);
const PER_MINUTE = Number(process.argv[3] || 60);

// A socket counts as accepted only if it survives this grace; a refusal
// completes the handshake before closing. Standing rule for every relay
// client.
const ACCEPT_GRACE_MS = 400;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}

function startRelay(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [RELAY], {
      env: { ...process.env, RELAY_HOST: "127.0.0.1", RELAY_PORT: String(port), RELAY_TRUST_PROXY: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let buf = "";
    const onData = (d) => { buf += d.toString(); if (buf.includes('"relay_start"')) resolve({ child, out: () => buf }); };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (c) => reject(new Error("relay exited " + c + ": " + buf)));
    setTimeout(() => reject(new Error("relay did not start: " + buf)), 10000);
  });
}

function openWs(port, xff) {
  return new Promise((resolve) => {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/", { headers: { "X-Forwarded-For": xff } });
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    ws.on("open", () => setTimeout(() => done({ ok: true, ws }), ACCEPT_GRACE_MS));
    ws.on("close", (code) => done({ ok: false, code }));
    ws.on("error", () => done({ ok: false, code: 1006 }));
    setTimeout(() => done({ ok: false, code: 0 }), 6000);
  });
}

// Addresses chosen so that a leak would be unmistakable in the log.
const A = "203.0.113.7";
const B = "198.51.100.9";

async function main() {
  const checks = [];
  let pass = 0;
  const record = (ok, label, detail) => { checks.push({ ok, label, detail }); if (ok) pass++; };

  const port = await freePort();
  const relay = await startRelay(port);

  // --- HALF ONE: does anything in the log look like an address? ------
  const held = [];
  for (let i = 0; i < 3; i++) { const r = await openWs(port, A); if (r.ok) held.push(r.ws); }
  const other = await openWs(port, B);
  if (other.ok) held.push(other.ws);
  for (const w of held.splice(0, 2)) { try { w.close(); } catch (e) {} }
  await wait(800);

  const log = relay.out();
  const lines = log.split("\n").filter((l) => l.includes('"event"'));

  // every ip field must be exactly 8 hex characters
  const ipFields = [...log.matchAll(/"ip":"([^"]*)"/g)].map((m) => m[1]);
  const allHashed = ipFields.length > 0 && ipFields.every((v) => /^[0-9a-f]{8}$/.test(v));
  record(allHashed, "every logged ip field is 8 hex characters",
    ipFields.length + " ip fields, sample " + JSON.stringify(ipFields.slice(0, 3)));

  // and NO line may contain an address-shaped string at all
  const DOTTED = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  const COLONHEX = /\b(?:[0-9a-f]{1,4}:){2,}[0-9a-f]{1,4}\b/i;
  const offenders = lines.filter((l) => {
    // the address_map in relay_start is the SYNTHETIC provider map, not
    // a client address, and is allowed.
    const stripped = l.replace(/"address_map":\{[^}]*\}/, "").replace(/"bind":"[^"]*"/, "");
    return DOTTED.test(stripped) || COLONHEX.test(stripped);
  });
  record(offenders.length === 0, "NO log line contains an address-shaped string",
    offenders.length ? "offending: " + offenders[0].slice(0, 160) : "none in " + lines.length + " lines");

  // the two clients must hash differently, or the log is useless for soak
  const opens = [...log.matchAll(/"event":"ws_open","ip":"([0-9a-f]{8})"/g)].map((m) => m[1]);
  record(new Set(opens).size >= 2, "different addresses still hash to different values",
    "distinct hashes seen: " + new Set(opens).size);

  for (const w of held) { try { w.close(); } catch (e) {} }
  relay.child.kill("SIGKILL");
  await wait(400);

  // --- HALF TWO: the limits still trip on the RAW address ------------
  // If the fix hashed the map key, these would not.
  const port2 = await freePort();
  const relay2 = await startRelay(port2);

  const held2 = [];
  let accepted = 0;
  for (let i = 0; i < CONCURRENT_PER_IP; i++) {
    const r = await openWs(port2, A);
    if (r.ok) { accepted++; held2.push(r.ws); }
  }
  const over = await openWs(port2, A);
  record(accepted === CONCURRENT_PER_IP && !over.ok,
    "per-address concurrency cap still trips at " + CONCURRENT_PER_IP,
    "accepted " + accepted + ", the next was " + (over.ok ? "ACCEPTED" : "refused with " + over.code));
  record(over.code === 4001, "and it refuses with the shared-address code 4001", "code " + over.code);

  const otherClient = await openWs(port2, B);
  record(otherClient.ok === true, "a DIFFERENT address is still unaffected by that cap",
    "accepted " + otherClient.ok);
  if (otherClient.ws) otherClient.ws.close();
  for (const w of held2) { try { w.close(); } catch (e) {} }
  await wait(600);

  // and the per-minute rate, on a fresh address
  const C = "198.51.100.77";
  let acc = 0, ref = 0, rateCode = null;
  const spare = [];
  for (let i = 0; i < PER_MINUTE + 6; i++) {
    const r = await openWs(port2, C);
    if (r.ok) { acc++; spare.push(r.ws); } else { ref++; rateCode = r.code; }
    if (spare.length > 4) { try { spare.shift().close(); } catch (e) {} await wait(20); }
  }
  for (const w of spare) { try { w.close(); } catch (e) {} }
  record(acc === PER_MINUTE && ref > 0, "per-address per-minute rate still trips at " + PER_MINUTE,
    "accepted " + acc + ", refused " + ref);
  record(rateCode === 4002, "and it refuses with the rate code 4002", "code " + rateCode);

  // the second relay's log must also be clean
  const log2 = relay2.out();
  const ip2 = [...log2.matchAll(/"ip":"([^"]*)"/g)].map((m) => m[1]);
  record(ip2.length > 0 && ip2.every((v) => /^[0-9a-f]{8}$/.test(v)),
    "the limit-tripping run logged no address either", ip2.length + " ip fields, all hashed");

  relay2.child.kill("SIGKILL");
  await wait(300);

  console.log("--- privacy probe ---");
  for (const c of checks) console.log((c.ok ? "PASS  " : "FAIL  ") + c.label + "\n        " + c.detail);
  console.log("\n" + pass + "/" + checks.length + " passed");
  process.exit(pass === checks.length ? 0 : 1);
}

main().catch((e) => { console.log("PRIVACY PROBE ERROR: " + e.message); process.exit(2); });
