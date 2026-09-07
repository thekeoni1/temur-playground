#!/bin/sh
# Build the v86 guest kernel from the P1 Buildroot tree, reproducibly.
#
# WHY THIS SCRIPT EXISTS. Two things about this build are easy to get
# wrong by hand, and both were learned the expensive way:
#
#  1. THE PATH MUST BE PINNED. This shell inherits the Windows PATH
#     through WSL interop, and Buildroot dies on the /mnt/c entries.
#     Every kernel build in this programme has had to say so; now it is
#     said once, here.
#
#  2. THE KERNEL IS NOT BYTE-REPRODUCIBLE UNLESS KBUILD_BUILD_* IS
#     PINNED. The 9p spike rebuilt bzImage-p4 from a byte-identical
#     .config and got a bzImage of exactly the same size with a
#     different sha256. That is scripts/mkcompile_h stamping the build
#     timestamp and an incrementing build counter into compile.h. It
#     means nobody can verify a committed kit/bzImage-* by rebuilding
#     it, for a reason that has nothing to do with the contents.
#
#     Buildroot pins these itself, but ONLY under BR2_REPRODUCIBLE,
#     which this tree does not set (turning it on would change the
#     rootfs too, and kit/rootfs.cpio.gz is an accepted artifact).
#     Buildroot's LINUX_MAKE_ENV overrides only PATH and GIT_DIR, so
#     the environment set here reaches the kernel's make untouched.
#     The values below are deliberately the same ones BR2_REPRODUCIBLE
#     would use, so that a future reproducible-mode build agrees.
#
# Usage: sh tools/build-kernel.sh [<out-bzImage> <out-kernel-config>]
#
# With no arguments it builds and reports the sha256 without copying
# anything, which is the second half of the two-builds-one-sha proof.
set -e

TREE=/home/dev/v86-guest-2026-09-04
BR="$TREE/buildroot-2026.02.3"

# Pinned, per note 1 above.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH

# Pinned, per note 2 above. A FIXED date, not "now": the point is that
# two builds a week apart agree.
KBUILD_BUILD_TIMESTAMP="Mon Sep  7 00:00:00 UTC 2026"
KBUILD_BUILD_VERSION=1
KBUILD_BUILD_USER=buildroot
KBUILD_BUILD_HOST=buildroot
export KBUILD_BUILD_TIMESTAMP KBUILD_BUILD_VERSION KBUILD_BUILD_USER KBUILD_BUILD_HOST

make -C "$BR" linux-reconfigure

IMG="$BR/output/images/bzImage"
CFG="$BR/output/build/linux-6.19.14/.config"

echo "built: $(sha256sum "$IMG")"
echo "size:  $(stat -c %s "$IMG") B"

if [ $# -eq 2 ]; then
  cp "$IMG" "$1"
  cp "$CFG" "$2"
  echo "copied to $1 and $2"
fi
