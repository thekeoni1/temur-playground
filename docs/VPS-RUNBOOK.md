# Relay VPS runbook (written, NOT run)

The exact steps the operator executes on the relay host. Nothing here has
been run: P3b-prep is local commits only, and every step below needs
credentials or a machine no session has. Sessions prepare and verify;
the operator types anything credentialed.

Target shape, from the brief: the page is on Cloudflare Pages at
play.temur.live, the relay is on the smallest VPS at relay.temur.live,
DNS-ONLY (unproxied), so the trust story stays browser -> relay ->
provider with no third party in the ciphertext path. Caddy terminates
TLS on the VPS and reverse-proxies to the relay on loopback.

## 0. Before anything

- DNS: relay.temur.live must be an A record to the VPS, DNS-only (grey
  cloud in Cloudflare), or Caddy cannot get a certificate and the
  "no third party in the ciphertext path" claim is not true.
- Ports 80 and 443 open. Nothing else. The relay itself never listens on
  a public interface.
- Node 24. The relay has only ever been run on 24.20.0; relay/package.json
  declares `"engines": { "node": ">=24" }`.

## 1. The code, at the published commit

    sudo adduser --system --group --home /srv/relay relay
    sudo -u relay git clone <REPO_URL> /srv/relay/app
    cd /srv/relay/app
    sudo -u relay git checkout <PUBLISHED_COMMIT>

`<REPO_URL>` and `<PUBLISHED_COMMIT>` are the public repository and the
commit being deployed. THE COMMIT MUST ALREADY BE PUBLISHED. That is the
standing rule and the reason for the stamp; deploying something not yet
pushed makes the AGPL source offer false.

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
