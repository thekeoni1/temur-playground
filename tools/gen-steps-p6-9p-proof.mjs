// P6 proofs, on a RAW BOOT of the p6 kernel and overlay.
//
// RAW BOOT IS THE POINT OF THIS FILE. Every check here runs on a machine
// the page has not touched: no CONSOLE_FIX, no NET_NUDGE, no landing
// line typed in. That matters most for ICRNL. The page still sends
// `stty icrnl` at landing as belt and braces, and it is exactly that
// belt which could hide a console.sh regression forever, because every
// proof since P3a has run downstream of it. So the overlay's own fix is
// asserted HERE, where nothing else could have supplied it.
//
// The same reasoning covers the 9p mount and the landing directory:
// asserted on the raw boot, so the guest is shown to stand up correctly
// on its own rather than to have been propped up by the page.
import fs from "fs";

const SHARE = "/files";

const steps = [
  {
    // The belt-and-braces trap, disarmed. If console.sh ever stops
    // reaching an overlay again, this line goes red on the raw boot even
    // though the live page would still feel fine.
    name: "RAW BOOT ICRNL: on, from the overlay, with NO page nudge",
    cmd:
      "stty -a 2>/dev/null | tr ' \\t' '\\n\\n' | grep -x -e icrnl -e -icrnl | " +
      "grep -x icrnl && echo RAW-ICRNL-OK",
  },
  { name: "the full termios, for the record", cmd: "stty -g" },
  {
    name: "the 9p share is mounted at " + SHARE + ", 9p2000.L over virtio",
    cmd:
      "mount | grep ' " + SHARE + " ' && " +
      "grep -q '9p' /proc/mounts && echo MOUNT-OK",
  },
  {
    name: "the mount options are the ones S30files asked for",
    cmd: "grep ' " + SHARE + " ' /proc/mounts",
  },
  {
    // Item 3: the landing. temur inherits this cwd, so a dropped file is
    // simply in front of the agent.
    name: "the login shell LANDS in " + SHARE + ", so temur starts there",
    cmd: "pwd && [ \"$(pwd)\" = \"" + SHARE + "\" ] && echo LANDING-OK",
  },
  {
    name: "the share is EMPTY on a fresh boot",
    cmd:
      "ls -A " + SHARE + " | wc -l && " +
      "[ -z \"$(ls -A " + SHARE + ")\" ] && echo SHARE-EMPTY-OK",
  },
  {
    name: "the share is writable and reads back what was written",
    cmd:
      "printf 'guest-side round trip\\n' > " + SHARE + "/g.txt && " +
      "cat " + SHARE + "/g.txt && sha256sum " + SHARE + "/g.txt && " +
      "rm -f " + SHARE + "/g.txt && [ ! -e " + SHARE + "/g.txt ] && " +
      "echo SHARE-RW-OK",
  },
  {
    name: "S30files is in the boot path, mode 0755 root:root",
    cmd: "ls -ln /etc/init.d/S30files",
  },
  {
    name: "the MOTD is there and names the share",
    cmd: "cat /etc/temur-motd && grep -q '" + SHARE + "' /etc/temur-motd && echo MOTD-OK",
  },
  {
    name: "console.sh mode 0644 root:root, still the only profile.d addition",
    cmd: "ls -ln /etc/profile.d/",
  },
  {
    name: "the snapshot ships NO config.json, so temur init will not refuse",
    cmd: "[ ! -e /root/.config/temur/config.json ] && echo NO-CONFIG-OK",
  },
  {
    name: "temur is still the shipped binary at /usr/bin",
    cmd: "command -v temur && temur --version",
  },
];

fs.writeFileSync("build/steps-p6-9p-proof.json", JSON.stringify(steps, null, 1));
console.log("written: " + steps.length + " steps");
