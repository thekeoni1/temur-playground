#!/usr/bin/env python3
"""Write a newc (SVR4) cpio archive with explicit root ownership.

This box has no cpio and no sudo to install one, and the guest needs the
files owned by root:root, so the archive is written directly. The kernel
concatenates initramfs segments, so this is appended to the stock
rootfs.cpio.gz rather than repacking it: nothing in the laptop's verified
image is rewritten.
"""
import sys, os

def header(name, mode, size, ino, nlink=1, mtime=0):
    fields = [ino, mode, 0, 0, nlink, mtime, size, 0, 0, 0, 0, len(name) + 1, 0]
    return b"070701" + b"".join(b"%08X" % f for f in fields) + name.encode() + b"\0"

def pad4(n):
    return b"\0" * ((4 - n % 4) % 4)

def main(out_path, entries):
    blob = b""
    ino = 1000
    for kind, name, src in entries:
        if kind == "d":
            h = header(name, 0o040755, 0, ino, nlink=2)
            blob += h + pad4(len(h))
        else:
            data = open(src, "rb").read()
            h = header(name, 0o100755, len(data), ino)
            blob += h + pad4(len(h)) + data + pad4(len(data))
        ino += 1
    t = header("TRAILER!!!", 0, 0, 0)
    blob += t + pad4(len(t))
    blob += b"\0" * ((512 - len(blob) % 512) % 512)
    open(out_path, "wb").write(blob)
    print("wrote %s (%d bytes)" % (out_path, len(blob)))

if __name__ == "__main__":
    out = sys.argv[1]
    binary = sys.argv[2]
    main(out, [("d", "usr", None), ("d", "usr/bin", None), ("f", "usr/bin/temur", binary)])
