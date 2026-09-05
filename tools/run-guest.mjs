// P1 harness: boot the guest under node-v86 and drive a script of shell
// steps over the serial console, timing each one.
//
// Derived from the laptop's kit/v86-run.mjs (kept verbatim in kit/ as the
// boot-check control). This adds: a step script, per-step wall timing,
// a settable memory size, and optional state save/restore.
//
// Usage: node tools/run-guest.mjs <bzImage> <initrd> <steps.json> [memMB]

import { V86 } from "v86";
import fs from "fs";

const [bzimage, initrd, stepsPath, memArg, saveTo] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
const steps = JSON.parse(fs.readFileSync(stepsPath, "utf8"));

const OVERALL_TIMEOUT_MS = 300000;
const CMDLINE = "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";

let out = "";
let stage = "boot";
let idx = -1;
let stepStart = 0;
let bootReadyAt = null;
const t0 = Date.now();
const results = [];

const emulator = new V86({
    wasm_path: "./node_modules/v86/build/v86.wasm",
    bios: { url: "./bios/seabios.bin" },
    vga_bios: { url: "./bios/vgabios.bin" },
    bzimage: { url: bzimage },
    initrd: { url: initrd },
    cmdline: CMDLINE,
    memory_size: MEM_MB * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    autostart: true,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
});

function send(s) { for (const ch of s) emulator.serial0_send(ch); }

function nextStep() {
    idx += 1;
    if (idx >= steps.length) return finish(0, "ALL STEPS DONE");
    const step = steps[idx];
    stepStart = Date.now();
    step._mark = out.length;
    if (step.raw) {
        send(step.raw);
    } else {
        // The leading bare echo guarantees the sentinel starts a line even
        // when the command's output has no trailing newline.
        send(step.cmd + "; echo; echo STEP_" + idx + "_DONE\n");
    }
    if (step.waitMs) {
        setTimeout(() => {
            step._done = true;
            const captured = out.slice(step._mark);
            results.push({ name: step.name, ms: Date.now() - stepStart, out: captured });
            if (step.after) send(step.after);
            setTimeout(nextStep, step.afterMs || 500);
        }, step.waitMs);
    }
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
        bootReadyAt = Date.now() - t0;
        console.log("\n[harness] boot to prompt: " + bootReadyAt + " ms\n");
        setTimeout(nextStep, 500);
        return;
    }
    if (stage === "prompt" && idx >= 0 && idx < steps.length) {
        const step = steps[idx];
        if (step.waitMs || step._done) return;
        const re = new RegExp("^STEP_" + idx + "_DONE\\s*$", "m");
        if (re.test(out.slice(step._mark))) {
            step._done = true;
            results.push({
                name: step.name,
                ms: Date.now() - stepStart,
                out: out.slice(step._mark),
            });
            setTimeout(nextStep, 200);
        }
    }
});

async function finish(code, verdict) {
    console.log("\n\n=== " + verdict + " ===");
    console.log("boot_to_prompt_ms: " + bootReadyAt);
    for (const r of results) console.log("step " + JSON.stringify(r.name) + ": " + r.ms + " ms");
    if (saveTo) {
        const state = await emulator.save_state();
        fs.writeFileSync(saveTo, Buffer.from(state));
        console.log("state saved: " + saveTo + " (" + fs.statSync(saveTo).size + " bytes)");
    }
    fs.writeFileSync("build/last-run.json", JSON.stringify(
        { memMB: MEM_MB, boot_to_prompt_ms: bootReadyAt, results }, null, 2));
    try { emulator.stop(); } catch (e) {}
    process.exit(code);
}

setTimeout(() => {
    console.log("\n\n=== TIMEOUT ===\n" + out.slice(-2000));
    finish(1, "TIMEOUT");
}, OVERALL_TIMEOUT_MS);
