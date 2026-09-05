// Does restore_state need bzimage/initrd in the constructor at all?
// If the snapshot carries full memory and device state, the page can skip
// downloading kit/bzImage-p2 (3.79 MB) and rootfs-temur.cpio.gz (3.89 MB),
// which is most of the page's byte budget. Prove it here before relying
// on it in the browser.
import { V86 } from "v86";
import fs from "fs";

const [statePath, memArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);

let out = "";
let sent = false;
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
});

function send(s) {
  for (const ch of s) emulator.serial0_send(ch);
}

emulator.add_listener("serial0-output-byte", (byte) => {
  out += String.fromCharCode(byte);
  process.stdout.write(String.fromCharCode(byte));
  if (!sent && /#\s$/.test(out.slice(-200))) {
    sent = true;
    setTimeout(() => send("temur --version; echo RESTORE_PROOF_$?\n"), 300);
    return;
  }
  if (sent && /^RESTORE_PROOF_0\s*$/m.test(out)) {
    const ok = /temur 0\.33\.0/.test(out);
    console.log("\n\n=== NO-KERNEL RESTORE " + (ok ? "PASS" : "FAIL") + " ===");
    console.log("restore_ms: " + restoreMs);
    console.log("total_to_proof_ms: " + (Date.now() - t0));
    try {
      emulator.stop();
    } catch (e) {}
    process.exit(ok ? 0 : 1);
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
  console.log("\n\n=== NO-KERNEL RESTORE TIMEOUT ===\n" + out.slice(-1200));
  process.exit(1);
}, 60000);
