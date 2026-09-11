// THE OFFICE-READ PROOF: temur v0.34.0 turns PDF, Word and spreadsheet
// files dropped into /files into text, inside the shipped snapshot.
//
// This is the claim the page makes to a visitor in one sentence
// ("temur reads PDF, Word and spreadsheet files too"), so it is proved
// where the visitor meets it: on the restored snapshot, on files that
// arrived the way the page delivers them, with the binary that ships.
//
// THE FILES ARRIVE BY emulator.create_file, WHICH IS THE PAGE'S OWN
// UPLOAD PATH. Not a baked-in fixture and not a guest-side printf: the
// same call the drop handler makes, so what is read is what a visitor's
// dropped file would be.
//
// SEEING THE TEXT. No temur surface prints tool output (the one-shot UI,
// the plain REPL and the TUI all print a tool's name and title only), so
// a scripted model stands in the guest on loopback and the request
// bodies it is handed are saved into the share. Those bodies are read
// back over 9p here and printed. They are temur's own bytes, not this
// harness's idea of them. See tools/guest-stub-model.sh.
//
// FIVE CASES, AND TWO OF THEM MUST FAIL. A read tool that had merely
// become permissive would pass three cases out of three, so the set
// includes a text file wearing a .pdf extension (the PDF parser must
// reject it) and an ordinary binary (the binary refusal must still
// stand). Success everywhere would be the failure mode.
//
// NO STATE IS SAVED HERE, and none can be: this run writes into the
// share, and the empty-at-snapshot assert exists to refuse a snapshot
// built on a run that does.
//
// Usage: node tools/proof-office-read.mjs <bzImage> <initrd> <state.bin> <label> [relayUrl]
import { V86 } from "v86";
import fs from "fs";
import { execFileSync } from "child_process";

const [bzimage, initrd, statePath, label, relayArg] = process.argv.slice(2);
const CMDLINE =
  "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";
const DOCS = "build/office";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// The samples are generated, not committed: three small deterministic
// documents whose text is known exactly, so a match is a match and not a
// resemblance.
execFileSync("python3", ["tools/mkdocs-sample.py", DOCS], { stdio: "inherit" });

// What the scripted model will ask for, in order. The last two MUST fail.
const PLAN = [
  { path: "/files/sample.pdf", expect: "Temur reads PDF files now." },
  { path: "/files/sample.docx", expect: "Word documents become plain text." },
  { path: "/files/sample.xlsx", expect: "== Sheet: sales ==" },
  { path: "/files/not-really.pdf", expectError: /malformed or not a PDF/ },
  { path: "/files/blob.bin", expectError: /Cannot read binary file/ },
];

const cfg = {
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" },
  vga_bios: { url: "./bios/vgabios.bin" },
  bzimage: { url: bzimage },
  initrd: { url: initrd },
  cmdline: CMDLINE,
  memory_size: 128 * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  // Empty, like the restore proof: everything the guest knows about the
  // share after restore it can only have got from the state.
  filesystem: {},
  autostart: false,
  disable_keyboard: true,
  disable_mouse: true,
  disable_speaker: true,
};
if (relayArg) {
  cfg.net_device = { type: "ne2k", relay_url: relayArg, dns_method: "static" };
}

const emulator = new V86(cfg);
// DECODE THE CONSOLE AS UTF-8, not byte by byte. temur marks a finished
// tool with U+2713 / U+2717, and String.fromCharCode on each byte splits
// those into two replacement characters, so a check looking for them
// fails on a run that worked. Bytes are kept and the whole buffer is
// decoded on read.
let buf = [];
const decoder = new TextDecoder("utf-8");
let out = "";
const sync = () => { out = decoder.decode(new Uint8Array(buf)); return out; };
emulator.add_listener("serial0-output-byte", (b) => { buf.push(b); });
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };

async function until(re, ms = 60000, what = "") {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (re.test(sync())) return true;
    await wait(200);
  }
  console.log("  TIMEOUT waiting for " + re + " " + what);
  console.log("  tail: " + JSON.stringify(sync().slice(-600)));
  return false;
}

