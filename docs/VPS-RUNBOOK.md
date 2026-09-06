# Relay VPS runbook (section 0 run, sections 1 to 6 NOT run)

The exact steps the operator executes on the relay host. SECTION 0's
prerequisites have now been run by hand on the real box, on 2026-09-05,
and are recorded below as they were typed, with the versions that were
actually observed. SECTIONS 1 TO 6 HAVE NOT BEEN RUN. They still need
credentials or a step no session has taken; sessions prepare and verify,
the operator types anything credentialed.

Target shape, from the brief: the page is on Cloudflare Pages at
play.temur.live, the relay is on the smallest VPS at relay.temur.live,
DNS-ONLY (unproxied), so the trust story stays browser -> relay ->
provider with no third party in the ciphertext path. Caddy terminates
TLS on the VPS and reverse-proxies to the relay on loopback.

The apex temur.live redirects to
https://github.com/thekeoni1/temur-playground. That is a Cloudflare
redirect rule, not repository content, so it is configured in the
dashboard and there is nothing here to deploy for it.

## 0. Before anything

THE BOX: Ubuntu 24.04.4 LTS (noble), kernel 6.17.0-1019-aws, on AWS
Lightsail, the 512 MB bundle. The runbook named no operating system at
all before this; it names one now, because every prerequisite below is
an apt step and the swap note depends on how much memory the bundle has.

- DNS: relay.temur.live must be an A record to the VPS, DNS-only (grey
  cloud in Cloudflare), or Caddy cannot get a certificate and the
  "no third party in the ciphertext path" claim is not true.
- Ports 80 AND 443 open inbound at the PROVIDER'S firewall, before
  section 4. Both, not just 443: Caddy obtains its certificate over
  those ports, so a box reachable on only one of them does not get a
  certificate and section 4 fails with nothing obviously wrong on the
  box itself. Nothing else is opened. The relay never listens on a
  public interface.
- Node 24. The relay has only ever been run on 24.20.0; relay/package.json
  declares `"engines": { "node": ">=24" }`.

### Prerequisites, as executed on the box on 2026-09-05

These ran, and their output was observed. They are recorded as typed
rather than tidied up, so that what is written here is what happened.

NODE, from NodeSource:

    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    node -v; command -v node

Observed: `v24.20.0` and `/usr/bin/node`.

THE PATH IS A PRECONDITION, NOT A COURTESY CHECK. The systemd unit in
section 3 hardcodes `ExecStart=/usr/bin/node`, so `command -v node`
printing exactly /usr/bin/node is what makes that unit correct. If it
prints anything else, section 3 is what has to change, and the failure
if it does not is a service that will not start.

CADDY, from the Cloudsmith stable repository:

    sudo apt-get install -y debian-keyring debian-archive-keyring \
      apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
      | sudo gpg --dearmor \
      -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
      | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update && sudo apt-get install -y caddy
    caddy version

Observed: `v2.11.4`. The debian-named keyring packages and list file are
upstream Caddy's own instructions and are correct on Ubuntu; they are
not a sign that the wrong repository was used.

SIDE EFFECT, AND IT IS EXPECTED: installing the package enables and
starts caddy.service with a default configuration, which takes ports 80
and 443 immediately. Section 4 replaces that configuration, so nothing
needs undoing first, but a port 80 that looks occupied before section 4
is this and not a problem.

SWAP, on a host with less than 1 GB of RAM. The 512 MB bundle has 414 MB
usable, and `npm ci` in section 2 is a coin flip without swap. As
executed:

    sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile \
      && sudo mkswap /swapfile && sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    free -m

A host with 1 GB or more does not need this step.

## 1. The code, at the published commit

    sudo adduser --system --group --home /srv/relay relay
    sudo -u relay git clone https://github.com/thekeoni1/temur-playground \
        /srv/relay/app
    cd /srv/relay/app
    sudo -u relay git checkout <PUBLISHED_COMMIT>

`<PUBLISHED_COMMIT>` is the commit being deployed. THE COMMIT MUST
ALREADY BE PUBLISHED. That is the standing rule and the reason for the
stamp; deploying something not yet pushed makes the AGPL source offer
false.

