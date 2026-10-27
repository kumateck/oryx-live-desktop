# Customer Docker deployment

The manual installation and operations guide is [deploy/customer-docker/README.md](../deploy/customer-docker/README.md).

Production follows **`origin/entrance-server` only**, reuses `deploy/Dockerfile`'s `web` target, serves port 3001 through Compose project `oryx-live`, and joins the existing `sail` network. The separate [host-Nginx customer agent](../deploy/customer-server/README.md) is unchanged. No Codex installation is needed on the customer server.
