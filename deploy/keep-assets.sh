#!/bin/sh
# Run by the nginx image at start-up (/docker-entrypoint.d). Keeps every release's hashed files in /srv/assets, a folder
# kept across deploys, so a window opened before a release can still load the pages it has not opened yet.
# Files no release has shipped for 30 days are removed.
set -eu
mkdir -p /srv/assets
cp -an /usr/share/nginx/html/assets/. /srv/assets/
# Mark this release's files as current, so pruning never removes them however old they are.
(cd /usr/share/nginx/html/assets && find . -type f | while read -r file; do touch "/srv/assets/$file"; done)
find /srv/assets -type f -mtime +30 -delete
