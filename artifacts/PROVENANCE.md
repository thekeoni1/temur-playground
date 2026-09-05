# Binary under test: provenance

The artifact being the SHIPPED one is the point of this experiment, so
its origin is recorded rather than assumed.

    file    temur-v0.33.0-i686-unknown-linux-musl
    sha256  16454ebdeb2641a124f55b215c68e06a7b81c744a56624a5b4e4ea3de1855d72
    size    6201908 bytes
    type    ELF 32-bit LSB executable, Intel i386, statically linked, stripped

## How it was obtained

Downloaded 2026-09-04 from the PUBLIC release URL with curl, no
credential of any kind, no `gh` and so no token:

    https://github.com/thekeoni1/Temur/releases/download/v0.33.0/temur-v0.33.0-i686-unknown-linux-musl

The published checksum file was fetched from the same release:

    https://github.com/thekeoni1/Temur/releases/download/v0.33.0/SHA256SUMS

## Verification

    $ sha256sum -c SHA256SUMS --ignore-missing
    temur-v0.33.0-i686-unknown-linux-musl: OK

The published line for this asset:

    16454ebdeb2641a124f55b215c68e06a7b81c744a56624a5b4e4ea3de1855d72  temur-v0.33.0-i686-unknown-linux-musl

## Not a local build, checked rather than asserted

The desktop box's own i686 musl release build hashes to
200f435562f11415ec51167b432e2d1f715bd324f949711727d33d9e9b422e49,
which is a different binary. The one under test is the released one.