async function run(cmd, ms = 30000) {
  const mark = "M" + Math.random().toString(36).slice(2, 8);
  buf = [];
  send(cmd + "; " + "echo " + mark + "''RC=$?\r");
  await until(new RegExp(mark + "RC=\\d"), ms, cmd);
  const text = sync();
  const m = text.match(new RegExp(mark + "RC=(\\d+)"));
  return { out: text, rc: m ? Number(m[1]) : null };
}

const results = {};
let failed = 0;
function check(name, ok, detail) {
  results[name] = { ok: !!ok, detail };
  if (!ok) failed += 1;
  console.log((ok ? "  PASS  " : "  FAIL  ") + name + (detail ? "  " + detail : ""));
}

console.log("=== office-read proof: " + label + " ===");
const state = fs.readFileSync(statePath);

await new Promise((resolve) => {
  emulator.add_listener("emulator-ready", async () => {
    await emulator.restore_state(new Uint8Array(state).buffer);
    emulator.run();
    console.log("restored " + statePath + " (" + state.length + " B)");
    resolve();
  });
});

buf = [];
send("\r");
await until(/#\s$/, 30000, "prompt after restore");

let r = await run("temur --version");
check(
  "the snapshot's temur is v0.34.0",
  /temur 0\.34\.0/.test(r.out),
  (r.out.match(/temur \d+\.\d+\.\d+/) || [""])[0],
);

// ---- plant, exactly as the page's drop handler does ------------------
const put = async (name, bytes) =>
  emulator.create_file(name, new Uint8Array(bytes));
await put("sample.pdf", fs.readFileSync(DOCS + "/sample.pdf"));
await put("sample.docx", fs.readFileSync(DOCS + "/sample.docx"));
await put("sample.xlsx", fs.readFileSync(DOCS + "/sample.xlsx"));
// A text file wearing a .pdf extension, and an honest binary.
await put("not-really.pdf", Buffer.from("this is plain text, not a PDF\n"));
await put("blob.bin", Buffer.from([0, 1, 2, 3, 255, 254, 0, 0, 7, 9]));
await put("stub.sh", fs.readFileSync("tools/guest-stub-model.sh"));

r = await run("ls -l /files");
check(
  "the five documents arrived over the page's upload path",
  ["sample.pdf", "sample.docx", "sample.xlsx", "not-really.pdf", "blob.bin"]
    .every((n) => r.out.includes(n)),
);

// ---- stand the scripted model up on loopback -------------------------
// The offline tier's SHIPPED config already points at
// http://127.0.0.1:8080/v1 (a local llama.cpp that is not running), so on
// that tier nothing here touches the visitor's configuration: the stub
// simply answers where the config already looks. The networked tier ships
// no config at all, so one is written into /tmp for this run.
r = await run(
  "cp /files/stub.sh /tmp/stub.sh && chmod +x /tmp/stub.sh && echo COP''IED",
);
check("scripted model planted", r.rc === 0 && /COPIED/.test(r.out));

const planLines = PLAN.map((p) => p.path).join("\\n");
r = await run(
  "printf '" + planLines + "\\n' > /tmp/stub-plan && rm -f /tmp/stub-count && " +
    "wc -l < /tmp/stub-plan",
);
check("read plan written", r.rc === 0 && /\b5\b/.test(r.out));

r = await run(
  "printf '127.0.0.1:8080 stream tcp nowait root /bin/sh sh /tmp/stub.sh\\n' " +
    "> /tmp/inetd.conf && inetd /tmp/inetd.conf && sleep 1 && " +
    "netstat -ltn 2>/dev/null | grep ':8080' && echo LISTEN''ING",
);
check(
  "scripted model listening on 127.0.0.1:8080",
  r.rc === 0 && /LISTENING/.test(r.out),
);

let wroteConfig = false;
r = await run(
  "[ -f /root/.config/temur/config.json ] && echo HAS''CFG || echo NO''CFG",
);
if (/NOCFG/.test(r.out)) {
  // Networked tier: it lands at `temur init` with nothing configured.
  const c =
    '{"provider":"openai-compat","max_tokens":4096,"openai_compat":' +
    '{"base_url":"http://127.0.0.1:8080/v1","model":"guest-stub","context_window":8192}}';
  r = await run(
    "mkdir -p /root/.config/temur && printf '%s' '" + c +
      "' > /root/.config/temur/config.json && echo wrote-config",
  );
  wroteConfig = true;
  check("throwaway config written (this tier ships none)", r.rc === 0);
} else {
  check(
    "the tier's own shipped config is used unchanged",
    /HASCFG/.test(r.out),
    "base_url is the local one the offline tier already carries",
  );
}

// ---- the turn ---------------------------------------------------------
r = await run(
  "cd /files && temur -p 'read the documents in /files' --plain 2>&1",
  240000,
);
const turn = r.out;
check(
  "the agent ran to the end of the scripted plan",
  /OFFICE-READ-PROOF-END/.test(turn),
);
check(
  "three office reads SUCCEEDED in the guest",
  ["sample.pdf", "sample.docx", "sample.xlsx"].every((n) =>
    new RegExp("\\u2713 read: /files/" + n.replace(".", "\\.")).test(turn),
  ),
);
// A REFUSED READ PRINTS NO PATH: the one-shot UI falls back to the tool's
// own name when the call carries no title, so both controls render as
// "\u2717 read: read". The path is asserted below, against the tool result
// temur actually sent; what the console can say here is that exactly two
// of the five reads were refused.
const refused = (turn.match(/\u2717 read:/g) || []).length;
const succeeded = (turn.match(/\u2713 read:/g) || []).length;
check(
  "the two controls FAILED, so the read tool is not merely permissive",
  refused === 2 && succeeded === 3,
  succeeded + " succeeded, " + refused + " refused, of " + PLAN.length,
);

// ---- what temur actually sent ----------------------------------------
// Read back over 9p on this emulator, whose filesystem was constructed
// empty. These are the guest's bytes.
const extracted = [];
for (let i = 1; i <= PLAN.length + 1; i += 1) {
  const raw = await emulator.read_file("req-" + i + ".json");
  if (!raw) continue;
  let body;
  try {
    body = JSON.parse(Buffer.from(raw).toString("utf8"));
  } catch (e) {
    continue;
  }
  for (const m of body.messages || []) {
    if (m.role !== "tool") continue;
    const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    if (!extracted.includes(text)) extracted.push(text);
  }
}

console.log("\n---- what temur sent its provider, read back over 9p ----");
for (const [i, text] of extracted.entries()) {
  console.log("\n=== tool result " + (i + 1) + " (" + text.length + " bytes) ===");
  console.log(text);
}
console.log("---- end ----\n");

check(
  "one tool result came back for each of the " + PLAN.length + " reads",
  extracted.length === PLAN.length,
  extracted.length + " result(s)",
);
for (const [i, p] of PLAN.entries()) {
  const hit = extracted[i];
  if (p.expect) {
    check(
      "extracted text of " + p.path + " contains " + JSON.stringify(p.expect),
      !!hit && hit.includes(p.path) && hit.includes(p.expect),
    );
  } else {
    check(
      "control " + p.path + " refused with the right sentence",
      !!hit && p.expectError.test(hit),
      hit ? hit.split("\n")[0].slice(0, 90) : "no tool result found",
    );
  }
}

fs.writeFileSync(
  "build/proof-office-read-" + label + ".json",
  JSON.stringify(
    { label, statePath, wroteConfig, results, extracted, turn, failed },
    null,
    1,
  ),
);
console.log(
  "=== " + (failed ? "FAILED (" + failed + ")" : "ALL PASS") + ": " + label + " ===",
);
try { emulator.stop(); } catch (e) {}
process.exit(failed ? 1 : 0);
