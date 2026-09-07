// P6 proof: the share SURVIVES restore, and files cross in both
// directions with their bytes intact.
//
// THE EMULATOR THAT RESTORES IS BUILT WITH AN EMPTY FILESYSTEM, and that
// is the whole design of this proof rather than a detail of it. If the
// restoring machine were handed a filesystem that already held the
// files, every check below would pass without proving anything. It is
// given filesystem:{}, which is empty, and everything it then knows
// about the share it can only have got from the restored state.
//
// That also rules out the obvious false positive, the guest reading its
// own page cache while the JS-side filesystem is really a new empty one.
// The decisive check here is JS-SIDE read_file on this fresh emulator:
// a page cache inside the guest cannot put bytes on the JS side.
// Belt and braces on top of it, both from the spike: drop_caches before
// the guest-side hash, and a umount/remount that cannot use a cached
// dentry.
//
// NO REMOUNT IS PERFORMED ANYWHERE BEFORE THE SURVIVAL CHECK. That is
// the console.sh lesson applied forward. If a future change breaks
// survival, this proof must go red rather than be quietly repaired by a
// nudge that hides it.
//
// Usage: node tools/proof-9p-restore.mjs <bzImage> <initrd> <state.bin> <label> [relayUrl]
import { V86 } from "v86";
import fs from "fs";
import crypto from "crypto";

const [bzimage, initrd, statePath, label, relayArg] = process.argv.slice(2);
const CMDLINE =
  "console=ttyS0,115200 earlyprintk=serial,ttyS0,115200 tsc=unstable";
const SHARE = "/files";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const cfg = {
  wasm_path: "./node_modules/v86/build/v86.wasm",
  bios: { url: "./bios/seabios.bin" },
  vga_bios: { url: "./bios/vgabios.bin" },
  bzimage: { url: bzimage },
  initrd: { url: initrd },
  cmdline: CMDLINE,
  memory_size: 128 * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  // EMPTY. See the note above: this is what makes the proof a proof.
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
let out = "";
emulator.add_listener("serial0-output-byte", (b) => {
  out += String.fromCharCode(b);
});
const send = (s) => { for (const ch of s) emulator.serial0_send(ch); };

async function until(re, ms = 60000, what = "") {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (re.test(out)) return true;
    await wait(200);
  }
  console.log("  TIMEOUT waiting for " + re + " " + what);
  console.log("  tail: " + JSON.stringify(out.slice(-400)));
  return false;
}

// Run one command, capture its output, carry its exit status.
async function run(cmd, ms = 30000) {
  const mark = "M" + Math.random().toString(36).slice(2, 8);
  out = "";
  send(cmd + "; " + "echo " + mark + "''RC=$?\r");
  await until(new RegExp(mark + "RC=\\d"), ms, cmd);
  const m = out.match(new RegExp(mark + "RC=(\\d+)"));
  return { out, rc: m ? Number(m[1]) : null };
}

const results = {};
let r;
let failed = 0;
function check(name, ok, detail) {
  results[name] = { ok: !!ok, detail };
  if (!ok) failed += 1;
  console.log((ok ? "  PASS  " : "  FAIL  ") + name + (detail ? "  " + detail : ""));
}

console.log("=== 9p restore proof: " + label + " ===");
const state = fs.readFileSync(statePath);

// restore_state reaches into the emulator's internals, so it has to wait
// for "emulator-ready". Calling it on a freshly constructed V86 throws on
// an undefined this.v86 while the wasm is still loading.
await new Promise((resolve) => {
  emulator.add_listener("emulator-ready", async () => {
    const t0 = Date.now();
    await emulator.restore_state(new Uint8Array(state).buffer);
    emulator.run();
    console.log(
      "restored in " + (Date.now() - t0) + " ms; state " + state.length + " B",
    );
    resolve();
  });
});

