// Sandbox P3a fix pass, item 4: is CR (Enter) broken from FIRST BOOT, or
// did something in the snapshot break it? KEYLESS.
//
// Two different readers are involved and they behave differently:
//   - the busybox ash LINE EDITOR reads the shell's own command lines and
//     accepts CR directly, so ICRNL does not matter there;
//   - the `read` BUILTIN reads through the kernel line discipline, where
//     CR is only a line terminator if ICRNL translates it.
// The helper the operator needed uses `read -r`, so ICRNL is what decides
// whether Enter works for it.
//
// Usage: node tools/cr-boot.mjs <bzImage> <initrd> [memMB]
import { V86 } from "v86";
import fs from "fs";

const [bzimage, initrd, memArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
let out = "";
let atPrompt = false;

const emulator = new V86({
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" },
  vga_bios: { url: "./bios/vgabios.bin" },
  bzimage: { url: bzimage },
  initrd: { url: initrd },
  cmdline: "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable",
  memory_size: MEM_MB * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  autostart: true,
  disable_keyboard: true,
  disable_mouse: true,
  disable_speaker: true,
});
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };
emulator.add_listener("serial0-output-byte", (b) => {
  const ch = String.fromCharCode(b);
  out += ch;
  process.stdout.write(ch);
  const tail = out.slice(-300);
  if (!atPrompt && /login:\s*$/.test(tail)) { send("root\n"); return; }
  if (!atPrompt && /#\s$/.test(tail)) { atPrompt = true; }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitFor(re, ms, from) {
  return new Promise((res) => { const t0 = Date.now();
    const iv = setInterval(() => { const seg = out.slice(from);
      if (re.test(seg)) { clearInterval(iv); res(true); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); res(false); } }, 40); });
}
async function ctl(cmd, re, ms) { send("\x15"); await sleep(120); const f = out.length; send(cmd + "\n"); return { ok: await waitFor(re, ms || 8000, f), from: f }; }
async function grab(tag, cmd) {
  const f = out.length;
  send("\x15"); await sleep(120);
  send("echo " + tag + "''_B; " + cmd + "; echo " + tag + "''_E\n");
  await waitFor(new RegExp(tag + "_E"), 8000, f);
  const m = out.slice(f).match(new RegExp(tag + "_B\\r?\\n([\\s\\S]*?)\\r?\\n" + tag + "_E"));
  return m ? m[1].trim() : "(none)";
}
// Does CR terminate a `read` builtin line? This is the helper's mechanism.
async function readCR(tag) {
  send("\x15"); await sleep(150);
  const f = out.length;
  send("read -r K; echo RD''_" + tag + "=[$K]\n");   // start the read (LF submits the command itself)
  await sleep(600);
  send("hello\r");                                    // type a value, press Enter as a real terminal does
  const ok = await waitFor(new RegExp("RD_" + tag + "=\\[hello\\]"), 3000, f);
  if (!ok) { send("\n"); await sleep(400); send("\x15"); await sleep(200); }
  return ok;
}

async function main() {
  while (!atPrompt) await sleep(200);
  await sleep(800);
  console.log("\n[cr-boot] at prompt\n");
  const gFresh = await grab("GF", "stty -g");
  const aFresh = await grab("AF", "stty -a");
  const r = [];
  r.push(["FRESH BOOT: shell command line + CR", await (async () => {
    send("\x15"); await sleep(150); const f = out.length;
    send("echo SH''CR_1\r"); return waitFor(/SHCR_1/, 3000, f); })()]);
  r.push(["FRESH BOOT: read builtin + CR", await readCR("F")]);
  await ctl("stty icrnl; echo SE''T1", /SET1/);
  r.push(["after stty icrnl: read builtin + CR", await readCR("G")]);
  const gAfter = await grab("GA", "stty -g");

  console.log("\n\n================ FRESH BOOT CR");
  console.log("stty -g at first prompt : " + gFresh);
  console.log("stty -g after stty icrnl: " + gAfter);
  for (const [n, ok] of r) console.log((ok ? "WORKS    " : "BROKEN   ") + n);
  console.log("---- stty -a at first prompt ----\n" + aFresh);
  console.log("================");
  try { emulator.stop(); } catch (e) {}
  process.exit(0);
}
setTimeout(() => main().catch((e) => { console.error(e); process.exit(4); }), 100);
setTimeout(() => { console.log("\n=== CR BOOT TIMEOUT ==="); process.exit(5); }, 240000);
