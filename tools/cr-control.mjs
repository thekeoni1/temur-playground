import { V86 } from "v86";
// Sandbox P3a fix pass, item 4: NEGATIVE CONTROLS for the CR probe.
// Proves the probe can register a failure at all, and pins which termios
// flag actually governs CR submission on the guest console. KEYLESS.
import fs from "fs";
let out = "";
const emulator = new V86({
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" }, vga_bios: { url: "./bios/vgabios.bin" },
  memory_size: 128*1024*1024, vga_memory_size: 2*1024*1024,
  autostart: false, disable_keyboard: true, disable_mouse: true, disable_speaker: true,
  net_device: { type: "ne2k", relay_url: "wisp://127.0.0.1:8089/", dns_method: "static" },
});
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };
emulator.add_listener("serial0-output-byte", (b) => { out += String.fromCharCode(b); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitFor(re, ms, from) { return new Promise((res) => { const t0=Date.now();
  const iv=setInterval(()=>{ const seg=out.slice(from);
    if(re.test(seg)){clearInterval(iv);res(true);} else if(Date.now()-t0>ms){clearInterval(iv);res(false);} },40); }); }
async function ctl(cmd, re) { send("\x15"); await sleep(120); const f=out.length; send(cmd+"\n"); return waitFor(re, 8000, f); }
async function probe(tag, terminator) {
  send("\x15"); await sleep(150); const f = out.length;
  send("echo CR''OK_" + tag + terminator);
  const ok = await waitFor(new RegExp("CROK_"+tag), 3500, f);
  send("\x15"); await sleep(150);
  return ok;
}
async function main(){
  await emulator.restore_state(new Uint8Array(fs.readFileSync("build/state-p3-page.bin")).buffer);
  emulator.run(); await sleep(1200);
  const r = [];
  r.push(["NEGATIVE CONTROL: no terminator at all", await probe("N1", "")]);
  await ctl("stty sane; echo SE''T0", /SET0/);
  r.push(["stty sane + CR", await probe("N2", "\r")]);
  await ctl("stty igncr; echo SE''T1", /SET1/);
  r.push(["stty igncr + CR (must be DEAD)", await probe("N3", "\r")]);
  await ctl("stty -igncr sane; echo SE''T2", /SET2/);
  r.push(["restored + CR", await probe("N4", "\r")]);
  console.log("\n======== CONTROLS");
  for (const [n,ok] of r) console.log((ok?"SUBMITTED":"NO SUBMIT ")+"  "+n);
  console.log("========");
  process.exit(0);
}
emulator.add_listener("emulator-ready", ()=>main().catch(e=>{console.error(e);process.exit(4);}));
setTimeout(()=>{console.log("TIMEOUT");process.exit(5);},180000);
