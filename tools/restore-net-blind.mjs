// Diagnostic: reproduce the PAGE's exact post-restore sequence in node.
//
// The page cannot wait for a shell prompt the way the harnesses do; it
// fires on timers. This runs the same blind timing against the same
// snapshot so the serial output is visible, with no browser and no key
// anywhere involved.
//
// Usage: node tools/restore-net-blind.mjs <state.bin> [memMB]
import { V86 } from "v86";
import fs from "fs";

const [statePath, memArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);

const NET_NUDGE =
  "ip link set eth0 down; ip addr flush dev eth0; ip link set eth0 up; " +
  "ip addr add 192.168.86.100/24 dev eth0; " +
  "ip route add default via 192.168.86.1 2>/dev/null; " +
  "ip neigh flush all\n";
const LAUNCH = "TERM=xterm temur\n";

let out = "";
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
    relay_url: "wisp://127.0.0.1:8089/",
    dns_method: "static",
  },
});

function send(s) {
  for (const ch of s) emulator.serial0_send(ch);
}

emulator.add_listener("serial0-output-byte", (byte) => {
  out += String.fromCharCode(byte);
  process.stdout.write(String.fromCharCode(byte));
});

emulator.add_listener("emulator-ready", async () => {
  const buf = fs.readFileSync(statePath);
  await emulator.restore_state(new Uint8Array(buf).buffer);
  console.log("\n[diag] restored, running with the PAGE's blind timing\n");
  emulator.run();

  setTimeout(() => {
    console.log("\n[diag] --- sending NET_NUDGE ---\n");
    send(NET_NUDGE);
    setTimeout(() => {
      console.log("\n[diag] --- sending LAUNCH ---\n");
      send(LAUNCH);
    }, 900);
  }, 400);
});

setTimeout(() => {
  const alt = out.includes("[?1049h");
  console.log("\n\n[diag] alt-screen seen: " + alt);
  console.log("[diag] total bytes of serial output: " + out.length);
  console.log("[diag] elapsed: " + (Date.now() - t0) + " ms");
  process.exit(alt ? 0 : 1);
}, 25000);