// The restored guest is already at a shell. Wake it with a bare CR.
// CR, not LF: this guest's console has ICRNL handling that the whole
// programme has learned to type through faithfully.
out = "";
send("\r");
await until(/#\s$/, 30000, "prompt after restore");

// ---- 0. ICRNL, per snapshot, with NO page nudge --------------------
// The named proof-set member. This harness never sends `stty icrnl`, so
// what is measured here is the overlay's own fix arriving inside the
// snapshot. The live page still sends the nudge as belt and braces, and
// this is the check that stops the belt hiding a console.sh regression.
r = await run(
  "stty -a 2>/dev/null | tr ' \\t' '\\n\\n' | grep -x -e icrnl -e -icrnl",
);
check(
  "ICRNL on in the restored snapshot, no page nudge",
  r.rc === 0 && /(^|\n)icrnl(\r|\n)/.test(r.out),
);

// ---- 1. the mount is still there, with NO remount ------------------
r = await run("grep ' " + SHARE + " ' /proc/mounts");
check(
  "mount survives restore with no remount",
  r.rc === 0 && /9p/.test(r.out),
  (r.out.match(/host9p[^\r\n]*/) || [""])[0].trim(),
);

// ---- 2. the share is empty, as shipped -----------------------------
r = await run("ls -A " + SHARE + " | wc -l");
check("share ships empty to the visitor", r.rc === 0 && /(^|\D)0\s/.test(r.out));

// ---- 3. UPLOAD: host bytes in, guest hashes them -------------------
// This is the page's upload path: emulator.create_file is exactly what
// the drop handler calls.
const upBytes = crypto.randomBytes(64 * 1024);
const upSha = sha(upBytes);
await emulator.create_file("uploaded.bin", new Uint8Array(upBytes));
r = await run("sha256sum " + SHARE + "/uploaded.bin", 60000);
const guestUpSha = (r.out.match(/\b[0-9a-f]{64}\b/) || [""])[0];
check(
  "upload: host sha256 == guest sha256",
  guestUpSha === upSha,
  "host " + upSha.slice(0, 16) + " guest " + guestUpSha.slice(0, 16) +
    " (" + upBytes.length + " B)",
);

// ---- 4. the guest's own view is not a page-cache illusion ----------
r = await run(
  "sync; echo 3 > /proc/sys/vm/drop_caches; sha256sum " + SHARE +
    "/uploaded.bin",
  60000,
);
check(
  "same hash after drop_caches (not served from cache)",
  (r.out.match(/\b[0-9a-f]{64}\b/) || [""])[0] === upSha,
);

// cd OUT of the share first. The login shell lands IN /files by design
// (that is the whole point of the landing), so a umount run from there
// fails with EBUSY and the check would be measuring its own footing
// rather than the filesystem.
r = await run(
  "cd / && umount " + SHARE + " && mount -t 9p -o trans=virtio," +
    "version=9p2000.L,msize=65536 host9p " + SHARE + " && ls " + SHARE +
    " && cd " + SHARE,
  60000,
);
check(
  "still listed after umount and remount (no cached dentry)",
  r.rc === 0 && /uploaded\.bin/.test(r.out),
  "rc=" + r.rc,
);

// ---- 5. DOWNLOAD: guest bytes out, JS side hashes them -------------
// The decisive direction. read_file on THIS emulator, whose filesystem
// was constructed empty, is what the page's download button calls.
r = await run(
  "dd if=/dev/urandom of=" + SHARE + "/result.bin bs=1024 count=64 2>/dev/null; " +
    "sha256sum " + SHARE + "/result.bin",
  60000,
);
const guestDownSha = (r.out.match(/\b[0-9a-f]{64}\b/) || [""])[0];
const back = await emulator.read_file("result.bin");
const jsDownSha = back ? sha(Buffer.from(back)) : "";
check(
  "download: guest sha256 == bytes the page reads back",
  guestDownSha && guestDownSha === jsDownSha,
  "guest " + guestDownSha.slice(0, 16) + " js " + jsDownSha.slice(0, 16) +
    " (" + (back ? back.length : 0) + " B)",
);

// ---- 6. and temur is still the thing standing there ----------------
r = await run("cd " + SHARE + " && pwd && command -v temur");
check(
  "temur is present and the share is a working directory",
  r.rc === 0 && /\/files/.test(r.out) && /\/usr\/bin\/temur/.test(r.out),
);

fs.writeFileSync(
  "build/proof-9p-restore-" + label + ".json",
  JSON.stringify({ label, statePath, results, failed }, null, 1),
);
console.log(
  "\n=== " + (failed ? "FAILED (" + failed + ")" : "ALL PASS") + ": " + label + " ===",
);
try { emulator.stop(); } catch (e) {}
process.exit(failed ? 1 : 0);
