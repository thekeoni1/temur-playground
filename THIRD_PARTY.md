# Third-party notices

This repository is MIT (see LICENSE), except the `relay/` subtree, which
is AGPL-3.0-only (see relay/LICENSE and relay/README.md).

It redistributes or vendors the following third-party works. For the npm
packages, versions are the ones pinned in package-lock.json and
relay/package.json, and the full licence texts are reproduced below. The
guest artifacts have their own section further down, with their versions
read from the shipped binaries and their licence texts in licenses/.

  v86                        0.5.458+gd96be77   BSD-2-Clause
    The x86 emulator the page runs. Its build output (libv86.js,
    v86.wasm) is copied into page/vendor/ at staging time.
    https://github.com/copy/v86

  @xterm/xterm               6.0.0              MIT
    The terminal the page renders. xterm.js and xterm.css are copied
    into page/vendor/ at staging time.
    https://github.com/xtermjs/xterm.js

  @mercuryworkshop/wisp-js   0.4.1              AGPL-3.0
    The WISP protocol implementation the relay is built on. The relay
    subclasses its NodeTCPSocket, which is why relay/ is AGPL-3.0-only.
    Its full licence text is relay/LICENSE.
    https://github.com/MercuryWorkshop/wisp-js

  ws                         8.21.3             MIT
    WebSocket implementation, used by wisp-js at runtime and directly by
    the relay's probes.
    https://github.com/websockets/ws

## The guest artifacts, which are binaries we redistribute

The rest of the guest is not npm packages. It is compiled software under
copyleft licences, and WE PUBLISH THE BINARIES, so those licences attach
to what this repository serves rather than to something upstream. They
are named here by artifact, because a notice that says "the guest image"
does not tell a reader which file carries which obligation.

  Linux kernel             6.19.14                  GPL-2.0
    kit/bzImage, kit/bzImage-p2, kit/bzImage-p3, kit/bzImage-p4,
    kit/bzImage-p6
    https://www.kernel.org

  BusyBox                  1.37.0                   GPL-2.0
    The userspace in kit/rootfs.cpio.gz. The binary says so itself:
    "BusyBox v1.37.0 (2026-09-04 20:33:13 EDT)".
    https://busybox.net

  SeaBIOS / SeaVGABIOS     rel-1.16.2-0-gea1b7a0    LGPL-3.0
    bios/seabios.bin and bios/vgabios.bin, which tools/stage-page.sh
    copies into page/vendor/, so these are the ones the PAGE ships.
    kit/seabios.bin and kit/vgabios.bin are the harness's copies and are
    byte for byte the same files:
      seabios.bin  sha256 73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98
      vgabios.bin  sha256 a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880
    The version string is read out of seabios.bin itself. The VGA BIOS
    is vgasrc/ in the same source tree.
    https://www.seabios.org

  THE TWO SERVED SNAPSHOTS CARRY ALL OF THE ABOVE:

    page/assets/state-p7-net.bin.gz
    page/assets/state-p7-offline.bin.gz

  They are memory images of the running machine, so they CONTAIN the
  kernel and the BusyBox userspace in executable form. Serving them from
  the page is distribution of those binaries exactly as much as shipping
  bzImage is, and the GPL-2.0 obligations below are what that means in
  practice. They are the reason this section exists.

  Licence texts: licenses/GPL-2.0.txt for the kernel and BusyBox,
  licenses/LGPL-3.0.txt for SeaBIOS. LGPLv3 is written as a set of
  additional permissions on top of GPLv3 and does not stand alone, so
  licenses/GPL-3.0.txt is included with it. That is also why SeaBIOS's
  own COPYING at rel-1.16.2 contains the GPLv3 text while COPYING.LESSER
  contains the LGPLv3: a reader who checks only COPYING will think it is
  GPLv3, and it is not. Its sources say what they are, for example
  vgasrc/vgabios.c: "This file may be distributed under the terms of the
  GNU LGPLv3 license."

### Written offer of source, for the binaries above

A configuration file identifies a build. It is not the corresponding
source, so the source is named here and offered outright.

  Linux 6.19.14
    https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.19.14.tar.xz
  BusyBox 1.37.0
    https://busybox.net/downloads/busybox-1.37.0.tar.bz2
  Buildroot 2026.02.3, which built both
    https://buildroot.org/downloads/buildroot-2026.02.3.tar.gz
  SeaBIOS rel-1.16.2
    https://github.com/coreboot/seabios/archive/refs/tags/rel-1.16.2.tar.gz

