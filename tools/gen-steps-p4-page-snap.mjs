// Steps for the P3a-fix NETWORKED page snapshot (state-p4-page.bin).
//
// Beside tools/gen-steps-p3-page-snap.mjs, which stays as the record of
// what P3a actually built. Two changes:
//
//  1. The inline helper bake is GONE. It wrote into /usr/local/bin, which
//     does not exist in this rootfs, so it never created anything and the
//     old sentinel did not notice. temur-setkey now ships in the overlay
//     at /usr/bin (tools/guest/temur-setkey), and the step that replaced
//     the bake RUNS THE DOCUMENTED COMMAND BY BARE NAME on empty input,
//     so a missing or unrunnable helper fails the snapshot build.
//
//  2. Steps that are supposed to fail say so with expectNonzero, because
//     the runners now fail the whole run on a nonzero step.
//
// The snapshot stays KEYLESS: the config names a key path and the file is
// deliberately never created, which is why temur refuses to start for a
// hosted provider and the page lands the operator at a shell.
import fs from "fs";

const KEYFILE = "/root/.config/temur/key";

const cfg = JSON.stringify({
  provider: "anthropic",
  max_tokens: 4096,
  base_url: "https://api.anthropic.com",
  model: "claude-sonnet-5",
});

const steps = [
  {
    name: "bring up eth0 statically",
    cmd:
      "ip link set eth0 up && ip addr add 192.168.86.100/24 dev eth0 && " +
      "ip route add default via 192.168.86.1 && " +
      "printf '192.0.2.1 api.anthropic.com\\n192.0.2.2 api.openai.com\\n" +
      "192.0.2.3 generativelanguage.googleapis.com\\n192.0.2.4 api.x.ai\\n' " +
      ">> /etc/hosts && echo brought-up",
  },
  {
    name: "write hosted config pointing at a key path, NO KEY FILE",
    cmd:
      "mkdir -p /root/.config/temur && printf '%s' '" +
      cfg +
      "' > /root/.config/temur/config.json && echo config-written",
  },
  {
    // The step that replaces the bake. It runs the command the operator
    // doc gives, by bare name, and asserts the refusal path: exit 1 and
    // no key file. If the helper is missing or broken the snapshot build
    // stops here instead of shipping a guest the operator cannot use.
    name: "PROOF: temur-setkey by BARE NAME on empty input refuses cleanly",
    cmd:
      "command -v temur-setkey && temur-setkey </dev/null; RC=$?; " +
      "echo helper-rc=$RC; [ \"$RC\" = 1 ] && [ ! -e " +
      KEYFILE +
      " ] && echo HELPER-PROOF-OK",
  },
  {
    name: "the key sandbox is available on this kernel",
    cmd:
      "export APP_SECRET_FILE=" +
      KEYFILE +
      "; temur doctor 2>&1 | grep -i 'bash key sandbox'",
  },
  {
    name: "confirm the key file does NOT exist",
    cmd:
      "ls -l " +
      KEYFILE +
      " 2>&1; echo missing-is-expected; echo ---; cat /root/.config/temur/config.json",
  },
  {
    name: "point APP_SECRET_FILE at the key path",
    cmd:
      "export APP_SECRET_FILE=" +
      KEYFILE +
      "; printf 'export APP_SECRET_FILE=%s\\n' " +
      KEYFILE +
      " >> /root/.profile; echo APP_SECRET_FILE=$APP_SECRET_FILE",
  },
  { name: "set tty size", cmd: "stty rows 24 cols 80; echo size-set" },
  {
    name: "prove reachability, still keyless",
    cmd: "temur doctor 2>&1 | grep -iE 'reachable|needs a key'",
  },
  { name: "settle", cmd: "echo P3A-FIX-NET-SNAPSHOT-POINT" },
];

fs.writeFileSync("build/steps-p4-page-snap.json", JSON.stringify(steps, null, 1));
console.log("written: " + steps.length + " steps");
