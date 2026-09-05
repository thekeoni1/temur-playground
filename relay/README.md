# The WISP relay (AGPL-3.0-only)

A dumb pipe. The guest inside the browser terminates TLS itself, so
everything crossing this process for a :443 stream is ciphertext this
relay cannot read and does not try to. It records connection-level facts
only: a timestamp, the destination, and byte counts in each direction.
It never logs payload, at any level, on any path.

Destinations are closed by construction. The guest has no DNS; its
/etc/hosts pins each allowed API hostname to an address in
192.0.2.0/24 (RFC 5737 TEST-NET-1, reserved and never globally
routable), and this relay maps those addresses back to the real
hostnames. An address that is not in the map has nothing to map to and
is refused, so the guest cannot express a destination outside the
allowlist.

## Licence, and what it obliges

This directory is licensed AGPL-3.0-only, in full, in `LICENSE`.

It is AGPL because it derives from `@mercuryworkshop/wisp-js`, which is
AGPL-3.0, and it derives from it deeply: `CountingTCPSocket` subclasses
that package's `NodeTCPSocket`. The AGPL's section 13 is the clause that
matters for a thing like this, because this relay is only ever used as a
network service: anyone who can reach a running instance must be offered
its complete corresponding source.

That obligation is met by publishing this subtree in the public
repository and linking to it from the page the relay serves.

STANDING RULE: THE DEPLOYED RELAY ALWAYS MATCHES A PUBLISHED COMMIT.
Publish first, then deploy; never the other way round, and never a local
edit on the server. The commit stamp exists to make that checkable
rather than merely asserted: `GET /version` answers with the commit the
running process was built from, and the page footer shows the same
string. If they disagree, or if either says anything other than a real
commit, the deployment is not compliant and the fix is to publish and
redeploy, not to edit the server.

The rest of the repository (the page, the guest images, the harness) is
MIT; see the root `LICENSE` and `THIRD_PARTY.md`.

## Running it

    npm ci
    RELAY_HOST=127.0.0.1 RELAY_PORT=8089 node relay.mjs

Environment:

  RELAY_HOST         bind address, default 127.0.0.1
  RELAY_PORT         bind port, default 8089
  RELAY_TRUST_PROXY  set to 1 ONLY when a reverse proxy on the same host
                     is the only thing that can reach this port

`RELAY_TRUST_PROXY=1` makes the per-IP rate and concurrency limits read
the client from the last hop of `X-Forwarded-For`, and only when the
connection itself arrives from loopback. Without it, every visitor
behind a TLS-terminating proxy shares one bucket as 127.0.0.1, and the
first few lock everyone else out. With it on a directly exposed socket,
any client could choose its own bucket by sending the header. Both
conditions are checked; the source actually used is printed in the
`relay_start` line and on every connection line.

The deployment runbook (systemd unit, Caddyfile, update procedure) is
`docs/VPS-RUNBOOK.md` in this repository, and is reproduced in
`reports/P3b-prep.md`.

## Its test suite

These probes travel with the relay because they ARE its test suite:

    node relay-probe.mjs         allowlist: mapped host allowed, unmapped
                                 destination, non-443 port and loopback
                                 all refused
    node relay-limit-probe.mjs   per-IP websocket rate limit and per-host
                                 concurrent stream cap both trip
    node relay-proxy-probe.mjs   RELAY_TRUST_PROXY=1 gives two different
                                 X-Forwarded-For clients separate
                                 buckets, and off it collapses them into
                                 one

## The one deep import

`relay.mjs` reaches one unpublished file inside the pinned wisp-js
package, `src/server/net.mjs`, for the `NodeTCPSocket` class. That class
is the documented injection point (`ServerConnection` takes a
`TCPSocket` in its options) but the package's exports map does not
publish it. Nothing is forked or patched.

Because that is a reach into internals, the relay asserts at startup
that the resolved wisp-js version equals the pin in `package.json` and
that the symbol is a class, and refuses to start otherwise, naming the
pin. Both the byte accounting and the per-host stream cap live in that
subclass, so a silent bump would cost the relay exactly the properties
this README claims for it.
