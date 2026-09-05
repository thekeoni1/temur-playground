# The keyed steps (OPERATOR ONLY)

These are the steps the implementing session must not do, because they
involve a real API key. Everything below happens on the laptop, in a real
browser, with your own key. Nothing here is public: the page and the relay
both bind 127.0.0.1.

The implementing session has never seen, typed, stored or logged a key,
and nothing it produced contains one. Keep it that way by following the
"do not" list at the bottom.

REVISED FOR P3b. The guest no longer lands at a shell with a baked
Anthropic config and a bespoke key helper. It lands at `temur init`,
temur's own setup wizard, so you choose the provider and type the key at
temur's own hidden prompt. The helper is retired, and so is the Ctrl-J
workaround: the console now turns CR translation on for every login
shell, so Enter works everywhere, including inside the wizard. See
reports/P3b-prep.md; the earlier history is in reports/P3a.md and
reports/P3a-fix.md.

## Before you start

Two processes, in two terminals, from /home/dev/temur-playground:

    export PATH="$HOME/.local/opt/node-v24.20.0-linux-x64/bin:$PATH"
    node tools/stamp.mjs             # once, on a clean tree
    node relay/relay.mjs             # the WISP relay, 127.0.0.1:8089
    PAGE_DEV_RELAY=ws://127.0.0.1:8089 \
      node tools/serve-page.mjs 8088 # the page, 127.0.0.1:8088

`tools/stamp.mjs` writes the commit stamp the relay refuses to start
without. `PAGE_DEV_RELAY` widens the shipped Content-Security-Policy by
exactly the local relay origin: the policy itself lives in page/_headers
and ships as written, and without that variable the browser would refuse
the connection to 127.0.0.1.

Then open a real browser on the laptop at:

    http://localhost:8088/

The notice at the top must say "Networked tier". If it says "OFFLINE
TIER", the relay is not running; start it and reload.

You will land inside the `temur init` wizard, with the three commands
printed above it. The page does not and cannot type your key: the wizard
is running inside the emulated machine, and the page has no key field.

PASTE IS Ctrl-Shift-V. Plain Ctrl-V is not a paste in a terminal; it
sends the literal control byte 0x16 into the guest, and with echo off at
the hidden prompt you will not see that anything went wrong.

## Step 1: the wizard, and your key

Answer the questions. Enter alone accepts the default shown in brackets.

1. `Template` takes a number or a name: `2` or `anthropic`, `4` or
   `gemini`, and so on.
2. `Model id` (or, for the anthropic template, the startup profile) can
   be left at the default.
3. `API key file path` should be left at the default, which is
   /root/.secrets/temur-<provider>-key inside the guest.
4. `Paste your API key (input hidden; Enter to skip and add it later)` is
   where the key goes. Echo is OFF, so nothing appears on screen: that is
   correct, not a hang. Paste with Ctrl-Shift-V and press Enter.

temur prints `key saved (hidden) to ...` and never the key. Check it the
same way you would on a laptop:

    ls -l /root/.secrets/temur-gemini-key

Ctrl-C at any ordinary question leaves the wizard and lands you at the
shell, with the terminal in the state it was. At the HIDDEN key prompt
Ctrl-C deliberately does nothing at all: temur ignores it there so a
stray Ctrl-C cannot kill the process while echo is off and strand you at
a terminal that has stopped echoing. Press Enter on the empty line to
skip instead.

If you want to redo the setup, `temur init --force` overwrites the
config. It will NOT overwrite a key file that already has a key in it; it
says "already exists; left untouched". To replace the key, delete the key
file first and run init again.

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

The guest kernel has unprivileged user namespaces, so temur builds its
key sandbox and does not ask you to approve each bash command. Keyed run
two confirmed this; if it ever starts asking again, that is a
regression worth reporting.

Leave the TUI with `exit`.

## Step 3: the two failure paths

FAILURE PATH A, a bad key. temur should surface a normal authentication
error in the TUI, not hang:

    printf '%s' 'sk-ant-invalid-not-a-real-key' > /root/.secrets/temur-anthropic-key
    temur
    (ask it anything; observe the error; then `exit`)

Then put your real key back: delete that file and run `temur init
--force` again, or paste the key into the file with `vi`.

FAILURE PATH B, relay down. Stop the relay process in its terminal
(Ctrl-C). Within a couple of seconds the PAGE should show a red banner
saying the relay connection is lost, with a button offering the offline
tier.

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

The relay and the guest's /etc/hosts map api.anthropic.com,
api.openai.com, generativelanguage.googleapis.com and api.x.ai, which are
templates 2, 3, 4 and 5 in the wizard. Any of them works without touching
anything outside the guest. Template 1 (local) points at a llama.cpp-style
server on 127.0.0.1 inside the guest, where nothing is listening, so it
is not useful here.

## Step 4: close the tab

Closing or reloading the tab destroys the emulated machine and everything
in it, including the key. There is nothing to clean up on disk, because
the key only ever existed inside the guest's memory.

## What to report back

Plain descriptions are enough. For each of: the wizard (did Enter work at
every question, first press), the real turn, the bash tool call (and
whether it asked for approval), failure path A, failure path B and the
banner, say whether it behaved and quote the error wording for the two
failures.

## Do NOT, while a key exists

- Do NOT open the page with `?selftest=1`, `?netcheck=1`,
  `?relaycheck=1` or `?landingcheck=1`. The self-test captures the terminal buffer and posts
  it to the local server. It is hard-coded to REFUSE the networked tier
  for exactly this reason, but do not rely on that; just do not use any
  of them during keyed work.
- Do NOT run `tools/run-guest.mjs`, `tools/run-guest-net.mjs`,
  `tools/restore-net.mjs`, `tools/restore-net-blind.mjs`,
  `tools/proof-init-cr.mjs` or any of the `tools/cr-*.mjs` and
  `tools/repro-cr.mjs` harnesses while your key is in play. Those print
  every serial byte to stdout, which is how a key would end up in a log
  file.
- Do NOT take a snapshot after entering the key. The page-facing snapshot
  is keyless and proven so; a snapshot taken after step 1 would contain
  your key in the guest's memory image.
- Do NOT paste a terminal transcript anywhere without checking it first.
  `grep -c 'sk-ant-'` on it should print 0.
- The relay's log is connection-level only (destination and byte counts)
  and never contains payload, so it is safe to share as-is.
