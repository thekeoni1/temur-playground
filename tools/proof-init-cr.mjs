// Sandbox P3b item 10: the init-landing proofs. KEYLESS.
//
// WHY A SEPARATE DRIVER. The step runners submit every line with LF
// (0x0A). A browser terminal, and a human, submit Enter as CR (0x0D).
// The P3a fix pass proved that difference is the whole defect: this
// guest's console came up with ICRNL off, so CR never terminated a
// read(2) line, and any harness that types LF cannot see it. The overlay
// now sets `stty icrnl` at the console (etc/profile.d/console.sh), and
// the only honest way to prove that is to type CR, the way the visitor
// will.
//
// NO KEY IS EVER TYPED. The hidden prompt is always answered with a bare
// Enter, which is temur's documented skip. Full serial logging is safe
// here for exactly that reason.
//
// Usage: node tools/proof-init-cr.mjs <state.bin> <variant> [memMB] [relayUrl]
//   wizard         walk the whole wizard with CR only, skip the key
//   ctrlc-template Ctrl-C at the first question lands at a usable shell
//   ctrlc-hidden   Ctrl-C at the hidden key prompt does NOTHING, then
//                  Enter skips cleanly and echo comes back
import { V86 } from "v86";
import fs from "fs";

const [statePath, variant, memArg, relayArg] = process.argv.slice(2);
const MEM_MB = Number(memArg || 128);
const RELAY = relayArg || "wisp://127.0.0.1:8089/";
const VARIANTS = ["wizard", "ctrlc-template", "ctrlc-hidden"];
if (!statePath || !VARIANTS.includes(variant)) {
  console.error("usage: proof-init-cr.mjs <state.bin> <" + VARIANTS.join("|") + ">");
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
  return new Promise((res) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (re.test(out.slice(from))) { clearInterval(iv); res(true); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); res(false); }
    }, 40);
  });
}

// Control channel: LF, so a failed CR experiment can never lock the
// driver out of the guest.
async function grab(tag, cmd) {
  // The end marker is SPLIT in the typed text. Without that, waitFor
  // matches the shell's own echo of the command line and returns before
  // the output exists (the bug that made every capture read "(none)" on
  // the fix pass's first attempt).
  send("\x15"); await sleep(120);
  const f = out.length;
  send("echo " + tag + "''_B; " + cmd + "; echo " + tag + "''_E\n");
  await waitFor(new RegExp(tag + "_E"), 12000, f);
  const m = out.slice(f).match(
    new RegExp(tag + "_B\\r?\\n([\\s\\S]*?)\\r?\\n" + tag + "_E"));
  return m ? m[1].trim() : "(none)";
}

// One wizard answer, typed the way a human types it: the text, then CR,
// and nothing else. Returns whether the NEXT prompt arrived on the CR
// alone. A false here is the defect the overlay exists to prevent.
async function answerCR(text, nextRe, ms) {
  const f = out.length;
  send(text + "\r");
  const okOnCR = await waitFor(nextRe, ms || 12000, f);
  return { okOnCR, from: f };
}

const results = {};
function record(k, v) { results[k] = v; console.log("[proof] " + k + " = " + JSON.stringify(v)); }

