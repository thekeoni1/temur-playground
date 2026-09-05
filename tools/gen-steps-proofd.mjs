// Generate the proof (d) step script for the P2 harness run.
// Written as a file rather than a shell one-liner: the config JSON is
// nested inside a shell single-quoted string inside a JSON string, and
// doing that through bash -c quoting was a losing game.
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

// 13 DEL bytes: erase "hello from p2" so the exit that follows is the
// only thing ever submitted. Without this the prompt would send
// "hello from p2exit" at a server that is not there.
const BS = String.fromCharCode(127).repeat(13);

const steps = [
  {
    name: "write config",
    cmd:
      "mkdir -p /root/.config/temur && printf '%s' '" +
      cfg +
      "' > /root/.config/temur/config.json && echo config-written",
  },
  { name: "set tty size", cmd: "stty rows 24 cols 80; echo size-set" },
  {
    name: "launch temur, hold 12s",
    raw: "TERM=xterm temur 2>/root/tui.err\n",
    waitMs: 12000,
    after: "",
    afterMs: 300,
  },
  {
    name: "type text, echo proof",
    raw: "hello from p2",
    waitMs: 3000,
    after: "",
    afterMs: 300,
  },
  { name: "erase typed text", raw: BS, waitMs: 2500, after: "", afterMs: 300 },
  {
    name: "type exit and submit",
    raw: "exit\n",
    waitMs: 5000,
    after: "",
    afterMs: 500,
  },
  {
    name: "back at shell",
    cmd: "echo TEMUR-EXIT-STATUS=$?; echo BACK-AT-SHELL",
  },
  {
    name: "tui stderr",
    cmd: "echo STDERR-FOLLOWS; cat /root/tui.err 2>&1 | head -20; echo STDERR-ENDS",
  },
];

fs.writeFileSync(
  "build/steps-p2-proofd.json",
  JSON.stringify(steps, null, 1),
);
console.log("written; backspace count =", [...BS].length);
console.log("config cmd:", steps[0].cmd);
