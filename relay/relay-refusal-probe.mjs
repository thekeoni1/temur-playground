// Prove that a REFUSED visitor is distinguishable from a DEAD relay.
//
// WHY THIS EXISTS. The relay used to refuse an over-cap upgrade with a
// bare socket.destroy(). A browser sees that as close code 1006 with no
// reason, which is exactly what it sees when the relay is not running at
// all, so the page could not tell a visitor "your address is at its
// limit" apart from "the relay is down" and said the wrong thing half
// the time. The relay now completes the handshake and closes with a
// private code, which IS visible to script.
//
// The probe starts its own relay processes, so it needs nothing running
// and leaves nothing behind. It opens websockets and reads close codes;
// it sends no application data on any stream and dials no upstream.
//
// Sibling of relay-proxy-probe.mjs and deliberately the same shape:
// fill one client's bucket to the cap with X-Forwarded-For, then look at
// what the next connection is told.
import { spawn } from "child_process";
import { WebSocket } from "ws";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RELAY = path.join(HERE, "relay.mjs");

// Must match LIMITS.wsConcurrentPerIp in relay.mjs.
const CONCURRENT_PER_IP = Number(process.argv[2] || 8);

// Must match the CLOSE_* constants in relay.mjs. These are the contract
// the page reads.
const CLOSE_SHARED_ADDRESS = 4001;
const CLOSE_SHARED_RATE = 4002;

const CLIENT_A = "203.0.113.7"; // RFC 5737 TEST-NET-3
const CLIENT_B = "198.51.100.9"; // RFC 5737 TEST-NET-2

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function startRelay(port) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      RELAY_HOST: "127.0.0.1",
      RELAY_PORT: String(port),
      RELAY_TRUST_PROXY: "1",
    };
    const child = spawn(process.execPath, [RELAY], { env, stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    const onData = (d) => {
      buf += d.toString();
      if (buf.includes('"relay_start"')) resolve({ child, out: () => buf });
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => reject(new Error("relay exited early with " + code + ": " + buf)));
    setTimeout(() => reject(new Error("relay did not start: " + buf)), 10000);
  });
}

// One upgrade attempt. Reports what a BROWSER would be able to see: did
// it open, and what close code and reason came back.
function openWs(port, xff) {
  return new Promise((resolve) => {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/", {
      headers: { "X-Forwarded-For": xff },
    });
    let opened = false;
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    ws.on("open", () => {
      opened = true;
      // Do NOT resolve here. A refusal opens too, and then closes; the
      // difference is what arrives next. This is the same grace the page
      // gives its own probe.
      setTimeout(() => done({ opened: true, held: true, ws }), 400);
    });
    ws.on("close", (code, reason) =>
      done({ opened, held: false, code, reason: reason ? reason.toString() : "" }),
    );
    ws.on("error", () => done({ opened, held: false, code: 1006, reason: "" }));
    setTimeout(() => done({ opened, held: false, code: 0, reason: "timeout" }), 6000);
  });
}

// What a browser sees when nothing is listening at all: the contrast
// case, and the whole reason the close code has to exist.
function openDead(port) {
  return new Promise((resolve) => {
    const ws = new WebSocket("ws://127.0.0.1:" + port + "/");
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    ws.on("open", () => done({ opened: true }));
    ws.on("close", (code) => done({ opened: false, code }));
    ws.on("error", () => done({ opened: false, code: 1006 }));
    setTimeout(() => done({ opened: false, code: 0 }), 5000);
  });
}

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

async function main() {
  let pass = 0;
  const checks = [];
  const record = (ok, label, detail) => {
    checks.push({ ok, label, detail });
    if (ok) pass++;
  };

  const port = 8093;
  const relay = await startRelay(port);

  // Fill one address's bucket to the cap.
  const held = [];
  let accepted = 0;
  for (let i = 0; i < CONCURRENT_PER_IP; i++) {
    const r = await openWs(port, CLIENT_A);
    if (r.held) {
      accepted++;
      held.push(r.ws);
    }
  }
  record(
    accepted === CONCURRENT_PER_IP,
    "the cap admits exactly " + CONCURRENT_PER_IP + " from one address",
    "accepted " + accepted,
  );

  // The one over the cap: this is the case the page has to read.
  const over = await openWs(port, CLIENT_A);
  record(
    over.code === CLOSE_SHARED_ADDRESS,
    "over-cap refusal closes with " + CLOSE_SHARED_ADDRESS + ", not 1006",
    "code " + over.code + " reason " + JSON.stringify(over.reason),
  );
  record(
    !!over.reason && over.reason.length > 0 && over.reason.length <= 123,
    "the refusal carries a reason string within the protocol's 123 bytes",
    JSON.stringify(over.reason) + " (" + Buffer.byteLength(over.reason || "") + " bytes)",
  );

  // A DEAD relay, for contrast. Nothing is listening on this port.
  const deadPort = await freePort();
  const dead = await openDead(deadPort);
  record(
    dead.code === 1006 && !dead.opened,
    "a relay that is not there still gives 1006 with no code of its own",
    "code " + dead.code,
  );
  record(
    over.code !== dead.code,
    "REFUSED AND DEAD ARE NOW DIFFERENT AT THE CLIENT",
    over.code + " vs " + dead.code,
  );

  // The refusal must not have consumed the slot it was refusing for: a
  // different address must still get in, and so must this one once it
  // makes room.
  const other = await openWs(port, CLIENT_B);
  record(other.held === true, "a refusal does not shut out a different address", "held " + other.held);
  if (other.ws) other.ws.close();

  held.pop().close();
  await wait(600);
  const again = await openWs(port, CLIENT_A);
  record(
    again.held === true,
    "the refused connection consumed no slot: freeing one lets the next in",
    "held " + again.held,
  );
  if (again.ws) again.ws.close();

  // The rate limit is a different code, so the log and the page can tell
  // the two refusals apart even though a visitor is told the same thing.
  let rateCode = null;
  for (let i = 0; i < 80; i++) {
    const r = await openWs(port, "198.51.100.77");
    if (r.ws) r.ws.close();
    if (r.code === CLOSE_SHARED_RATE) {
      rateCode = r.code;
      break;
    }
  }
  record(rateCode === CLOSE_SHARED_RATE, "the rate limit refuses with " + CLOSE_SHARED_RATE, "code " + rateCode);

  // The log still says everything it used to, plus the code.
  const log = relay.out();
  const refusedLines = log.split("\n").filter((l) => l.includes('"upgrade_refused"'));
  const oneLine = refusedLines[0] || "";
  record(
    refusedLines.length > 0 &&
      oneLine.includes('"why"') &&
      oneLine.includes('"ip"') &&
      oneLine.includes('"close_code"'),
    "the refusal log keeps ip and why, and gains close_code",
    refusedLines.length + " refusal lines",
  );

  for (const w of held) {
    try {
      w.close();
    } catch (e) {}
  }
  relay.child.kill("SIGKILL");
  await wait(300);

  console.log("--- refusal probe ---");
  for (const c of checks) {
    console.log((c.ok ? "PASS  " : "FAIL  ") + c.label + "\n        " + c.detail);
  }
  console.log("\n" + pass + "/" + checks.length + " passed");
  process.exit(pass === checks.length ? 0 : 1);
}

main().catch((e) => {
  console.log("REFUSAL PROBE ERROR: " + e.message);
  process.exit(2);
});
