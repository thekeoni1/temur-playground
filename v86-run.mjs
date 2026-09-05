// Headless v86 boot check for the minimal i686 guest.
// PASS = guest reaches a shell on ttyS0 and `uname -a` returns an
// i686 32-bit string.
//
// Note: the kernel boot banner ("Linux version 6.19.14 ...") also
// starts with "Linux", so matching must be scoped to output produced
// AFTER the uname command is sent, and must match uname -a's format
// ("Linux <host> <rel> ... i686 GNU/Linux"), not the banner.
//
// Usage: node boot.mjs <bzImage> <initrd.cpio.gz>

import { V86 } from "./node_modules/v86/build/libv86.mjs";

const [bzimage, initrd] = process.argv.slice(2);
if (!bzimage || !initrd) {
    console.error("usage: node boot.mjs <bzImage> <initrd.cpio.gz>");
    process.exit(2);
}

const OVERALL_TIMEOUT_MS = 180000;
const CMDLINE = "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";
const SENTINEL = "BOOTCHECK_UNAME_OK";

let out = "";
let stage = "boot";
let cmdStart = -1;      // out.length at the moment uname was sent
let unameLine = null;

const emulator = new V86({
    wasm_path: "./node_modules/v86/build/v86.wasm",
    bios: { url: "./bios/seabios.bin" },
    vga_bios: { url: "./bios/vgabios.bin" },
    bzimage: { url: bzimage },
    initrd: { url: initrd },
    cmdline: CMDLINE,
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    autostart: true,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
});

function send(s) {
    for (const ch of s) emulator.serial0_send(ch);
}

emulator.add_listener("serial0-output-byte", (byte) => {
    const ch = String.fromCharCode(byte);
    out += ch;
    process.stdout.write(ch);

    const tail = out.slice(-400);

    if (stage === "boot" && /login:\s*$/.test(tail)) {
        stage = "login";
        setTimeout(() => send("root\n"), 300);
        return;
    }

    if ((stage === "boot" || stage === "login") && /#\s$/.test(tail)) {
        stage = "prompt";
        setTimeout(() => {
            cmdStart = out.length;
            send("uname -a && echo " + SENTINEL + "\n");
        }, 500);
        return;
    }

    if (stage === "prompt" && cmdStart >= 0) {
        // Only look at what the guest produced after the command.
        const after = out.slice(cmdStart);
        // Wait for the sentinel echoed as OUTPUT (line of its own),
        // which only happens once uname actually ran and exited 0.
        const sentinelOut = new RegExp("^" + SENTINEL + "\\s*$", "m");
        if (!sentinelOut.test(after)) return;

        // uname -a format, not the boot banner.
        const m = after.match(/^Linux\s+\S+\s+\S+[^\n]*$/m);
        if (m && /\bi[3-6]86\b/.test(m[0])) {
            unameLine = m[0].trim();
            stage = "done";
            finish(0, "PASS");
        } else {
            unameLine = m ? m[0].trim() : "(no uname line found)";
            stage = "done";
            finish(1, "FAIL (uname did not report i686)");
        }
    }
});

function finish(code, verdict) {
    console.log("\n\n=== BOOT CHECK " + verdict + " ===");
    console.log("uname -a: " + (unameLine || "(none)"));
    console.log("stage reached: " + stage);
    try { emulator.stop(); } catch (e) {}
    process.exit(code);
}

setTimeout(() => {
    console.log("\n\n=== TIMEOUT after " + (OVERALL_TIMEOUT_MS / 1000) + "s ===");
    console.log("last 1500 chars of serial0:");
    console.log(out.slice(-1500));
    finish(1, "FAIL");
}, OVERALL_TIMEOUT_MS);
