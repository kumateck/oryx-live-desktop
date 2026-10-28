#!/bin/sh
# Nginx startup: retain hashed app chunks and pinned viewer assets across releases.
# Optional roots let the same copy/validation run be exercised with temporary fixtures.
set -eu
release=${1:-/usr/share/nginx/html}
kept=${2:-/srv/assets}
viewers="$release/viewers"

# A release without its local rendering engines must not start and show blank previews.
for engine in wordcraft pdfcraft gridcraft; do
  found=0
  for directory in "$viewers/$engine-"*; do
    [ -d "$directory" ] || continue
    js="$directory/dodo-$engine.js"
    wasm="$directory/dodo-${engine}_bg.wasm"
    [ -s "$js" ] && [ -s "$wasm" ] || { echo "keep-assets: missing $engine engine" >&2; exit 1; }
    magic=$(od -An -tx1 -N4 "$wasm" | tr -d ' \n')
    [ "$magic" = 0061736d ] || { echo "keep-assets: invalid $engine WASM" >&2; exit 1; }
    found=1
  done
  [ "$found" = 1 ] || { echo "keep-assets: missing $engine directory" >&2; exit 1; }
done

copy_tree() {
  source=$1
  destination=$2
  mkdir -p "$destination"
  # Add only immutable bytes; old sessions and rollback releases retain their chunks.
  find "$source" -type f | while IFS= read -r file; do
    relative=${file#"$source/"}
    target="$destination/$relative"
    [ -s "$file" ] || { echo "keep-assets: empty asset" >&2; exit 1; }
    mkdir -p "$(dirname "$target")"
    if [ -e "$target" ]; then
      cmp -s "$file" "$target" || { echo "keep-assets: immutable asset collision" >&2; exit 1; }
    else
      temporary="$target.$$.tmp"
      cp "$file" "$temporary"
      chmod 644 "$temporary"
      mv "$temporary" "$target"
    fi
  done
}
copy_tree "$release/assets" "$kept"
copy_tree "$viewers" "$kept/viewers"
# Retention is additive. Reclaim assets only during reviewed maintenance.
