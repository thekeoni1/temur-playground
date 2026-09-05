// Steps for the P3a NETWORKED page snapshot.
//
// The snapshot is KEYLESS by construction: the config points api_key_file
// at a path, and that file is deliberately not created. temur refuses to
// start for a hosted provider until the key exists, which is why the page
// lands the operator at a shell rather than auto-launching the TUI.
//
// A helper is baked in so the operator never has to type a long command
// with their key on the line. It reads the key with the terminal echo
// off, writes it 0600, and clears the variable.
import fs from "fs";

const KEYFILE = "/root/.config/temur/key";

// Top-level anthropic config. There is no api_key_file for the anthropic
// provider at this level: config.rs documents the key as arriving by path
// through APP_SECRET_FILE, which is exported in the guest below and
// captured in the snapshot's live shell.
const cfg = JSON.stringify({
  provider: "anthropic",
  max_tokens: 4096,
  base_url: "https://api.anthropic.com",
  model: "claude-sonnet-5",
});

// No backslashes anywhere in this script: it is written into the guest
// with printf %b, which would interpret them.
const helper = [
  "#!/bin/sh",
  "# Write an API key to the path temur reads it from, without echoing it.",
  "KEYFILE=" + KEYFILE,
  'printf "Paste your API key, then press Enter (input is hidden): "',
  "stty -echo 2>/dev/null",
  "read -r K",
  "stty echo 2>/dev/null",
  "echo",
  'if [ -z "$K" ]; then echo "no key entered; nothing written"; exit 1; fi',
  "umask 077",
  'printf "%s" "$K" > "$KEYFILE"',
  'chmod 600 "$KEYFILE"',
  "K=",
  'echo "key written to $KEYFILE"',
  'echo "now run: temur"',
].join("\\n");

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
    name: "bake the key helper",
    cmd:
      "printf '%b' '" +
      helper +
      "' > /usr/local/bin/temur-setkey && chmod +x /usr/local/bin/temur-setkey" +
      " && echo helper-written && head -3 /usr/local/bin/temur-setkey",
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
  { name: "settle", cmd: "echo P3A-NET-SNAPSHOT-POINT" },
];

fs.writeFileSync(
  "build/steps-p3-page-snap.json",
  JSON.stringify(steps, null, 1),
);
console.log("written");
