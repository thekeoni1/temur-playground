// P1 step 6: restore a saved v86 machine state into a FRESH emulator and
// prove temur still runs there. Measures restore wall time.
//
// Usage: node tools/restore.mjs <bzImage> <initrd> <state.bin> [memMB]

import { V86 } from "v86";
import fs from "fs";

const [bzimage, initrd, statePath, memArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
const CMDLINE = "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";

let out = "";
let sent = false;
let restoreMs = null;
let firstOutputAt = null;
const t0 = Date.now();

const emulator = new V86({
    wasm_path: "./node_modules/v86/build/v86.wasm",
    bios: { url: "./bios/seabios.bin" },
    vga_bios: { url: "./bios/vgabios.bin" },
    bzimage: { url: bzimage },
    initrd: { url: initrd },
    cmdline: CMDLINE,
    memory_size: MEM_MB * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    autostart: false,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
});

function send(s) { for (const ch of s) emulator.serial0_send(ch); }

emulator.add_listener("serial0-output-byte", (byte) => {
    const ch = String.fromCharCode(byte);
    out += ch;
    process.stdout.write(ch);
    if (firstOutputAt === null) firstOutputAt = Date.now() - t0;
    if (!sent && /#\s$/.test(out.slice(-200))) {
        sent = true;
        setTimeout(() => send("temur --version; echo RESTORE_PROOF_$?\n"), 300);
        return;
    }
    if (sent && /^RESTORE_PROOF_0\s*$/m.test(out)) {
        const versionOk = /temur 0\.33\.0/.test(out);
        console.log("\n\n=== RESTORE " + (versionOk ? "PASS" : "FAIL") + " ===");
        console.log("restore_ms: " + restoreMs);
        console.log("first_serial_output_ms: " + firstOutputAt);
        console.log("total_to_proof_ms: " + (Date.now() - t0));
        try { emulator.stop(); } catch (e) {}
        process.exit(versionOk ? 0 : 1);
    }
});

emulator.add_listener("emulator-ready", async () => {
    const buf = fs.readFileSync(statePath);
    const tR = Date.now();
    await emulator.restore_state(new Uint8Array(buf).buffer);
    restoreMs = Date.now() - tR;
    console.log("[harness] restore_state took " + restoreMs + " ms");
    emulator.run();
    // Nudge the console so a restored-at-prompt state prints something.
    setTimeout(() => send("\n"), 500);
});

setTimeout(() => {
    console.log("\n\n=== RESTORE TIMEOUT ===\n" + out.slice(-1200));
    process.exit(1);
}, 120000);
