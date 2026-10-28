import { readFile } from "node:fs/promises";
import { contractDigest, parse } from "./data.ts";
import { compatibility } from "./release.ts";

const policy = compatibility(parse(await readFile("deploy/customer-server/release.json", "utf8")));
const digest = contractDigest(parse(await readFile("contracts/openapi/backend.v1.json", "utf8")));
if (policy.deploymentProtocol !== 1 || !policy.backendContracts.includes(digest)) throw new Error("Review release compatibility and approve the checked-in backend contract fingerprint");
console.log(`Approved backend contract: ${digest}`);
