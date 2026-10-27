# Customer Windows x86 and x64 installer

The installed Electron shell and the customer Docker frontend are independent. Shell releases are manual; frontend updates on `entrance-server` do not build a Windows installer. This workflow does not connect to Ubuntu or change containers.

## Build and download

The existing registered workflow file `.github/workflows/deploy-testing.yml` has an **installer-only** definition on `entrance-server`. Its `testing` branch version continues to own the testing deployment. Using the existing workflow path makes manual dispatch available without adding a new workflow to `main`.

1. Open [the installer workflow in GitHub Actions](https://github.com/kumateck/oryx-live-desktop/actions/workflows/deploy-testing.yml).
2. Choose **Run workflow**, select branch **entrance-server**, and run it. Depending on GitHub's displayed workflow registration, it may still be listed as **Deploy testing site**; the production run is named **Windows x86 and x64 installer from entrance-server**.
3. Wait for the `installer` job to succeed. It uses `windows-latest`, Node 24 and Bun 1.3.14, the frozen lockfile, and the existing `bun run --filter @oryx/desktop make:windows` NSIS build. It checks the application payloads' x86 and x64 PE headers and the installer's SHA-256, installs silently, verifies shortcuts, and launches both the connection screen and a local frontend fixture. Both launches must include the companion window.
4. Open the successful run and download **oryx-live-windows-installer** under **Artifacts**. Extract its ZIP and run **OryxLiveDesktop-Setup.exe** on the user's Windows computer (32-bit or 64-bit). The installer artifact is kept for 30 days. Smoke screenshots/logs are kept separately as **oryx-live-windows-smoke** for 14 days. The run summary records the commit and installer checksum.

With GitHub CLI and repository write access:

```bash
gh workflow run deploy-testing.yml --repo kumateck/oryx-live-desktop --ref entrance-server
gh run list --repo kumateck/oryx-live-desktop --workflow deploy-testing.yml --branch entrance-server --event workflow_dispatch --limit 5
# Replace RUN_ID with the successful installer run's ID.
gh run download RUN_ID --repo kumateck/oryx-live-desktop --name oryx-live-windows-installer --dir downloads
```

The production job refuses other branches and checks out the exact dispatched SHA. Selecting `entrance-server` is essential: other branches contain their own workflow definitions. There is no publication or SSH step in the production installer workflow. The standard customer Docker workflow still validates hosted frontend releases separately.

## Install and connect

The installer retains the existing Oryx icons, per-user installation wizard, desktop/Start-menu shortcuts and companion. It does not require a backend address to be baked into the executable.

1. Install on the user's Windows PC, then open **Oryx Live Desktop**.
2. On **Connect to Oryx**, enter **`http://CUSTOMER_SERVER_IP:3001`**, replacing `CUSTOMER_SERVER_IP` with the Ubuntu server's reachable LAN address or hostname. `127.0.0.1` would refer to the Windows PC; it is used only by the isolated CI fixture.
3. Connect and sign in with the user's Oryx account. If the customer has a trusted HTTPS frontend, use its HTTPS origin instead.
4. Use **Server → Change server** to change the saved address. Hosted frontend updates are received on reload/reopen; install a new shell build only when the Electron application changes.

Port **3001** serves the ORYX Live frontend. Port 3000 is ORYX Next; port 8080 and the Docker alias `oryx_api:5001` are backend addresses and should not be entered in the desktop connection screen.

The installer remains unsigned for Windows Authenticode. In-app shell updates use a separately verified signed release feed; see the [desktop updater setup and publishing guide](desktop-updates.md). The Windows-runner fixture verifies packaging/installation/launch without contacting the customer; actual customer network access and user sign-in are separate acceptance checks.

The main `OryxLiveDesktop-Setup.exe` contains both Windows architectures and chooses automatically. Desktop builds and the update feed require Electron 43 for 32-bit compatibility; see [runtime support and setup](desktop-updates.md#supported-windows-runtime).
