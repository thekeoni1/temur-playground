# Binary under test: provenance

The artifact being the SHIPPED one is the point of this experiment, so
its origin is recorded rather than assumed.

    file    temur-v0.39.0-i686-unknown-linux-musl
    sha256  b54b4f3bf2cb86961eba14b536a9902e46940988504a885075f0e26fbdf1af03
    size    8368620 bytes
    type    ELF 32-bit LSB executable, Intel 80386, statically linked, stripped

v0.39.0 is what the two served snapshots are built on. It replaces
v0.38.6, whose binary is no longer kept in the working tree; the
snapshots that used it are in git history and reports/v0386-refresh.md
records what it was (sha256 6edbeeb3..., 8365108 bytes). v0.38.2 was
released but never served here, by plan, so there is no refresh between
v0.38.1 and v0.38.3 to hunt for. v0.36.0 was likewise released but
never served here, so there is none between v0.35.0 and v0.37.0.

## How it was obtained

Downloaded 2026-10-28 from the PUBLIC release URL with curl, no
credential of any kind, no `gh` and so no token:

    https://github.com/thekeoni1/Temur/releases/download/v0.39.0/temur-v0.39.0-i686-unknown-linux-musl

The published checksum file was fetched separately from the same
release, and SHA256SUMS beside this file is that file verbatim:

    https://github.com/thekeoni1/Temur/releases/download/v0.39.0/SHA256SUMS

## Verification

    $ sha256sum -c SHA256SUMS --ignore-missing
    temur-v0.39.0-i686-unknown-linux-musl: OK

The published line for this asset:

    b54b4f3bf2cb86961eba14b536a9902e46940988504a885075f0e26fbdf1af03  temur-v0.39.0-i686-unknown-linux-musl

That hash was also given independently by the planning session before
the download, so the value checked here was not taken from the same
fetch that produced the file.

A fourth, independent check comes from inside the machine: the
office-read proof asks the restored snapshot's own temur for its
version and asserts it, on both tiers. See reports/v0390-refresh.md.

## Downloaded, not built here

This is the release asset, not a local build. Nothing in this
repository compiles temur: the binary arrives over the release URL
above and goes into the initramfs overlay unmodified, which is what
makes the sandbox a test of the shipped artifact rather than of
something that resembles it.
