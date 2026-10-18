#!/bin/sh
# Run by the nginx image at start-up (/docker-entrypoint.d). Keeps every release's hashed files in /srv/assets, a folder
# kept across deploys, so a window opened before a release can still load the pages it has not opened yet.
# Files no release has shipped for 30 days are removed.
#
# Written for BusyBox (nginx:alpine): plain `cp -r` of each entry; no `cp -a src/. dst/`, which BusyBox does not copy.
set -eu
release=/usr/share/nginx/html/assets
kept=/srv/assets
mkdir -p "$kept"
# Copy this release's files over any earlier copy. Copying (not preserving times) also marks them current for pruning.
for entry in "$release"/*; do cp -r "$entry" "$kept/"; done
# Every file of this release must now be served with its full content.
(cd "$release" && find . -type f) | while read -r file; do
  cmp -s "$release/$file" "$kept/$file" || { echo "keep-assets: $file was not copied" >&2; exit 1; }
done
# Empty files are never valid build output (an earlier version of this script left some).
find "$kept" -type f -size 0 -delete
find "$kept" -type f -mtime +30 -delete
