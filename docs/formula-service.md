# Authoritative formula calculation service

`services/formula-calculation` owns the Node HTTP host, bounded worker pool and
service request validation. It imports the same pure formula core used by the
renderer from `apps/web/src/shared/formula/core`; it never imports UI components,
Electron or browser state. This replaces the obsolete Next deployment dependency.
The renderer's calculations remain provisional; the backend owns authoritative
validation/evaluation, permissions, persisted revisions, approvals and audit.

Build/release commands from the repo root (Bun **1.3.14**):

```bash
bun install --frozen-lockfile
bun run --filter @oryx/formula-calculation typecheck
bun run --filter @oryx/formula-calculation test
bun run formula:package /absolute/path/to/new-formula-release
```

The packaging command builds/tests `deploy/formula-service.Dockerfile` for Linux
amd64 and exports `image.tar` plus `manifest.json`. Source-content and engine
hashes use sorted relative paths and SHA-256 of each file; the engine covers core
and runtime TypeScript, excluding tests/config. The source-content hash also
covers tests, manifests, lockfile, packaging script and Dockerfile. The manifest
pins the exact image identity and archive checksum and records source SHA/dirty
state. The image embeds its engine hash and refuses a different configured hash.
Use clean, reviewed source for production release artifacts. No registry push or
server deployment is performed by packaging. Keep bundles outside the checkout.

The customer release workflow packages an `oryx-formula-<SHA>` artifact after its
existing release checks pass on testing/entrance-server. This independent
artifact is deliberately not activated by a site or Electron update. Transfer it
to the customer backend deployment account through the approved release process;
the backend freezes and verifies its image/hash before maintenance. No Next
checkout/image, host Node SDK or registry connectivity is needed on that server.

The backend's `docs/customer-formula-service.md` contains the exact customer
installation, verification, upgrade and rollback commands. Its deployer generates
a root-only master workload secret once, provisions a read-only shared Docker
volume, starts a release-specific service, waits for `/ready`, and probes the
backend's own `IsReadyAsync` after API activation. Do not expose port 3101 on the
host, publish secrets, bypass user permissions or weaken TLS to troubleshoot it.
The service's `/health` only checks liveness; `/ready` checks whether execution is
enabled. Both endpoints contain no workload data. POST
`/internal/formula/v1/validate` and `/internal/formula/v1/evaluate` require the
workload bearer token. Request bytes/concurrency/deadlines/cache are bounded;
workers are recycled after deadlines/errors. Runtime runs as UID 10001 with a
read-only filesystem, no capabilities, no-new-privileges and resource limits.
