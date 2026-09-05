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
    for kind, name, src, mode in entries:
        if kind == "d":
            h = header(name, 0o040000 | mode, 0, ino, nlink=2)
            blob += h + pad4(len(h))
        else:
            data = open(src, "rb").read()
            h = header(name, 0o100000 | mode, len(data), ino)
            blob += h + pad4(len(h)) + data + pad4(len(data))
        ino += 1
    t = header("TRAILER!!!", 0, 0, 0)
    blob += t + pad4(len(t))
    blob += b"\0" * ((512 - len(blob) % 512) % 512)
    open(out_path, "wb").write(blob)
    print("wrote %s (%d bytes)" % (out_path, len(blob)))

def add_file(entries, seen, guest_path, host_path, mode):
    """Append the file, creating every ancestor directory first.

    The directories are emitted even when the stock rootfs already has
    them. The kernel's initramfs unpacker ignores EEXIST on mkdir and then
    chowns/chmods to root:root 0755, which is what those directories
    already are, so this is free; and it is the P3a lesson made
    structural. The key helper was written into /usr/local/bin, a path
    this rootfs does not have, so nothing was created and no step noticed.
    An overlay that carries its own directories cannot fail that way.
    """
    parts = guest_path.split("/")
    for i in range(1, len(parts)):
        d = "/".join(parts[:i])
        if d not in seen:
            seen.add(d)
            entries.append(("d", d, None, 0o755))
    entries.append(("f", guest_path, host_path, mode))

if __name__ == "__main__":
    # mkcpio.py <out.cpio> <temur-binary> [<guest/path>=<host/path>[:<mode>] ...]
    #
    # Extra files name their own guest path, with an optional octal mode
    # (default 0755). Ancestor directories are emitted automatically.
    out = sys.argv[1]
    binary = sys.argv[2]
    entries = []
    seen = set()
    add_file(entries, seen, "usr/bin/temur", binary, 0o755)
    for arg in sys.argv[3:]:
        guest_path, host_path = arg.split("=", 1)
        mode = 0o755
        if ":" in host_path:
            host_path, mode_s = host_path.rsplit(":", 1)
            mode = int(mode_s, 8)
        add_file(entries, seen, guest_path, host_path, mode)
    main(out, entries)
