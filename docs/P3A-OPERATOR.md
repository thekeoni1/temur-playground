# P3a: the keyed steps (OPERATOR ONLY)

These are the steps the implementing session must not do, because they
involve a real API key. Everything below happens on the laptop, in a real
browser, with your own key. Nothing here is public: the page and the relay
both bind 127.0.0.1.

The implementing session has never seen, typed, stored or logged a key,
and nothing it produced contains one. Keep it that way by following the
"do not" list at the bottom.

Revised after the first keyed run and the fix pass that followed it. The
three things that went wrong that day are fixed and proven keyless:
temur-setkey exists now and works by its bare name, Enter works inside
it, and stopping the relay produces a visible notice instead of a silent
hang. See reports/P3a-fix.md.

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

At the guest shell, by its bare name:

    temur-setkey

It prompts once. Terminal echo is OFF, so the key does not appear on
screen. Press Enter normally when you have pasted it. It writes the key
mode 0600 to /root/.config/temur/key INSIDE the emulated machine, which
lives only in your browser tab's memory, and clears its own variable
afterwards. APP_SECRET_FILE already points there.

It prints the size and the mode when it is done, never the contents. You
can check again the same way:

    ls -l /root/.config/temur/key

If you ever type your own `read` line at the guest shell instead of using
the helper, be aware that the console comes up with CR translation off,
so Enter will NOT end the line: Ctrl-J submits it, and `stty sane` puts
the terminal back. The helper handles this itself, which is why Enter
works inside it. Worse than the visible hang: if you press Enter and then
Ctrl-J, the value picks up a stray carriage return and the key file is
silently wrong. Prefer the helper.

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

The guest kernel now has unprivileged user namespaces, so temur can build
its key sandbox and should NOT ask you to approve each bash command any
more. If it still asks, say so in the report: that is the half of the
kernel fix that could not be proven without a key.

Leave the TUI with `exit`.

## Step 3: the two failure paths

FAILURE PATH A, a bad key. temur should surface a normal authentication
error in the TUI, not hang:

    printf '%s' 'sk-ant-invalid-not-a-real-key' > /root/.config/temur/key
    temur
    (ask it anything; observe the error; then `exit`)

Then put your real key back with `temur-setkey` if you want to continue.

FAILURE PATH B, relay down. Stop the relay process in its terminal
(Ctrl-C). Within a couple of seconds the PAGE should show a red banner
saying the relay connection is lost, with a button offering the offline
tier. That banner is the fix for what you hit last time.

The hang underneath it is NOT fixed and is not the playground's to fix:
temur's chat transports set no timeouts, and v86 completes the guest's
TCP handshake inside the page before any relay stream exists, so the
guest is holding a connection that will never answer and never be reset.
So if you start a turn with the relay down, expect it to sit there; the
banner is what tells you why. That is a temur milestone question, raised
separately.

Worth doing while you are there: restart the relay and watch the banner
clear by itself, then reload with the relay stopped and confirm the page
drops to the offline tier and still works.

## A note on providers

The snapshot bakes an ANTHROPIC config. If you want to use a different
provider, as you did with Gemini last time, you have to write
/root/.config/temur/config.json by hand inside the guest. The relay and
/etc/hosts already map api.anthropic.com, api.openai.com,
generativelanguage.googleapis.com and api.x.ai, so nothing outside the
guest needs to change. Making that a choice rather than a hand edit is a
P3b design question, deliberately not built here.

## Step 4: close the tab

Closing or reloading the tab destroys the emulated machine and everything
in it, including the key. There is nothing to clean up on disk, because
the key only ever existed inside the guest's memory.

## What to report back

Plain descriptions are enough. For each of: the real turn, the bash tool
call (and whether it asked for approval), failure path A, failure path B
and the banner, say whether it behaved and quote the error wording for
the two failures.

## Do NOT, while a key exists

- Do NOT open the page with `?selftest=1`, `?netcheck=1` or
  `?relaycheck=1`. The self-test captures the terminal buffer and posts
  it to the local server. It is hard-coded to REFUSE the networked tier
  for exactly this reason, but do not rely on that; just do not use any
  of them during keyed work.
- Do NOT run `tools/run-guest.mjs`, `tools/run-guest-net.mjs`,
  `tools/restore-net.mjs`, `tools/restore-net-blind.mjs` or any of the
  `tools/cr-*.mjs` and `tools/repro-cr.mjs` harnesses while your key is
  in play. Those print every serial byte to stdout, which is how a key
  would end up in a log file.
- Do NOT take a snapshot after entering the key. The page-facing snapshot
  is keyless and proven so; a snapshot taken after step 1 would contain
  your key in the guest's memory image.
- Do NOT paste a terminal transcript anywhere without checking it first.
  `grep -c 'sk-ant-'` on it should print 0.
- The relay's log is connection-level only (destination and byte counts)
  and never contains payload, so it is safe to share as-is.
