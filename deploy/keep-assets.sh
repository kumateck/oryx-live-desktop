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
  # BusyBox cp copies each entry; do not use the historically broken `cp -a src/. dst/`.
  for entry in "$source"/*; do cp -r "$entry" "$destination/"; done
  (cd "$source" && find . -type f) | while read -r file; do
    cmp -s "$source/$file" "$destination/$file" || { echo "keep-assets: $file was not copied" >&2; exit 1; }
  done
}
copy_tree "$release/assets" "$kept"
copy_tree "$viewers" "$kept/viewers"
# Copying without preserving timestamps marks current-release files fresh for retention.
find "$kept" -type f -size 0 -delete
find "$kept" -type f -mtime +30 -delete
