import { writeFile } from "node:fs/promises";
import { nginxConfiguration } from "./nginx.ts";
import { readConfig } from "./config.ts";

const config = readConfig({ ORYX_SITE_URL: "http://127.0.0.1:18090", ORYX_API_ORIGIN: "http://127.0.0.1:18091", ORYX_GATEWAY_UPSTREAM: "http://127.0.0.1:18092" });
await writeFile("/tmp/oryx-customer-nginx.conf", `events {}\nhttp {\n${nginxConfiguration(config, {})}\n}\n`);
