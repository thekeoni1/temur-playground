// Sandbox P3a fix pass, item 4 support: what ACTUALLY makes Enter (CR)
// submit a line on the guest's serial console. KEYLESS.
//
// The baseline snapshot reports -icrnl yet CR still submits, so the naive
// model (ICRNL is the whole story) is wrong. This toggles one flag at a
// time, submitting the probe with CR only, and records stty -g each time
// so the termios comparison is exact rather than parsed out of stty -a.
//
// Usage: node tools/cr-mech.mjs <state.bin> [memMB]
import { V86 } from "v86";
import fs from "fs";

const [statePath, memArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
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
  net_device: { type: "ne2k", relay_url: "wisp://127.0.0.1:8089/", dns_method: "static" },
});
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };
emulator.add_listener("serial0-output-byte", (b) => {
  const ch = String.fromCharCode(b);
  out += ch;
  process.stdout.write(ch);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitFor(re, timeoutMs, from) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const seg = out.slice(from);
      if (re.test(seg)) { clearInterval(iv); resolve({ ok: true, seg }); }
      else if (Date.now() - t0 > timeoutMs) { clearInterval(iv); resolve({ ok: false, seg }); }
    }, 40);
  });
}
// Control channel: always LF, so the experiment can never lock itself out.
async function ctl(cmd, re, ms) {
  send("\x15");
  await sleep(100);
  const from = out.length;
  send(cmd + "\n");
  return await waitFor(re, ms || 8000, from);
}
// The thing under test: submit with CR and nothing else.
async function crProbe(tag) {
  send("\x15");
  await sleep(100);
  const from = out.length;
  send("echo CR''OK_" + tag + "\r");
  const r = await waitFor(new RegExp("CROK_" + tag), 3500, from);
  if (!r.ok) { send("\x15"); await sleep(150); }
  return r.ok;
}
async function g(tag) {
  const r = await ctl("echo G_" + tag + "_B; stty -g; echo G_" + tag + "_E",
    new RegExp("G_" + tag + "_E"), 8000);
  const m = r.seg.match(new RegExp("G_" + tag + "_B\\r?\\n([\\s\\S]*?)\\r?\\nG_" + tag + "_E"));
  return m ? m[1].trim() : "(none)";
}

async function main() {
  await emulator.restore_state(new Uint8Array(fs.readFileSync(statePath)).buffer);
  emulator.run();
  await sleep(1200);
  const rows = [];
  const g0 = await g("AS_RESTORED");
  rows.push(["as restored", g0, await crProbe("A")]);

  await ctl("stty icrnl; echo SE''T1", /SET1/);
  rows.push(["stty icrnl", await g("ICRNL_ON"), await crProbe("B")]);

  await ctl("stty -icrnl; echo SE''T2", /SET2/);
  rows.push(["stty -icrnl", await g("ICRNL_OFF"), await crProbe("C")]);

  await ctl("stty sane; echo SE''T3", /SET3/);
  rows.push(["stty sane", await g("SANE"), await crProbe("D")]);

  await ctl("stty -icrnl -igncr; echo SE''T4", /SET4/);
  rows.push(["sane then -icrnl", await g("SANE_MINUS"), await crProbe("E")]);

  console.log("\n\n================ CR MECHANISM");
  for (const [name, gv, ok] of rows)
    console.log((ok ? "CR WORKS  " : "CR DEAD   ") + name.padEnd(18) + " stty -g: " + gv);
  console.log("================");
  try { emulator.stop(); } catch (e) {}
  process.exit(0);
}
emulator.add_listener("emulator-ready", () => main().catch((e) => { console.error(e); process.exit(4); }));
setTimeout(() => { console.log("\n=== MECH TIMEOUT ==="); process.exit(5); }, 240000);
