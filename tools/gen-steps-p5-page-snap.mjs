// Steps for the P3b NETWORKED page snapshot (state-p5-page.bin).
//
// Beside tools/gen-steps-p4-page-snap.mjs, which stays as the record of
// what the P3a fix pass built. THE GUEST NOW LANDS AT `temur init`
// (P3b brief item 10), and that inverts what the snapshot may contain.
//
// WHAT WENT AWAY, and why each one had to:
//
//  1. THE BAKED HOSTED CONFIG. `temur init` refuses to run when a config
//     already exists ("config already exists at ...; rerun with --force"),
//     so a snapshot carrying /root/.config/temur/config.json would land
//     the visitor on an error instead of the wizard. The snapshot now
//     ships NO config at all, which is also what a real first install
//     looks like.
//  2. THE BESPOKE KEY HELPER AND ITS PROOF. temur's own hidden key prompt
//     does this job, better: it is the product's code, it is what a
//     laptop install uses, and it has no separate validation to get
//     wrong. The helper is retired from the overlay and the docs.
//  3. APP_SECRET_FILE IN /root/.profile. init writes api_key_file into
//     the profile it generates, so the environment route is not needed
//     and a stale export would only confuse a later provider choice.
//
// WHAT THAT COSTS, and how it is paid. Both remaining doctor proofs need
// a config to read: with none, doctor FAILs at "no config file" and
// returns before it reaches either the sandbox line or the reachability
// probe (src/doctor.rs, the load_from_reporting match). So the proof runs
// against a THROWAWAY config under a redirected XDG_CONFIG_HOME, in /tmp,
// removed in the same step. Nothing it touches is under /root, and the
// step ends by proving the throwaway is gone.
//
// The snapshot stays KEYLESS: no key file is ever created anywhere in
// this build, and the visitor types their own key into temur's hidden
// prompt after the page has already been served.
import fs from "fs";

// The throwaway lives entirely under here and is deleted before the
// snapshot point.
const PROBE = "/tmp/p5probe";

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
    // The one place a config exists during this build, and it exists for
    // the length of one command.
    name: "PROOF (throwaway config, removed here): key sandbox + reachability",
    cmd:
      "mkdir -p " +
      PROBE +
      "/temur && printf '%s' '" +
      cfg +
      "' > " +
      PROBE +
      "/temur/config.json && " +
      "XDG_CONFIG_HOME=" +
      PROBE +
      " APP_SECRET_FILE=" +
      PROBE +
      "/key temur doctor > " +
      PROBE +
      "/doctor.txt 2>&1; " +
      "grep -i 'key isolation\\|bash key sandbox' " +
      PROBE +
      "/doctor.txt; grep -iE '(un)?reachable:' " +
      PROBE +
      "/doctor.txt; rm -rf " +
      PROBE +
      "; [ ! -e " +
      PROBE +
      " ] && echo PROBE-REMOVED",
  },
  {
    name: "the snapshot carries NO config, NO key, and no leftover probe",
    cmd:
      "ls -la /root/.config/temur 2>&1; ls -la /root/.secrets 2>&1; " +
      "ls -la /tmp 2>&1; " +
      "[ ! -e /root/.config/temur/config.json ] && [ ! -e /root/.secrets ] && " +
      "[ ! -e " +
      PROBE +
      " ] && echo KEYLESS-SNAPSHOT-OK",
  },
  {
    name: "APP_SECRET_FILE is NOT persisted anywhere",
    cmd:
      "echo env=[$APP_SECRET_FILE]; grep -c APP_SECRET_FILE /root/.profile " +
      "/etc/profile /etc/profile.d/*.sh 2>&1; " +
      "[ -z \"$APP_SECRET_FILE\" ] && echo NO-SECRET-ENV-OK",
  },
  {
    name: "ICRNL is ON, from the overlay, so Enter works in the wizard",
    cmd: "stty -g; stty -a 2>/dev/null | tr ' \\t' '\\n\\n' | grep -x -e icrnl -e -icrnl",
  },
  { name: "set tty size", cmd: "stty rows 24 cols 80; echo size-set" },
  { name: "settle", cmd: "echo P3B-INIT-LANDING-SNAPSHOT-POINT" },
];

fs.writeFileSync("build/steps-p5-page-snap.json", JSON.stringify(steps, null, 1));
console.log("written: " + steps.length + " steps");
