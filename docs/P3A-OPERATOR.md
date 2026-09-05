# P3a: the keyed steps (OPERATOR ONLY)

These are the steps the implementing session must not do, because they
involve a real API key. Everything below happens on the laptop, in a real
browser, with your own key. Nothing here is public: the page and the relay
both bind 127.0.0.1.

The implementing session has never seen, typed, stored or logged a key,
and nothing it produced contains one. Keep it that way by following the
"do not" list at the bottom.

## Before you start

Two processes, in two terminals, from /home/dev/temur-playground:

    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    node tools/relay.mjs            # the WISP relay, 127.0.0.1:8089
    node tools/serve-page.mjs 8088  # the page, 127.0.0.1:8088

Then open a real browser on the laptop at:

    http://localhost:8088/

The notice at the top must say "Networked tier". If it says "OFFLINE
TIER", the relay is not running; start it and reload.

You will land at a guest shell prompt (`#`), NOT at the temur TUI. That is
deliberate: temur refuses to start for a hosted provider until a key
exists, and the page is not allowed to be in the key path.

## Step 1: your key

At the guest shell, run it BY FULL PATH:

    /usr/local/bin/temur-setkey

The bare name does NOT work. The rootfs sets
PATH="/bin:/sbin:/usr/bin:/usr/sbin", which does not include
/usr/local/bin, so `temur-setkey` gives "-sh: temur-setkey: not found".
That is a defect in the snapshot, recorded in reports/P3a.md; the full
path is the workaround until a new keyless snapshot can be built.

It prompts once. Terminal echo is OFF, so the key does not appear on
screen. It writes the key mode 0600 to /root/.config/temur/key INSIDE the
emulated machine, which lives only in your browser tab's memory, and
clears its own variable afterwards. APP_SECRET_FILE already points there.

Sanity check, which prints the size and NOT the contents:

    ls -l /root/.config/temur/key

## Step 2: one real turn, and the tool loop

    temur

Then, in the TUI:

1. Ask it something ordinary that needs no tools, e.g.
   "In one sentence, what is a WISP relay?"
   That is the end-to-end proof: a real turn against a hosted provider,
   with your key, from inside the browser.
2. Then exercise the tool loop with one bash call, e.g.
   "run `uname -a` with the bash tool and tell me the kernel version"
   The guest kernel is 6.19.14 i686, so the answer is checkable.

Leave the TUI with `exit`.

## Step 3: the two failure paths

FAILURE PATH A, a bad key. temur should surface a normal authentication
error in the TUI, not hang:

    printf '%s' 'sk-ant-invalid-not-a-real-key' > /root/.config/temur/key
    temur
    (ask it anything; observe the error; then `exit`)

Then put your real key back with `/usr/local/bin/temur-setkey` if you
want to continue.

FAILURE PATH B, relay down. Stop the relay process in its terminal
(Ctrl-C), then in the still-open browser tab:

    temur
    (ask it anything; observe a connection error, not a hang; then `exit`)

Note the page itself only checks for the relay at load time, so an
already-open tab stays in the networked tier and the failure surfaces
inside temur, which is what this path is meant to show. Reloading the tab
with the relay stopped is the OTHER behaviour, and worth a quick look too:
it should switch to the offline tier and say so plainly.

## Step 4: close the tab

Closing or reloading the tab destroys the emulated machine and everything
in it, including the key. There is nothing to clean up on disk, because
the key only ever existed inside the guest's memory.

## What to report back

Plain descriptions are enough. For each of: the real turn, the bash tool
call, failure path A, failure path B, say whether it behaved and quote the
error wording for the two failures.

## Do NOT, while a key exists

- Do NOT open the page with `?selftest=1` or `?netcheck=1`. The self-test
  captures the terminal buffer and posts it to the local server. It is
  hard-coded to REFUSE the networked tier for exactly this reason, but do
  not rely on that; just do not use it during keyed work.
- Do NOT run `tools/run-guest.mjs`, `tools/run-guest-net.mjs`,
  `tools/restore-net.mjs` or `tools/restore-net-blind.mjs` while your key
  is in play. Those harnesses print every serial byte to stdout, which is
  how a key would end up in a log file.
- Do NOT take a snapshot after entering the key. The page-facing snapshot
  is keyless and proven so; a snapshot taken after step 1 would contain
  your key in the guest's memory image.
- Do NOT paste a terminal transcript anywhere without checking it first.
  `grep -c 'sk-ant-'` on it should print 0.
- The relay's log is connection-level only (destination and byte counts)
  and never contains payload, so it is safe to share as-is.
