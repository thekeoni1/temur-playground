// THE EMPTY-AT-SNAPSHOT ASSERT. Key-class, and it refuses rather than warns.
//
// WHY THIS IS KEY-CLASS. v86 SERIALISES THE 9p FILESYSTEM INTO THE SAVED
// STATE. That is the whole reason the mount survives a restore with no
// nudge, and it is also a hazard with the exact shape of the one this
// programme already respects for API keys: anything sitting in the share
// when a snapshot is taken is inside that snapshot, and the snapshot is
// downloaded by EVERY VISITOR to the page. A stray file here is not a
// build blemish, it is publication.
//
// So the rule is the same as the key rule: not "remember to clear it"
// but "the build cannot produce a snapshot that carries it". A harness
// that saves state calls this first, and a non-empty filesystem ends the
// run with no state file written.
//
// "EMPTY" IS NOT ENOUGH. IT MUST BE PRISTINE, AND THAT IS A MEASURED
// FINDING, NOT A PRECAUTION. A file written into the share and then
// deleted leaves the directory listing empty and its BYTES STILL IN THE
// SAVED STATE: written from the guest, removed with rm, synced, and the
// marker string was still recoverable from the state blob afterwards.
// v86 keeps the inode slot, and save_state serialises what it keeps.
//
// So a share that was used and tidied is NOT clean, and any check that
// only asks "is the listing empty" would wave it through. The signal
// that separates the two is the inode count: an untouched filesystem
// holds exactly one inode, the root. Anything above that means bytes
// this build did not intend to publish are inside the snapshot.
//
// The practical consequence for the harness: A SNAPSHOT BUILD MUST NEVER
// WRITE INTO THE SHARE, not even to test it and clean up afterwards.
// Share read/write is exercised on the raw-boot proof run, which saves
// no state.

export function assertEmpty9p(emulator, label) {
  const fs9p = emulator.fs9p;
  if (!fs9p) {
    // Not a mistake to tolerate quietly: a snapshot harness that thinks
    // it has a 9p device and does not would ship a guest whose /files
    // mount fails, and the assert would have "passed" by being absent.
    throw new Error(
      "9p ASSERT: no filesystem on this emulator. A snapshot for the 9p " +
        "milestone must be built with filesystem:{} present.",
    );
  }

  // GetRecursiveList RETURNS NOTHING: it appends into an array passed by
  // reference, and the root is inode 0, not the string "/". Getting that
  // wrong throws, which is how it was caught here; the dangerous version
  // of the same mistake is silent, so read_dir is checked alongside it
  // and a shape that is not an array is refused rather than believed.
  const walked = [];
  fs9p.GetRecursiveList(0, walked);
  const top = fs9p.read_dir("/");
  const inodes = fs9p.inodes ? fs9p.inodes.length : -1;
  // Reported, never gated on: measured at 0 with a file plainly present,
  // so it is not a signal this assert can trust in either direction.
  const used = fs9p.used_size;

  if (!Array.isArray(top) || inodes < 1) {
    throw new Error(
      "9p ASSERT INCONCLUSIVE (" + label + "): the filesystem API did not " +
        "answer in the expected shape, so emptiness cannot be established. " +
        "Refusing on the unsafe side. top=" + JSON.stringify(top) +
        " inodes=" + inodes,
    );
  }

  if (walked.length === 0 !== (top.length === 0)) {
    throw new Error(
      "9p ASSERT INCONCLUSIVE (" + label + "): the recursive walk and the " +
        "top-level listing disagree, so this harness can no longer tell " +
        "whether the share is clean. Refusing on the unsafe side. walked=" +
        walked.length + " top=" + JSON.stringify(top),
    );
  }

  if (walked.length !== 0 || top.length !== 0) {
    const names = walked.map((e) => (e && e.name) || String(e)).slice(0, 20);
    throw new Error(
      "9p ASSERT FAILED at the snapshot point (" + label + "): the share " +
        "is NOT empty, so this state would ship its contents to every " +
        "visitor. entries=" + walked.length + " top=" + JSON.stringify(top) +
        " inodes=" + inodes +
        (names.length ? " names=" + JSON.stringify(names) : "") +
        ". No state file was written.",
    );
  }

  if (inodes !== 1) {
    throw new Error(
      "9p ASSERT FAILED at the snapshot point (" + label + "): the share " +
        "LISTS as empty but is not pristine. It holds " + inodes +
        " inode slots where an untouched filesystem holds 1, which means " +
        "something was written into it and deleted, and deleted bytes " +
        "REMAIN IN THE SAVED STATE (measured, see the note at the top of " +
        "this file). Tidying is not cleaning: build the snapshot on a run " +
        "that never writes to the share. No state file was written.",
    );
  }

  return { entries: walked.length, top: top.length, inodes, used_size: used };
}

// THE RED HALF OF THE PROOF. A build that only ever passes has not
// demonstrated that it can fail, so the assert is exercised deliberately:
// PLANT_9P=<name> writes one file into the share just before the snapshot
// point and the build MUST then refuse. It exists for that proof and for
// nothing else, which is why it is loud and why it lives here beside the
// assert rather than somewhere it could be mistaken for a feature.
export async function plantIfAsked(emulator) {
  const name = process.env.PLANT_9P;
  if (!name) return null;
  const data = new TextEncoder().encode(
    "planted by PLANT_9P to prove the empty-at-snapshot assert refuses\n",
  );
  await emulator.create_file(name, data);
  console.log(
    "[harness] PLANT_9P: wrote " +
      JSON.stringify(name) +
      " into the share. The empty-at-snapshot assert MUST now refuse.",
  );
  return name;
}
