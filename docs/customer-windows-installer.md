# Customer Windows x86 and x64 installer

The installed Electron shell and the customer Docker frontend are independent. Production shell releases are manual; frontend updates on `entrance-server` do not build a Windows installer. The production installer path does not connect to customer Ubuntu or change its containers. Testing-only stages publish the demo frontend and build a testing installer only when desktop inputs change.

## Build and download

The single production workflow is `.github/workflows/customer-docker.yml` (**Customer release pipeline**). Its Windows job is opt-in and runs after release validation. The same workflow handles testing; web-only testing pushes skip Windows, while unpublished desktop changes build and publish the installer after the testing web deployment. A missing publication record triggers the initial dual-architecture release, including replacement of the old x64-only download. See [testing deployment](deployment.md#testing-site).

For manual dispatch, GitHub requires this workflow file on the repository default branch as well as on the selected release branch. The repository default is `main`; register the same workflow there before relying on **Run workflow**. Its push filters still allow only testing and entrance-server, so registering it does not deploy main. The automatic testing publication path does not require manual dispatch. See [GitHub's manual workflow requirements](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

1. Open [the installer workflow in GitHub Actions](https://github.com/kumateck/oryx-live-desktop/actions/workflows/customer-docker.yml).
2. Choose **Run workflow**, select branch **entrance-server**, enable **build_windows**, and run it.
3. Wait for the `windows-installer` job to succeed. It uses `windows-latest`, Node 24 and Bun 1.3.14, the frozen lockfile, and the existing `bun run --filter @oryx/desktop make:windows` NSIS build. It checks the application payloads' x86 and x64 PE headers and the installer's SHA-256, installs silently, verifies shortcuts, and launches both the connection screen and a local frontend fixture. Both launches must include the companion window.
4. Open the successful run and download **oryx-live-windows-installer** under **Artifacts**. Extract its ZIP and run **OryxLiveDesktop-Setup.exe** on the user's Windows computer (32-bit or 64-bit). The installer artifact is kept for 30 days. Smoke screenshots/logs are kept separately as **oryx-live-windows-smoke** for 14 days. The run summary records the commit and installer checksum.

With GitHub CLI and repository write access:

```bash
gh workflow run customer-docker.yml --repo kumateck/oryx-live-desktop --ref entrance-server -F build_windows=true
gh run list --repo kumateck/oryx-live-desktop --workflow customer-docker.yml --branch entrance-server --event workflow_dispatch --limit 5
# Replace RUN_ID with the successful installer run's ID.
gh run download RUN_ID --repo kumateck/oryx-live-desktop --name oryx-live-windows-installer --dir downloads
```

The production job refuses other branches and checks out the exact dispatched SHA. Selecting `entrance-server` is essential: other branches contain their own workflow definitions. There is no publication or SSH step in the production installer workflow. The same workflow validates the frontend first, then runs this job sequentially. Automatic frontend updates skip the installer job.

## Publish the first customer download

The customer Docker web build does not include an EXE. A missing `/home/entrance/.local/state/oryx-live/downloads/OryxLiveDesktop-Setup.exe` means the desktop release has not been copied to that server. Web deployment and Cron polling do not download native artifacts automatically.

The main v0.2.0 installer contains **both x86 and x64**. The older v0.1.0 artifact is x64-only; do not mistake it for the dual-architecture release. After the corrected testing pipeline's **Build Windows installer** and **Publish tested desktop to testing** jobs succeed, its main download at `http://164.90.142.68:3011/downloads/OryxLiveDesktop-Setup.exe` is updated. Use the successful run's artifact and SHA-256 summary for the approved installer you distribute to customers.

Download and extract `oryx-live-windows-installer` on your computer, then copy the EXE to the administrator's home directory (run this outside the customer SSH session):

```bash
scp /path/to/extracted/OryxLiveDesktop-Setup.exe entrance@CUSTOMER_SERVER_IP:/home/entrance/OryxLiveDesktop-Setup.exe
```

On the customer server, check its SHA-256 against the successful Windows run summary, then publish it atomically:

```bash
sha256sum /home/entrance/OryxLiveDesktop-Setup.exe
install -d -m 0755 /home/entrance/.local/state/oryx-live/downloads
install -m 0644 /home/entrance/OryxLiveDesktop-Setup.exe /home/entrance/.local/state/oryx-live/downloads/OryxLiveDesktop-Setup.exe.pending
mv -f /home/entrance/.local/state/oryx-live/downloads/OryxLiveDesktop-Setup.exe.pending /home/entrance/.local/state/oryx-live/downloads/OryxLiveDesktop-Setup.exe
```

The existing read-only downloads bind mount serves the file immediately; no container restart is required. Users can then download it from `http://CUSTOMER_SERVER_IP:3001/downloads/OryxLiveDesktop-Setup.exe`. Use `/downloads/` with the **a** included. The installed shell connects to that customer's frontend origin; the installer does not embed the testing server's address.

## Install and connect

The installer retains the existing Oryx icons, per-user installation wizard, desktop/Start-menu shortcuts and companion. It does not require a backend address to be baked into the executable.

1. Install on the user's Windows PC, then open **Oryx Live Desktop**.
2. On **Connect to Oryx**, enter **`http://CUSTOMER_SERVER_IP:3001`**, replacing `CUSTOMER_SERVER_IP` with the Ubuntu server's reachable LAN address or hostname. `127.0.0.1` would refer to the Windows PC; it is used only by the isolated CI fixture.
3. Connect and sign in with the user's Oryx account. If the customer has a trusted HTTPS frontend, use its HTTPS origin instead.
4. Use **Server → Change server** to change the saved address. Hosted frontend updates are received on reload/reopen; install a new shell build only when the Electron application changes.

Port **3001** serves the ORYX Live frontend. Port 3000 is ORYX Next; port 8080 and the Docker alias `oryx_api:5001` are backend addresses and should not be entered in the desktop connection screen.

The installer remains unsigned for Windows Authenticode. In-app shell updates use a separately verified signed release feed; see the [desktop updater setup and publishing guide](desktop-updates.md). The Windows-runner fixture verifies packaging/installation/launch without contacting the customer; actual customer network access and user sign-in are separate acceptance checks.

The main `OryxLiveDesktop-Setup.exe` contains both Windows architectures and chooses automatically. Desktop builds and the update feed require Electron 43 for 32-bit compatibility; see [runtime support and setup](desktop-updates.md#supported-windows-runtime).
