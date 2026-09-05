// Steps for the snapshot the PAGE restores from.
// The guest is left sitting at the shell prompt with the temur config
// already written and the tty already sized, so the page only has to
// send the launch line. stty must happen before temur starts (P1
// discovery: without a size temur exits with no frame at all), and tty
// driver state survives into the snapshot, so doing it here means the
// browser never has to.
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
  { name: "set tty size", cmd: "stty rows 24 cols 80; echo size-set" },
  { name: "settle", cmd: "echo PAGE-SNAPSHOT-POINT" },
];

fs.writeFileSync(
  "build/steps-page-snap.json",
  JSON.stringify(steps, null, 1),
);
console.log("written");
