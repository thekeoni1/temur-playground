// Steps for the P6 OFFLINE page snapshot (state-p6-offline.bin).
//
// THIS TIER FINALLY GETS THE OVERLAY. Until now the offline snapshot was
// built from the P2-era rootfs, so it never received console.sh or the
// MOTD: the ICRNL fix reached only the networked image, and an operator
// met the consequence on the live page with Enter echoing as ^M. The
// page compensated by typing `stty icrnl` at landing on both tiers. That
// compensation STAYS as belt and braces, but it is no longer load
// bearing here, and the raw-boot proof asserts the overlay's own fix
// with the page nudge absent so the belt can never hide its failure
// again.
//
// The local config is kept, unchanged from the P2-era steps. It points
// at a llama.cpp that is not running, which is exactly what makes this
// tier honest: `temur doctor` gives a real diagnosis, which is what the
// page's offline greeting tells the visitor to run.
//
// NOTHING HERE WRITES INTO THE SHARE. Deleted bytes stay in the saved
// state (measured; see tools/assert-empty-9p.mjs), so a snapshot build
// may not write into /files even to test it and tidy up afterwards.
import fs from "fs";

const cfg = JSON.stringify({
  provider: "openai-compat",
  max_tokens: 4096,
  openai_compat: {
    base_url: "http://127.0.0.1:8080/v1",
    model: "local",
    context_window: 8192,
  },
});

const steps = [
  {
    name: "write config",
    cmd:
      "mkdir -p /root/.config/temur && printf '%s' '" +
      cfg +
      "' > /root/.config/temur/config.json && echo config-written",
  },
  {
    name: "ICRNL is ON, from the overlay, on THIS tier at last",
    cmd:
      "stty -g; stty -a 2>/dev/null | tr ' \\t' '\\n\\n' | " +
      "grep -x -e icrnl -e -icrnl",
  },
  {
    name: "the 9p share is mounted at /files and this shell is standing in it",
    cmd:
      "grep ' /files ' /proc/mounts && pwd && " +
      "[ \"$(pwd)\" = /files ] && echo SHARE-LANDING-OK",
  },
  {
    // Read-only on purpose: proving the share is empty must not be the
    // thing that stops it being pristine.
    name: "the share is EMPTY and this build has not written to it",
    cmd: "[ -z \"$(ls -A /files)\" ] && echo SHARE-EMPTY-OK",
  },
  {
    name: "no key material anywhere in this snapshot",
    cmd:
      "ls -la /root/.secrets 2>&1; [ ! -e /root/.secrets ] && " +
      "[ -z \"$APP_SECRET_FILE\" ] && echo KEYLESS-SNAPSHOT-OK",
  },
  { name: "set tty size", cmd: "stty rows 24 cols 80; echo size-set" },
  { name: "settle", cmd: "echo P6-OFFLINE-SNAPSHOT-POINT" },
];

fs.writeFileSync(
  "build/steps-p6-offline-snap.json",
  JSON.stringify(steps, null, 1),
);
console.log("written: " + steps.length + " steps");