## 2. Install and stamp

    cd /srv/relay/app/relay
    sudo -u relay npm ci
    cd /srv/relay/app
    sudo -u relay node tools/stamp.mjs

`npm ci` in relay/, not at the root: the relay has its own
package.json and lockfile so the deployed tree carries only what the
relay needs.

`tools/stamp.mjs` writes relay/build-info.json from the checked-out
commit. IT WILL REFUSE IF THE TREE IS DIRTY, and the relay will refuse to
start without it. That is the design: a relay that cannot say which
commit it is has no business being reachable. If stamp refuses, do not
pass --allow-dirty; find out why the tree is dirty, because on a
deployment host it should never be.

## 3. The service

/etc/systemd/system/temur-relay.service:

    [Unit]
    Description=temur sandbox WISP relay
    After=network-online.target
    Wants=network-online.target

    [Service]
    Type=simple
    User=relay
    Group=relay
    WorkingDirectory=/srv/relay/app/relay
    Environment=RELAY_HOST=127.0.0.1
    Environment=RELAY_PORT=8089
    Environment=RELAY_TRUST_PROXY=1
    ExecStart=/usr/bin/node /srv/relay/app/relay/relay.mjs
    Restart=always
    RestartSec=2
    LimitNOFILE=8192
    NoNewPrivileges=true
    PrivateTmp=true
    ProtectSystem=strict
    ProtectHome=true
    ReadWritePaths=
    StandardOutput=journal
    StandardError=journal

    [Install]
    WantedBy=multi-user.target

Then:

    sudo systemctl daemon-reload
    sudo systemctl enable --now temur-relay
    sudo systemctl status temur-relay
    curl -s localhost:8089/version

LimitNOFILE=8192 IS LOAD-BEARING, not tidiness, and a future reader
should not delete it as noise. The relay's ceiling is bound by
descriptors rather than by memory: every visitor costs one client socket
plus up to streamsPerConnection upstream sockets, so the concurrent cap
multiplies by 17, and systemd's default soft limit is 1024. At that
default the relay would run out of descriptors long before it ran out of
memory, under load, which is the least legible failure it could have.
The relay reads this limit at startup and REFUSES TO START if it is
below what its configured ceiling needs, so a box that never got this
line, or lost it to a later edit, fails loudly at start with the fix in
the message rather than quietly at the worst possible moment.

RELAY_TRUST_PROXY=1 is required here and ONLY here. Without it every
visitor arrives as 127.0.0.1 from Caddy and they all share one rate-limit
bucket, so the first few lock everyone else out. It is safe only because
the relay is not reachable except through the proxy: if that ever stops
being true, this flag must come off first. See relay/README.md.

## 4. Caddy in front

/etc/caddy/Caddyfile:

    relay.temur.live {
        reverse_proxy 127.0.0.1:8089
    }

    sudo systemctl reload caddy

Caddy gets a Let's Encrypt certificate on first request and passes
WebSocket upgrades through by default; it sets X-Forwarded-For, which is
what step 3's flag reads. No other configuration is needed.

## 5. Check it, from outside

    curl -s https://relay.temur.live/version
    curl -s -o /dev/null -w '%{http_code}\n' https://relay.temur.live/

The first must print the SAME commit as the published HEAD being
deployed. The second must print 426: there is no HTTP surface beyond
/version. Then open the page and confirm the footer's commit matches.

## 6. Logs

    journalctl -u temur-relay -f

Connection-level only, by construction: timestamps, destinations, byte
counts, and the client IP with the source it came from. Payload is never
logged, at any level, on any path. These lines are safe to share as-is,
which is what makes soak review possible at all.

## Updating: publish FIRST, then pull

    # on the laptop
    git push                      # the commit must be public first

    # on the VPS
    cd /srv/relay/app
    sudo -u relay git pull
    cd relay && sudo -u relay npm ci && cd ..
    sudo -u relay node tools/stamp.mjs
    sudo systemctl restart temur-relay
    curl -s https://relay.temur.live/version

The last line is the check, not a formality: if /version does not equal
the published HEAD, the deployment does not match its published source
and the fix is to publish and redeploy, never to edit the server. Never
edit files on the VPS. A local edit there is exactly the state the stamp
exists to make visible, and the next `git pull` would silently discard it
anyway.
