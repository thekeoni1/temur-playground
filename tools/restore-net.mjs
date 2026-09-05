// Sandbox P3a: restore a snapshot into a FRESH networked emulator and
// prove the guest can still reach an allowed destination afterwards.
//
// The question this answers: network state lives in two places, the guest
// kernel (interface, address, route) and the JS-side adapter (the
// websocket to the relay). restore_state brings back the first; the
// second is created fresh by the constructor. If those two reconnect
// cleanly, the NIC can be configured BEFORE the snapshot and the page
// never has to run bring-up at all.
//
// Usage: node tools/restore-net.mjs <state.bin> [memMB] [relayUrl]
import { V86 } from "v86";
import fs from "fs";

const [statePath, memArg, relayArg, nudgeArg] = process.argv.slice(2);
// Optional post-restore nudge, to find the minimum needed to revive the link.
const NUDGE = nudgeArg || "";
const MEM_MB = Number(memArg || 128);
const RELAY = relayArg || "wisp://127.0.0.1:8089/";

let out = "";
let sent = false;
let decided = false;
let restoreMs = null;
const t0 = Date.now();

const emulator = new V86({
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" },
  vga_bios: { url: "./bios/vgabios.bin" },
  memory_size: MEM_MB * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  autostart: false,
  disable_keyboard: true,
  disable_mouse: true,
  disable_speaker: true,
  net_device: {
    type: "ne2k",
    relay_url: RELAY,
    dns_method: "static",
  },
});

function send(s) {
  for (const ch of s) emulator.serial0_send(ch);
}

emulator.add_listener("serial0-output-byte", (byte) => {
  const ch = String.fromCharCode(byte);
  out += ch;
  process.stdout.write(ch);

  if (!sent && /#\s$/.test(out.slice(-200))) {
    sent = true;
    // No bring-up commands: if this works, the restored kernel state was
    // enough and the fresh adapter attached to it.
    const cmd =
      (NUDGE ? NUDGE + "; " : "") +
      "temur doctor 2>&1 | grep -E 'reachable|unreachable'\n";
    setTimeout(() => send(cmd), 400);
    return;
  }
  if (sent && !decided && /(reachable|unreachable):/.test(out)) {
    // Fire once, and judge only AFTER the rest of the line has arrived.
    // Evaluating at trigger time reads a half-written line: the match
    // completes at "PASS: reachable:", before the parenthesised proof.
    decided = true;
    setTimeout(() => {
      const flat = out.replace(/\s+/g, " ");
      const ok =
        flat.includes("PASS: reachable: https://api.anthropic.com") &&
        flat.includes("TCP connect + TLS handshake");
      console.log(
        "\n\n=== POST-RESTORE NETWORK " + (ok ? "PASS" : "FAIL") + " ===",
      );
      console.log("restore_ms: " + restoreMs);
      console.log("total_ms: " + (Date.now() - t0));
      try {
        emulator.stop();
      } catch (e) {}
      process.exit(ok ? 0 : 1);
    }, 1200);
  }
});

emulator.add_listener("emulator-ready", async () => {
  const buf = fs.readFileSync(statePath);
  const tR = Date.now();
  await emulator.restore_state(new Uint8Array(buf).buffer);
  restoreMs = Date.now() - tR;
  console.log("[harness] restore_state took " + restoreMs + " ms");
  emulator.run();
  setTimeout(() => send("\n"), 500);
});

setTimeout(() => {
  console.log("\n\n=== POST-RESTORE TIMEOUT ===\n" + out.slice(-1500));
  process.exit(1);
}, 120000);
