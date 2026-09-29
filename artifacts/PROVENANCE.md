# Binary under test: provenance

The artifact being the SHIPPED one is the point of this experiment, so
its origin is recorded rather than assumed.

    file    temur-v0.38.1-i686-unknown-linux-musl
    sha256  2279e5bbf486cc90f720e3d843c95f9ce3d3dd2341adf77ee3661877560e0740
    size    8341524 bytes
    type    ELF 32-bit LSB executable, Intel 80386, statically linked, stripped

v0.38.1 is what the two served snapshots are built on. It replaces
v0.38.0, whose binary is no longer kept in the working tree; the
snapshots that used it are in git history and reports/v038-refresh.md
records what it was (sha256 542e56ab..., 8338132 bytes). v0.36.0 was
released but never served here, by plan, so there is no refresh between
v0.35.0 and v0.37.0 to hunt for.

## How it was obtained

Downloaded 2026-09-29 from the PUBLIC release URL with curl, no
credential of any kind, no `gh` and so no token:

    https://github.com/thekeoni1/Temur/releases/download/v0.38.1/temur-v0.38.1-i686-unknown-linux-musl

The published checksum file was fetched separately from the same
release, and SHA256SUMS beside this file is that file verbatim:

    https://github.com/thekeoni1/Temur/releases/download/v0.38.1/SHA256SUMS

## Verification

    $ sha256sum -c SHA256SUMS --ignore-missing
    temur-v0.38.1-i686-unknown-linux-musl: OK

The published line for this asset:

    2279e5bbf486cc90f720e3d843c95f9ce3d3dd2341adf77ee3661877560e0740  temur-v0.38.1-i686-unknown-linux-musl

That hash was also given independently by the planning session before
the download, so the value checked here was not taken from the same
fetch that produced the file.

A fourth, independent check comes from inside the machine: the
office-read proof asks the restored snapshot's own temur for its
version and asserts it, on both tiers. See reports/v0381-refresh.md.

## Downloaded, not built here

This is the release asset, not a local build. Nothing in this
repository compiles temur: the binary arrives over the release URL
above and goes into the initramfs overlay unmodified, which is what
makes the sandbox a test of the shipped artifact rather than of
something that resembles it.
