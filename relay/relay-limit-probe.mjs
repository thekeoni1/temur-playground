// DEPLOY-TIME PROBE. It cannot pass from a build session: proof 2 opens
// real streams to a real provider endpoint, so it needs live egress
// that a laptop session does not do, and it fails at "wisp connect
// failed" without it. It belongs to the deploy plan's step 9
// rate-limits proof, run against the live relay with the operator
// present. Left exactly as it is until then: fix-or-retire is a
// decision for that run, not for a session that cannot execute it.
//
// Sandbox P3a: prove the relay's rate limits actually trip.
//
// Two limits, two proofs:
//   1. wsPerIpPerMinute  - open more wisp websockets from one IP than the
//      per-minute allowance and show the surplus refused at the upgrade.
//   2. streamsPerHost    - open more concurrent streams to one allowed
//      destination than the per-host cap and show the surplus refused.
//
// No application data is sent on any stream.
import { client as wispc } from "@mercuryworkshop/wisp-js/client";
import { WebSocket } from "ws";

const URL_ = process.argv[2] || "ws://127.0.0.1:8089/";
const PER_MIN = Number(process.argv[3] || 30);
const PER_HOST = Number(process.argv[4] || 8);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. per-IP websocket rate limit ----------------------------------
async function wsRateLimit() {
  const attempts = PER_MIN + 6;
  let accepted = 0;
  let refused = 0;
  const sockets = [];

  for (let i = 0; i < attempts; i++) {
    const ok = await new Promise((resolve) => {
      const ws = new WebSocket(URL_);
      let settled = false;
      const done = (v) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      };
      ws.on("open", () => {
        sockets.push(ws);
        done(true);
      });
      ws.on("error", () => done(false));
      ws.on("close", () => done(false));
      setTimeout(() => done(false), 4000);
    });
    if (ok) accepted++;
    else refused++;
    // Close as we go so the CONCURRENT cap does not fire first and
    // confuse which limit we are demonstrating.
    if (sockets.length > 4) {
      try {
        sockets.shift().close();
      } catch (e) {}
      await wait(30);
    }
  }
  for (const s of sockets) {
    try {
      s.close();
    } catch (e) {}
  }

  const pass = refused > 0 && accepted <= PER_MIN + 1;
  console.log(
    (pass ? "PASS  " : "FAIL  ") +
      "per-IP websocket rate limit: " +
      attempts +
      " attempts, " +
      accepted +
      " accepted, " +
      refused +
      " refused (cap " +
      PER_MIN +
      "/min)",
  );
  return pass;
}

// --- 2. per-host concurrent stream cap -------------------------------
async function perHostLimit() {
  await wait(61000); // let the per-minute window drain

  const conn = await new Promise((resolve, reject) => {
    const c = new wispc.ClientConnection(URL_);
    c.onopen = () => resolve(c);
    c.onerror = () => reject(new Error("wisp connect failed"));
    setTimeout(() => reject(new Error("timeout")), 10000);
  });

  const want = PER_HOST + 4;
  const outcomes = await Promise.all(
    Array.from({ length: want }, () =>
      new Promise((resolve) => {
        const s = conn.create_stream("192.0.2.1", 443);
        let settled = false;
        s.onclose = () => {
          if (!settled) {
            settled = true;
            resolve("refused");
          }
        };
        setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve("open");
          }
        }, 8000);
      }),
    ),
  );

  const open = outcomes.filter((o) => o === "open").length;
  const refused = outcomes.filter((o) => o === "refused").length;
  const pass = refused > 0 && open <= PER_HOST;
  console.log(
    (pass ? "PASS  " : "FAIL  ") +
      "per-host concurrent stream cap: " +
      want +
      " requested, " +
      open +
      " open, " +
      refused +
      " refused (cap " +
      PER_HOST +
      ")",
  );
  return pass;
}

const main = async () => {
  const a = await wsRateLimit();
  const b = await perHostLimit();
  console.log("\n--- summary ---");
  console.log(Number(a) + Number(b) + "/2 passed");
  process.exit(a && b ? 0 : 1);
};

main().catch((e) => {
  console.log("LIMIT PROBE ERROR: " + e.message);
  process.exit(2);
});