async function main() {
  await emulator.restore_state(new Uint8Array(fs.readFileSync(statePath)).buffer);
  emulator.run();
  await sleep(1200);
  console.log("\n[proof] restored, variant=" + variant + "\n");

  // The claim the whole item rests on: the RESTORED machine, not just a
  // fresh boot, has ICRNL on, because the login shell that set it ran
  // before the snapshot point and termios lives in the snapshot.
  const g0 = await grab("GB", "stty -g");
  record("stty_g_after_restore", g0);
  record("icrnl_after_restore", await grab("GI",
    "stty -a 2>/dev/null | tr ' \\t' '\\n\\n' | grep -x -e icrnl -e -icrnl"));
  record("config_exists_before", await grab("GC",
    "[ -e /root/.config/temur/config.json ] && echo yes || echo no"));

  if (variant === "wizard") {
    send("\x15"); await sleep(150);
    let f = out.length;
    send("TERM=xterm temur init\r");
    record("wizard_started_on_CR", await waitFor(/Template \[1\]: /, 15000, f));

    // Template by NAME, the way the operator did it in keyed run two.
    let r = await answerCR("gemini", /Model id \[gemini-3\.6-flash\]: /);
    record("q1_template_took_CR", r.okOnCR);

    // Bare Enter = accept the default. This is the answer a human gives
    // most often and the one that broke before.
    r = await answerCR("", /API key file path \[\/root\/\.secrets\/temur-gemini-key\]: /);
    record("q2_model_default_took_CR", r.okOnCR);

    r = await answerCR("", /Paste your API key \(input hidden; Enter to skip and add it later\): /);
    record("q3_keypath_default_took_CR", r.okOnCR);

    // NO KEY. A bare Enter is temur's documented skip.
    r = await answerCR("", /Paste your key into .* with your editor/);
    record("q4_hidden_prompt_skipped_on_CR", r.okOnCR);

    await waitFor(/#\s$/, 15000, r.from);
    await sleep(600);

    record("stty_g_after_wizard", await grab("GA", "stty -g"));
    record("echo_restored", results.stty_g_after_wizard === g0);
    record("config_written", await grab("GW", "cat /root/.config/temur/config.json"));
    record("key_file", await grab("GK", "ls -l /root/.secrets/temur-gemini-key"));
    record("key_file_is_empty", await grab("GZ",
      "[ ! -s /root/.secrets/temur-gemini-key ] && echo EMPTY || echo NONEMPTY"));
    record("shell_usable_on_CR", (await answerCR("echo SHELL''_ALIVE", /SHELL_ALIVE/, 6000)).okOnCR);
  }

  if (variant === "ctrlc-template") {
    send("\x15"); await sleep(150);
    let f = out.length;
    send("TERM=xterm temur init\r");
    record("wizard_started_on_CR", await waitFor(/Template \[1\]: /, 15000, f));
    f = out.length;
    send("\x03");
    // A plain SIGINT: init installs no handler here, so the wizard dies
    // and the shell prompt comes back.
    record("prompt_returned_after_ctrl_c", await waitFor(/#\s$/, 8000, f));
    await sleep(400);
    record("shell_usable_on_CR", (await answerCR("echo SHELL''_ALIVE", /SHELL_ALIVE/, 6000)).okOnCR);
    record("stty_g_after_ctrl_c", await grab("GA", "stty -g"));
    record("termios_untouched", results.stty_g_after_ctrl_c === g0);
    record("no_config_written", await grab("GC2",
      "[ -e /root/.config/temur/config.json ] && echo yes || echo no"));
    record("motd_still_available", await grab("GM", "head -1 /etc/temur-motd"));
  }

  if (variant === "ctrlc-hidden") {
    send("\x15"); await sleep(150);
    let f = out.length;
    send("TERM=xterm temur init\r");
    await waitFor(/Template \[1\]: /, 15000, f);
    await answerCR("gemini", /Model id \[gemini-3\.6-flash\]: /);
    await answerCR("", /API key file path \[\/root\/\.secrets\/temur-gemini-key\]: /);
    await answerCR("", /Paste your API key \(input hidden; Enter to skip and add it later\): /);
    record("reached_hidden_prompt", true);

    // Inside the hidden prompt temur ignores SIGINT ON PURPOSE, so a
    // Ctrl-C cannot kill the process while echo is off and strand the
    // operator at a terminal that does not echo. Prove it does nothing:
    // no shell prompt, no skip message, still waiting.
    f = out.length;
    send("\x03");
    const died = await waitFor(/#\s$|Paste your key into/, 4000, f);
    record("ctrl_c_at_hidden_prompt_did_nothing", !died);

    // And now the documented way out: a bare Enter skips.
    const r = await answerCR("", /Paste your key into .* with your editor/, 10000);
    record("enter_skips_after_ctrl_c", r.okOnCR);
    await waitFor(/#\s$/, 15000, r.from);
    await sleep(600);
    record("stty_g_after", await grab("GA", "stty -g"));
    record("echo_restored", results.stty_g_after === g0);
    record("key_file_is_empty", await grab("GZ",
      "[ ! -s /root/.secrets/temur-gemini-key ] && echo EMPTY || echo NONEMPTY"));
    record("shell_usable_on_CR", (await answerCR("echo SHELL''_ALIVE", /SHELL_ALIVE/, 6000)).okOnCR);
  }

  console.log("\n\n================ INIT LANDING PROOF: " + variant);
  for (const [k, v] of Object.entries(results)) console.log("  " + k + ": " + JSON.stringify(v));
  console.log("================");
  try { emulator.stop(); } catch (e) {}
  process.exit(0);
}
emulator.add_listener("emulator-ready", () =>
  main().catch((e) => { console.error(e); process.exit(4); }));
setTimeout(() => { console.log("\n=== PROOF TIMEOUT ==="); process.exit(5); }, 420000);
