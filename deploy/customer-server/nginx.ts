import type { Config } from "./config.ts";
import { absolute } from "./config.ts";

export function nginxConfiguration(config: Config, env: Readonly<Record<string, string | undefined>>): string {
  const site = new URL(config.site);
  const tls = site.protocol === "https:";
  const certificate = tls ? absolute(env.ORYX_TLS_CERT_FILE ?? "") : null;
  const key = tls ? absolute(env.ORYX_TLS_KEY_FILE ?? "") : null;
  const port = site.port || (tls ? "443" : "80");
  return `# Generated from customer-owned configuration. Re-render after changing backend or site origins.
map $http_upgrade $oryx_connection_upgrade { default upgrade; "" close; }
server {
  listen ${port}${tls ? " ssl" : ""};
  server_name ${site.hostname};
  ${tls ? `ssl_certificate ${certificate};\n  ssl_certificate_key ${key};\n  ssl_protocols TLSv1.2 TLSv1.3;` : ""}
  root ${config.root}/current;
  client_max_body_size 100m;

  location /api/ {
    proxy_pass ${config.api};
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_ssl_server_name on;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_read_timeout 300s;
  }
  location /realtime/ {
    ${config.gateway ? `proxy_pass ${config.gateway};
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $oryx_connection_upgrade;
    proxy_ssl_server_name on;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_read_timeout 1h;` : "return 503;"}
  }
  location /assets/ {
    root ${config.root}/shared;
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
  location /viewers/ {
    root ${config.root}/shared;
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Content-Type-Options nosniff;
  }
  location = /deployment.json { add_header Cache-Control "no-store" always; try_files $uri =404; }
  location ~ /\\. { deny all; }
  location / { try_files $uri /index.html; add_header Cache-Control "no-cache" always; }
}
`;
}
