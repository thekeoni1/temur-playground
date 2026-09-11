# Binary under test: provenance

The artifact being the SHIPPED one is the point of this experiment, so
its origin is recorded rather than assumed.

    file    temur-v0.34.0-i686-unknown-linux-musl
    sha256  b9b7bfd87c7026d3c01d6a1ba9b8cdb85efa461757b51dc58b32d0dc56cbd625
    size    9512532 bytes
    type    ELF 32-bit LSB executable, Intel i386, statically linked, stripped

v0.34.0 is what the two served snapshots are built on, and it is the
release that reads PDF, Word and spreadsheet files. It replaces
v0.33.0, whose binary is no longer kept in the working tree; the
snapshots that used it are in git history and reports/P6.md records
what it was (sha256 16454ebd..., 6201908 bytes).

## How it was obtained

Downloaded 2026-09-10 from the PUBLIC release URL with curl, no
credential of any kind, no `gh` and so no token:

    https://github.com/thekeoni1/Temur/releases/download/v0.34.0/temur-v0.34.0-i686-unknown-linux-musl

The published checksum file was fetched separately from the same
release, and SHA256SUMS beside this file is that file verbatim:

    https://github.com/thekeoni1/Temur/releases/download/v0.34.0/SHA256SUMS

## Verification

    $ sha256sum -c SHA256SUMS --ignore-missing
    temur-v0.34.0-i686-unknown-linux-musl: OK

The published line for this asset:

    b9b7bfd87c7026d3c01d6a1ba9b8cdb85efa461757b51dc58b32d0dc56cbd625  temur-v0.34.0-i686-unknown-linux-musl

That hash was also given independently by the planning session before
the download, so the value checked here was not taken from the same
fetch that produced the file.

## Downloaded, not built here

This is the release asset, not a local build. Nothing in this
repository compiles temur: the binary arrives over the release URL
above and goes into the initramfs overlay unmodified, which is what
makes the sandbox a test of the shipped artifact rather than of
something that resembles it.
