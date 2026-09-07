# Sandbox P3b: serial console setup, sourced by /etc/profile for every
# login shell. Packed into the overlay at /etc/profile.d/console.sh.
#
# ICRNL AT THE SOURCE (P3b item 10). This guest's serial console comes up
# with ICRNL OFF (iflag 0x1400 measured on a fresh boot), so the kernel
# line discipline never turns the CR that Enter sends into the NL that a
# read(2) line waits for. busybox ash's own line editor reads CR itself,
# which is why the shell always looked fine and only programs that read a
# line broke: temur's init wizard and its hidden key prompt among them.
# Worse, with ICRNL off the CR is STORED, so Enter followed by Ctrl-J
# submitted a value with a trailing CR, and a key entered that way is
# silently corrupt.
#
# The P3a fix pass patched around this inside a bespoke key helper. That
# helper is retired now that the guest lands at temur's own wizard, so
# the fix belongs here: once, at the console, before anything runs.
stty icrnl 2>/dev/null

# The three commands, for anyone who lands at or returns to this shell.
if [ -r /etc/temur-motd ]; then
	cat /etc/temur-motd
fi
# P6: START IN THE SHARE. /etc/init.d/S30files mounts the page's 9p
# share at /files during boot, and this is what makes it the directory
# the visitor is actually standing in: the login shell starts there, so
# temur inherits it as its working directory, so a file dropped onto the
# page is simply already in front of the agent with nothing to explain.
#
# Guarded rather than assumed. If the mount ever fails, or this overlay
# is booted on a kernel without the 9p symbols, the login shell should
# still come up in /root instead of printing a cd error at a visitor.
if [ -d /files ]; then
	cd /files
fi
