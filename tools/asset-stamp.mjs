// THE ONE PLACE ASSET URLS GET THEIR VERSION, imported by BOTH the build
// stamp and the dev server so the two cannot drift.
//
// THE DEFECT THIS EXISTS TO FIX. page/_headers sets no cache-control, so
// Cloudflare Pages' defaults apply: index.html is max-age=0 and always
// fresh, while app.js, build-info.js and vendor/* are cached for four
// hours under STABLE names. index.html referenced them as bare paths, so
// every deploy opened a four-hour window in which a returning visitor ran
// NEW HTML WITH OLD JAVASCRIPT. It was found the way these things
// usually are, by someone's phone: a returning visitor got the new trust
// sentence out of the always-fresh HTML and no file panel, because the
// cached old app.js had no code to reveal it. The page still booted only
// because the old script asked for a snapshot that happened to still be
// sitting in the edge cache. Once that expires, the same mismatch is a
// dead page rather than a missing button.
//
// WHY A QUERY STRING AND NOT A HASHED FILENAME. Both were allowed. A
// content-hashed filename busts more precisely, only when a file's bytes
// change, but it needs the build AND the dev server to emit, name and
// resolve renamed files identically, and identical-in-two-places is
// exactly the property that failed here in the first place. The commit
// sha is ONE value from ONE source used verbatim by both callers, which
// is the smallest thing that can be wrong. The cost is that an unchanged
// vendor file is re-fetched after a deploy that did not touch it: about
// 850 KB, on a page that ships a 15 MB snapshot. That is noise, and it
// buys a mechanism with no second implementation to keep in step.
//
// NOT IN SCOPE: the snapshots, whose p5/p6 filenames already change when
// their contents do, and index.html itself, which is the always-fresh
// file doing the referencing.

// Referenced from page/index.html by a bare, stable name, and mutable
// across deploys. If a new one is added to the page it belongs here too.
export const STAMPED_ASSETS = [
  "app.js",
  "build-info.js",
  "vendor/xterm.js",
  "vendor/libv86.js",
  "vendor/xterm.css",
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches src="asset" or href="asset", with or without a version already
// on it, so re-stamping replaces rather than accumulating.
function refRe(asset) {
  return new RegExp(
    '((?:src|href)=")' + escapeRe(asset) + '(?:\\?v=[^"]*)?(")',
    "g",
  );
}

// Returns the rewritten html. THROWS if a scoped asset is not found,
// because the failure this guards against is silent: a build that quietly
// stopped stamping would look fine and reintroduce the original defect,
// and nobody would see it until a visitor's cache did.
export function stampAssetRefs(html, version) {
  if (!version || /[^A-Za-z0-9._-]/.test(version)) {
    throw new Error(
      "asset-stamp: refusing to stamp with an unusable version: " +
        JSON.stringify(version),
    );
  }
  let out = html;
  const missing = [];
  for (const asset of STAMPED_ASSETS) {
    const re = refRe(asset);
    if (!re.test(out)) {
      missing.push(asset);
      continue;
    }
    out = out.replace(refRe(asset), '$1' + asset + "?v=" + version + '$2');
  }
  if (missing.length) {
    throw new Error(
      "asset-stamp: these assets are in STAMPED_ASSETS but are not " +
        "referenced in the html, so they would ship unversioned: " +
        missing.join(", ") +
        ". Either the page stopped using them (remove them here) or a " +
        "reference was renamed (fix it there). Refusing to stamp a page " +
        "that would silently go back to stale-cache behaviour.",
    );
  }
  return out;
}

// The inverse, used only by the build stamp's clean-tree check: a
// working copy that differs from the committed one ONLY by these version
// markers is not a dirty tree, it is a previously stamped one.
export function stripAssetStamps(html) {
  let out = html;
  for (const asset of STAMPED_ASSETS) {
    out = out.replace(refRe(asset), '$1' + asset + '$2');
  }
  return out;
}
