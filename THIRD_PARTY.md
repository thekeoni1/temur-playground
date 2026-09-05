# Third-party notices

This repository is MIT (see LICENSE), except the `relay/` subtree, which
is AGPL-3.0-only (see relay/LICENSE and relay/README.md).

It redistributes or vendors the following third-party works. Versions
are the ones pinned in package-lock.json and relay/package.json; the
full licence texts are reproduced below.

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

Two further things the guest image contains are not npm packages and
carry their own terms:

  SeaBIOS / VGABIOS (bios/seabios.bin, bios/vgabios.bin) are the blobs
  shipped with v86 and are covered by that project's distribution; see
  the v86 repository.

  The Linux kernel and BusyBox userspace in the guest image are built
  from Buildroot 2026.02.3 (Linux 6.19.14, GPL-2.0; BusyBox, GPL-2.0).
  The exact configurations that produced them are committed as
  kit/buildroot.config, kit/kernel-p*.config and
  kit/linux-i686-v86-p*.config, and the build tree is reproducible from
  them; see reports/P1.md and reports/P2.md.

  The temur binary in artifacts/ is the published v0.33.0 i686 release,
  MIT, unmodified; see artifacts/PROVENANCE.md.

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
