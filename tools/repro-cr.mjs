// Sandbox P3a fix pass, item 4: the Enter/CR repro. KEYLESS.
//
// WHY THIS HARNESS EXISTS. The P2/P3a step runners submit every line with
// LF (0x0A). A real terminal, and xterm.js in the page, submits Enter as
// CR (0x0D). So the existing harnesses are structurally blind to exactly
// the defect the operator hit. Everything under test here is submitted
// with CR; LF is used only on the control channel, so the experiment can
// never lock itself out of the guest.
//
// TWO READERS, MEASURED SEPARATELY, because they do not behave alike:
//   - the busybox ash LINE EDITOR reads the shell's own command lines and
//     accepts CR itself, so the tty's ICRNL does not matter there;
//   - the `read` BUILTIN reads through the kernel line discipline, where
//     CR only terminates a line if ICRNL translates it. The key helper
//     uses `read -r`, so this is the one that decides whether Enter works
//     for the operator.
//
// No key exists anywhere in this pass, which is why full serial logging
// is safe here.
//
// Usage: node tools/repro-cr.mjs <state.bin> <variant> [memMB] [relayUrl]
//   variant: baseline | doctor | tuiprobe | hiddenread
import { V86 } from "v86";
import fs from "fs";

const [statePath, variant, memArg, relayArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
const RELAY = relayArg || "wisp://127.0.0.1:8089/";
const VARIANTS = ["baseline", "doctor", "tuiprobe", "hiddenread"];
if (!statePath || !VARIANTS.includes(variant)) {
  console.error("usage: repro-cr.mjs <state.bin> <" + VARIANTS.join("|") + ">");
  process.exit(2);
}

let out = "";
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
  net_device: { type: "ne2k", relay_url: RELAY, dns_method: "static" },
});
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };
emulator.add_listener("serial0-output-byte", (b) => {
  const ch = String.fromCharCode(b);
  out += ch;
  process.stdout.write(ch);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitFor(re, ms, from) {
  return new Promise((res) => { const t0 = Date.now();
    const iv = setInterval(() => { const seg = out.slice(from);
      if (re.test(seg)) { clearInterval(iv); res(true); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); res(false); } }, 40); });
}
// Control channel: LF, always recoverable.
async function ctl(cmd, re, ms) {
  send("\x15"); await sleep(120);
  const f = out.length; send(cmd + "\n");
  return waitFor(re, ms || 8000, f);
}
// Markers are split with '' so the shell's echo of the typed command can
// never satisfy the regex that looks for the command's OUTPUT.
async function grab(tag, cmd) {
  // The end marker MUST be split in the typed text, or waitFor matches the
  // shell's echo of the command line and returns before the output exists.
  // That bug made every "before" capture read as (none) on the first pass.
  send("\x15"); await sleep(120);
  const f = out.length;
  send("echo " + tag + "''_B; " + cmd + "; echo " + tag + "''_E\n");
  await waitFor(new RegExp(tag + "_E"), 10000, f);
  const m = out.slice(f).match(new RegExp(tag + "_B\\r?\\n([\\s\\S]*?)\\r?\\n" + tag + "_E"));
  return m ? m[1].trim() : "(none)";
}
async function shellCR(tag) {
  send("\x15"); await sleep(150);
  const f = out.length;
  send("echo SH''CR_" + tag + "\r");
  const ok = await waitFor(new RegExp("SHCR_" + tag), 3500, f);
  if (!ok) { send("\x15"); await sleep(200); }
  return ok;
}
// Three distinguishable outcomes, because the middle one is the dangerous
// one: CR does not end the line, the value keeps accumulating, and when a
// real LF finally arrives the variable carries an embedded CR. A key
// entered that way is silently corrupted.
async function readCR(tag) {
  send("\x15"); await sleep(150);
  const f = out.length;
  send("read -r K; echo RD''_" + tag + "=[$K]\n");
  await sleep(700);
  send("hello\r");
  const onCR = await waitFor(new RegExp("RD_" + tag + "=\\["), 3000, f);
  if (!onCR) {
    send("\n"); // Ctrl-J: what the operator had to fall back to
    await waitFor(new RegExp("RD_" + tag + "=\\["), 3000, f);
  }
  const m = out.slice(f).match(new RegExp("RD_" + tag + "=\\[([^\\]]*)\\]"));
  const val = m ? m[1] : null;
  send("\x15"); await sleep(200);
  if (val === "hello") return onCR ? "ok" : "needs-ctrl-j";
  if (val === null) return "no-value";
  return "corrupt:" + JSON.stringify(val);
}
async function measure(tag) {
  return {
    g: await grab("G" + tag, "stty -g"),
    shell: await shellCR(tag + "s"),
    read: await readCR(tag + "r"),
  };
}

async function main() {
  await emulator.restore_state(new Uint8Array(fs.readFileSync(statePath)).buffer);
  emulator.run();
  await sleep(1200);
  console.log("\n[repro] restored, variant=" + variant + "\n");
  const before = await measure("B");

  console.log("\n[repro] --- action: " + variant + " ---\n");
  if (variant === "baseline") {
    // nothing: proves the measurement itself changes nothing
  } else if (variant === "doctor") {
    await ctl("temur doctor > /tmp/doc.txt 2>&1; echo DOC''TOR_RC=$?", /DOCTOR_RC=/, 180000);
  } else if (variant === "tuiprobe") {
    const f = out.length;
    send("temur tui-probe\n");
    await waitFor(/\[\?1049h|not found|Error/, 8000, f);
    await sleep(1500);
    send("q");
    await waitFor(/tui-probe (OK|FAILED)/, 15000, f);
  } else if (variant === "hiddenread") {
    send("\x15"); await sleep(150);
    send("stty -echo; read -r K; stty echo; echo READ''_DONE\n");
    await sleep(1200);
    send("\x03");
    await sleep(1200);
  }
  await sleep(600);
  const after = await measure("A");

  const changed = before.g !== after.g;
  console.log("\n\n================ REPRO RESULT: " + variant);
  console.log("stty -g BEFORE: " + before.g);
  console.log("stty -g AFTER : " + after.g);
  console.log("termios changed by the action: " + (changed ? "YES" : "NO"));
  console.log("shell command line + CR: before=" + (before.shell ? "works" : "broken") +
              " after=" + (after.shell ? "works" : "broken"));
  console.log("read builtin      + CR: before=" + before.read + " after=" + after.read);
  const regressed =
    (before.shell && !after.shell) || before.read !== after.read || changed;
  console.log("VERDICT: " + (regressed
    ? "this action CHANGED the terminal state"
    : "this action left the terminal state untouched"));
  console.log("================");
  try { emulator.stop(); } catch (e) {}
  process.exit(0);
}
emulator.add_listener("emulator-ready", () => main().catch((e) => { console.error(e); process.exit(4); }));
setTimeout(() => { console.log("\n=== REPRO TIMEOUT ==="); process.exit(5); }, 420000);