WE DID NOT PATCH ANY OF THAT SOURCE. The kernel, BusyBox and SeaBIOS are
stock upstream at those versions. What is ours is configuration, and it
is committed here rather than described:

  kit/buildroot.config                 the Buildroot configuration,
                                       which also pins Linux 6.19.14
  kit/kernel.config                    the generated kernel .config for
  kit/kernel-p2.config                 each guest, as built
  kit/kernel-p3.config
  kit/kernel-p4.config
  kit/kernel-p6.config
  kit/linux-i686-v86-p2.config         the sparse fragments those were
  kit/linux-i686-v86-p3.config         generated from, by olddefconfig
  kit/linux-i686-v86-p4.config
  kit/linux-i686-v86-p6.config

Upstream tarball plus the committed configuration is what reproduces the
binaries we publish; reports/P1.md and reports/P2.md describe the build.

THE OFFER. For any binary named in this section, we will provide the
complete corresponding source, on request, for at least three years from
the date it was distributed. In the ordinary case you do not need to ask
us: the upstream URLs above are the source, the configuration is in this
public repository, and between them you have everything. If an upstream
URL has gone away, or you would rather have the exact tree we built
from, open an issue at
https://github.com/thekeoni1/temur-playground/issues and ask; a copy on
a physical medium is available on the same terms if you want one.

### The temur binary in artifacts/

artifacts/temur-v0.33.0-i686-unknown-linux-musl is the published v0.33.0
i686 release, MIT, unmodified; see artifacts/PROVENANCE.md.

IT IS STATICALLY LINKED AGAINST MUSL, so unlike a dynamically linked
binary it carries its compiled Rust dependencies inside it, under their
own terms. Redistributing it therefore carries their notice obligations
in the same way that redistributing seabios.bin carries SeaBIOS's, and
naming only temur's own MIT would describe a fraction of what is in the
file.

  Source, at the exact release this binary was built from:
    https://github.com/thekeoni1/Temur/tree/v0.33.0

  Dependency inventory, the lockfile at that tag:
    https://github.com/thekeoni1/Temur/blob/v0.33.0/Cargo.lock

WHO CHECKED WHAT, because these are two different claims and only one of
them was checked here.

  VERIFIED IN THIS REPOSITORY'S PASS: Cargo.lock at tag v0.33.0 holds
  143 [[package]] entries. One of them is temur itself, so 142 are
  dependencies. That lockfile is byte-identical to the one at the commit
  this work was done against.

  DESKTOP PLANNING, 2026-09-06: 107 crates are LINKED into the release
  binary, and all of them are under permissive licences, with no
  copyleft among them. The two counts are not in conflict: a lockfile
  records everything resolved, including dev-only and build-only
  dependencies that never reach the binary, while the linked count
  excludes them.

  NOT CHECKED HERE, and deliberately not restated as ours: THE LICENCE
  POSITION ITSELF. A Cargo.lock records names and versions and no
  licence at all, so nothing in this repository can confirm or refute
  the permissive finding. A reader who wants to check it has the tag and
  the lockfile above and can resolve the licences from them.

A generated notices file, listing each linked crate with its licence
text, is the complete answer and is planned separately. This entry is a
pointer, and says so rather than implying an audit that has not been
published.

--------------------------------------------------------------------
v86 - BSD-2-Clause
--------------------------------------------------------------------
Copyright (c) 2012, The v86 contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

--------------------------------------------------------------------
@xterm/xterm - MIT
--------------------------------------------------------------------
Copyright (c) 2017-2019, The xterm.js authors (https://github.com/xtermjs/xterm.js)
Copyright (c) 2014-2016, SourceLair Private Company (https://www.sourcelair.com)
Copyright (c) 2012-2013, Christopher Jeffrey (https://github.com/chjj/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

--------------------------------------------------------------------
ws - MIT
--------------------------------------------------------------------
Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>
Copyright (c) 2013 Arnout Kazemier and contributors
Copyright (c) 2016 Luigi Pinca and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

--------------------------------------------------------------------
@mercuryworkshop/wisp-js - AGPL-3.0
--------------------------------------------------------------------
The full text is reproduced at relay/LICENSE in this repository.
