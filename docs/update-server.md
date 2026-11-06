# Update server: https://oryx.kumateck.com

Every installed desktop app checks `https://oryx.kumateck.com` for new desktop releases. This page says how an install finds updates, and what that server must serve.

## Where each install looks

| What | Where it is checked | How a new version gets there |
| --- | --- | --- |
| Desktop app (the installed shell) | **First** `https://oryx.kumateck.com/downloads/desktop/windows/latest.json`. If that fails, the connected server's own `/downloads/desktop/windows/latest.json`. If both fail, the last release this install already verified. At launch, every 30 minutes, when the app is opened again, and from **Check for updates**. | The testing release pipeline signs the installer and publishes it to the testing server, which `oryx.kumateck.com` serves. Customer servers can keep publishing their own copy, which becomes the fallback. |
| Web app the desktop loads | The connected server's `/deployment.json`, every minute while visible. The web app always comes from the server the install is connected to. | The web release for that server (testing pipeline, or the customer deployment agent). |
| Server address for a new install | The setup page fills in `https://oryx.kumateck.com` when no server is saved. The person still confirms it, or enters their own server. Installs that already have a saved server keep it. | No action. |

Before this change, an install checked only the server it was connected to, and checked nothing until a server was connected.

The gateway (`apps/gateway`) plays no part in updates.

### What stays the same

- Every feed, from either source, must be signed by the Ed25519 key compiled into the app. A feed from `oryx.kumateck.com` gets no extra trust, and a feed from the fallback gets no less checking.
- The signed feed fixes the version, platform, both architectures, size and SHA-512 of the installer. The installer is downloaded from the same origin whose feed passed, and checked against those values before and after download and again right before it runs.
- Requests send no credentials and refuse redirects. A release is offered only if it is newer than the installed one.
- Only a failure moves on to the fallback (no answer, an HTTP error, or a feed that fails verification). If `oryx.kumateck.com` answers with a valid feed that is not newer, the install is up to date and the connected server is not asked.

## Choosing another source (testing or staging)

The order is: launch setting, then build setting, then the default.

| Setting | When it applies | Rule |
| --- | --- | --- |
| `ORYX_UPDATE_ORIGIN` environment variable, when the app starts | One machine, for testing | Any server origin (`http://` or `https://`, no path). An unusable value is ignored and the build's source is used; a warning is logged. |
| `ORYX_DESKTOP_UPDATE_ORIGIN` environment variable, when the app is built | A staging build | Must be `https://`, except a loopback test server (`http://127.0.0.1`, `http://localhost`). A bad value stops the build. |
| Neither | All other builds | `https://oryx.kumateck.com` |

The Windows installed-upgrade smoke builds its test installers with `ORYX_DESKTOP_UPDATE_ORIGIN=http://127.0.0.1:3001`, so they never contact the public server.

## What the server must serve

Served over HTTPS with a publicly trusted certificate, with no redirect on these paths (plain HTTP may redirect to HTTPS; the app never asks over HTTP).

| Path | Content | Headers |
| --- | --- | --- |
| `/downloads/desktop/windows/latest.json` | The signed feed (below), at most 64 KiB | `Content-Type: application/json`, `Cache-Control: no-store` or `no-cache` |
| `/downloads/desktop/windows/<version>/OryxLiveDesktop-Setup.exe` | The exact universal (x86 + x64) NSIS installer named by the feed | `Content-Length` equal to the signed size; any `Cache-Control` |
| `/downloads/OryxLiveDesktop-Setup.exe` | Optional: the same installer, for first installs and manual upgrades from versions before 0.2.0 | |
| `/`, `/deployment.json`, `/assets/...` | The Oryx web app, for installs connected to this server | As the web release already serves them |

A missing installer version must return 404. Keep every published version directory: an install may still be downloading an older release, and a published version must never be replaced with different bytes.

### Feed format

`latest.json` is a JSON envelope:

```json
{ "payload": "<the release, as a JSON string>", "signature": "<base64 Ed25519 signature of the exact payload bytes>" }
```

The payload, once parsed:

```json
{
  "version": "0.2.3",
  "platform": "win32",
  "arch": "universal",
  "architectures": ["ia32", "x64"],
  "size": 196943951,
  "sha512": "<128 lowercase hex characters>",
  "notes": "optional release notes, up to 8000 characters"
}
```

`version` is `major.minor.patch`. The signature is made with the private key behind the `ORYX_DESKTOP_UPDATE_PUBLIC_KEY` repository variable; the app holds only the public key. Do not reformat the payload string after signing.

### Producing the artifacts

The release pipeline already does this; by hand it is:

```bash
ORYX_DESKTOP_UPDATE_PRIVATE_KEY="$(cat desktop-private.pem)" \
ORYX_DESKTOP_UPDATE_PUBLIC_KEY="$(cat desktop-public.pem)" \
bun scripts/create-desktop-update.ts publish OryxLiveDesktop-Setup.exe out
```

This writes `out/desktop/windows/<version>/OryxLiveDesktop-Setup.exe` and `out/desktop/windows/latest.json`. Copy them under the server's `/downloads/` directory: **the versioned installer first, then `latest.json`** by an atomic rename, so the feed never names an installer that is not there yet. See [desktop updates](desktop-updates.md#publish-to-the-customers-frontend) for the copy commands.

## State of the server on 2026-11-06

Checked from outside, read-only:

- `oryx.kumateck.com` serves the same files as the testing site (`http://164.90.142.68:3011`): web commit `29727eb`, branch `testing`.
- `latest.json` names desktop **0.2.3**. Its signature passes with the production public key, and the 0.2.3 installer is served with the signed size (196,943,951 bytes). A missing version returns 404.
- The feed is sent with `Cache-Control: no-cache` and plain HTTP redirects to HTTPS. Both are fine.

So the testing pipeline's existing desktop publication already keeps this server current; no pipeline change is needed. Two things to keep in mind:

1. **The testing branch is the release source.** Whatever desktop version the testing pipeline publishes reaches every install, including customer installs. Merge a desktop version bump into `testing` only when it is ready for everyone.
2. **Installs without internet** (an intranet-only customer) cannot reach `oryx.kumateck.com`. They fall back to their own server's feed, so keep publishing to customer servers that have no outbound access.

## Existing installs

This ships as desktop **0.2.4**. Shells before this change check only their connected server. They pick up this behaviour after one more update through their current path: installs connected to the testing site get it from `oryx.kumateck.com` already; customer installs need the new version published on their own server once. From then on they check `oryx.kumateck.com` first.
