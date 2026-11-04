# Inspecting the client server and manually publishing desktop 0.2.3

Run as `entrance` on the client server. Web deployment status and the desktop
installer version are separate:

```bash
cd /home/entrance/oryx-live-desktop
bash deploy/customer-docker/deploy.sh status
curl -fsS http://127.0.0.1:3001/deployment.json | python3 -m json.tool
curl -fsS http://127.0.0.1:3001/downloads/desktop/windows/latest.json \
  | python3 -c 'import json,sys; print(json.loads(json.load(sys.stdin)["payload"])["version"])'
```

Read-only verification on November 4, 2026 found the client serving web commit
`fc199f2cda497bc0bd5f2f08df85a4a347164cce` (November 3 build), signed desktop 0.2.1,
and its versioned installer. The unversioned manual installer URL returned 404.
Testing had published 0.2.3 from successful [run 41816673293](https://github.com/kumateck/oryx-live-desktop/actions/runs/41816673293).
Both feed signatures verified against the established public key fingerprint
`39dd323ad4710465b2d9170648fe08bef9f8bd3ce741b45458a87c4084f508be`.
These observations do not identify versions installed on individual PCs.

The following **manual** publication is pinned to that exact reviewed 0.2.3 feed
and installer. It requires curl, SHA tools and util-linux. It changes only the
public desktop downloads; existing connection/backend settings and web containers
are unaffected. Adjust `desktop_state` if the customer's deployment state is
configured elsewhere. The current deployment package does not automatically pull
native releases from testing. Artifact promotion remains separate unfinished work.

```bash
set -euo pipefail
desktop_state=/home/entrance/.local/state/oryx-live
desktop_public="$desktop_state/downloads"
desktop_source=http://164.90.142.68:3011/downloads
desktop_version=0.2.3
exec 9>"$desktop_state/deploy.lock"
flock -n 9 || { echo 'A deployment is running; retry when it finishes.' >&2; exit 1; }
desktop_stage=$(mktemp -d "$desktop_state/desktop-manual.XXXXXX")
trap 'rm -rf -- "$desktop_stage"' EXIT
if [ -f "$desktop_public/desktop/windows/latest.json" ]; then
  python3 - "$desktop_public/desktop/windows/latest.json" <<'PYVERSION'
import json, sys
with open(sys.argv[1]) as stream:
    current = json.loads(json.load(stream)["payload"])["version"]
if tuple(map(int, current.split("."))) > (0, 2, 3):
    raise SystemExit("The client already hosts a newer desktop; refusing a downgrade.")
PYVERSION
fi
curl --fail --show-error --silent "$desktop_source/desktop/windows/latest.json" -o "$desktop_stage/latest.json"
printf '%s  %s\n' 0a74ee99e333cd20b717279fe357c40191f9657175a21e63883c77d610b3a627 "$desktop_stage/latest.json" | sha256sum -c -
curl --fail --show-error --silent "$desktop_source/desktop/windows/$desktop_version/OryxLiveDesktop-Setup.exe" -o "$desktop_stage/OryxLiveDesktop-Setup.exe"
printf '%s  %s\n' 5fd4df909c8d9a30f0f096b9a7f4da899374a69dd3b3960166b321eb4c01237891d06df0d23e934f5efaf868d95728215d3f17f2c2211c41e60ca5114793c74e "$desktop_stage/OryxLiveDesktop-Setup.exe" | sha512sum -c -
install -d -m 0755 "$desktop_public" "$desktop_public/desktop" "$desktop_public/desktop/windows"
desktop_target="$desktop_public/desktop/windows/$desktop_version"
if [ -e "$desktop_target" ]; then
  cmp "$desktop_stage/OryxLiveDesktop-Setup.exe" "$desktop_target/OryxLiveDesktop-Setup.exe"
else
  install -d -m 0755 "$desktop_stage/$desktop_version"
  install -m 0644 "$desktop_stage/OryxLiveDesktop-Setup.exe" "$desktop_stage/$desktop_version/OryxLiveDesktop-Setup.exe"
  mv "$desktop_stage/$desktop_version" "$desktop_target"
fi
install -m 0644 "$desktop_stage/OryxLiveDesktop-Setup.exe" "$desktop_public/OryxLiveDesktop-Setup.exe.pending"
mv "$desktop_public/OryxLiveDesktop-Setup.exe.pending" "$desktop_public/OryxLiveDesktop-Setup.exe"
(cd "$desktop_public" && sha256sum OryxLiveDesktop-Setup.exe > OryxLiveDesktop-Setup.exe.sha256.pending)
chmod 0644 "$desktop_public/OryxLiveDesktop-Setup.exe.sha256.pending"
mv "$desktop_public/OryxLiveDesktop-Setup.exe.sha256.pending" "$desktop_public/OryxLiveDesktop-Setup.exe.sha256"
sync
install -m 0644 "$desktop_stage/latest.json" "$desktop_public/desktop/windows/latest.json.pending"
mv "$desktop_public/desktop/windows/latest.json.pending" "$desktop_public/desktop/windows/latest.json"
sync
curl -fsS http://127.0.0.1:3001/downloads/desktop/windows/latest.json \
  | python3 -c 'import json,sys; print(json.loads(json.load(sys.stdin)["payload"])["version"])'
```

Keep prior version directories. A different existing 0.2.3 installer causes failure
rather than replacement. Any later release needs its own verified version and
hashes; these pinned commands deliberately fail if testing advances its feed.
Installed updater-enabled Windows clients check their saved server at launch and
every 30 minutes and offer the signed update for user installation. Older clients
without an updater need the manual installer once. No client server publication
was performed during this investigation.
